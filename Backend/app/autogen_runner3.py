# --- START OF FILE app/autogen_runner.py ---

import os
import json
import asyncio
from typing import Dict, List, Any, Optional

from pydantic import BaseModel, Field
import autogen

from app.state import frontend_input_queue, backend_output_queue
class FrontendUserProxy(autogen.UserProxyAgent):
    """
    UserProxy that broadcasts Supervisor/Agent messages to the frontend via backend_output_queue.
    """
    def __init__(self, loop: asyncio.AbstractEventLoop, **kwargs):
        super().__init__(**kwargs)
        self.loop = loop

    def receive(
        self,
        message: Dict,
        sender: autogen.Agent,
        request_reply: Optional[bool] = None,
        silent: Optional[bool] = False
    ):
        super().receive(message, sender, request_reply, silent)

        # Skip duplicates / internal
        if request_reply is True:
            return
        if sender.name in [self.name, "chat_manager"]:
            return

        # Build content
        content_to_send = message.get("content", "")
        if not content_to_send and message.get("tool_calls"):
            tool_name = message["tool_calls"][0]["function"]["name"]
            content_to_send = f"Calling tool `{tool_name}`..."

        # Broadcast to frontend
        if content_to_send:
            payload = {
                "type": "agent_message",
                "sender": sender.name,
                "text": str(content_to_send)
            }
            print(f"[UserProxy] Broadcasting: {payload}")

            asyncio.run_coroutine_threadsafe(
                backend_output_queue.put(json.dumps(payload)),
                self.loop
            )

    def get_human_input(self, prompt: str) -> str:
        print("[UserProxy] Waiting for user input from frontend...")
        future = asyncio.run_coroutine_threadsafe(
            frontend_input_queue.get(), self.loop
        )
        user_reply = future.result()
        print(f"[UserProxy] Received user input: {user_reply}")
        return user_reply


# --- The rest of the file is unchanged ---

# Pydantic Models (Unchanged)
class Task(BaseModel): name: str; description: str; endpoint: Optional[str] = None; params_schema: Dict[str, Any]
class AgentSpec(BaseModel): name: str; system_message: str; tasks: List[Task] = Field(default_factory=list)
class SuperAgentConfigRequest(BaseModel): prompt: str; supervisor_system_message: Optional[str] = None; assistants: List[AgentSpec]; max_turns: int = 15

# Helper and Builder Functions (Unchanged)
def is_termination_message(message: Dict) -> bool:
    content = message.get("content")
    return isinstance(content, str) and content.rstrip().endswith("TERMINATE")

def execute_mock_api_tool(endpoint: str, **kwargs) -> str:
    print(f"--- [AutoGen Runner] MOCK API CALL to: {endpoint} with params: {kwargs} ---")
    return json.dumps({"status": "success", "data": f"Mock response for {endpoint}"})

def build_agents_and_manager(config: SuperAgentConfigRequest, loop: asyncio.AbstractEventLoop) -> Dict[str, Any]:
    function_map = {}
    tools_by_assistant = {}
    for spec in config.assistants:
        tools_list = []
        for task in spec.tasks:
            if task.endpoint:
                def make_tool(endpoint_val): return lambda **kwargs: execute_mock_api_tool(endpoint=endpoint_val, **kwargs)
                function_map[task.name] = make_tool(task.endpoint)
            tools_list.append({"type": "function", "function": { "name": task.name, "description": task.description, "parameters": task.params_schema }})
        tools_by_assistant[spec.name] = tools_list

    assistant_agents = [autogen.AssistantAgent(name=spec.name, system_message=spec.system_message, llm_config={"config_list": [{"model": "gpt-4o-2024-05-13", "api_key": os.getenv("OPENAI_API_KEY")}], "tools": tools_by_assistant.get(spec.name)}) for spec in config.assistants]
    supervisor = autogen.AssistantAgent(name="Supervisor", system_message=config.supervisor_system_message or "You are the supervisor.", llm_config={"config_list": [{"model": "gpt-4o-2024-05-13", "api_key": os.getenv("OPENAI_API_KEY")}]})
    
    user_proxy = FrontendUserProxy(name="UserProxy", human_input_mode="ALWAYS", code_execution_config=False, function_map=function_map, is_termination_msg=is_termination_message, loop=loop)
    
    groupchat = autogen.GroupChat(agents=[user_proxy, supervisor, *assistant_agents], messages=[], max_round=config.max_turns)
    manager = autogen.GroupChatManager(groupchat=groupchat, llm_config={"config_list": [{"model": "gpt-4o-2024-05-13", "api_key": os.getenv("OPENAI_API_KEY")}]})
    print(f"--- [AutoGen Runner] Built agents and manager with assistants: {[a.name for a in config.assistants]} ---")
    return {"user_proxy": user_proxy, "manager": manager, "groupchat": groupchat}

    
def run_conversation_from_config(config: SuperAgentConfigRequest, loop: asyncio.AbstractEventLoop) -> str:
    print("--- [AutoGen Runner] Starting conversational session ---")

    agent_components = build_agents_and_manager(config, loop)
    user_proxy = agent_components["user_proxy"]
    supervisor = next(agent for agent in agent_components["groupchat"].agents if agent.name == "Supervisor")
    manager = agent_components["manager"]
    groupchat = agent_components["groupchat"]
    print(f"--- [AutoGen Runner] Agents in group chat: {[agent.name for agent in groupchat.agents]} ---")

    # --- Hook Supervisor to broadcast messages ---
    original_send = supervisor.send

    def send_with_broadcast(message, *args, **kwargs):
        result = original_send(message, *args, **kwargs)

        # Determine message content
        if isinstance(message, dict):
            text = message.get("content", "")
        else:
            text = str(message)  # fallback if it's a string

        payload = {
            "type": "agent_message",
            "sender": supervisor.name,
            "text": text
        }

        asyncio.run_coroutine_threadsafe(
            backend_output_queue.put(json.dumps(payload)),
            loop
        )
        return result


    supervisor.send = send_with_broadcast
    print("--- [AutoGen Runner] Supervisor hooked to broadcast messages ---")

    # Run the conversation in a background thread so it doesn’t block the event loop
    future = loop.run_in_executor(
        None,  # default thread pool
        lambda: user_proxy.initiate_chat(manager, message=config.prompt)
    )
    print("--- [AutoGen Runner] Conversation thread started ---")

    def on_done(fut):
        try:
            fut.result()
        except Exception as e:
            print(f"--- [AutoGen Runner] Error in chat thread: {e} ---")
            asyncio.run_coroutine_threadsafe(
                backend_output_queue.put(json.dumps({"type": "final_answer", "text": f"Conversation crashed: {e}"})),
                loop
            )
            asyncio.run_coroutine_threadsafe(backend_output_queue.put("END_OF_CONVERSATION"), loop)
            return

        # Broadcast all messages in conversation
        for msg in groupchat.messages:
            payload = {
                "type": "agent_message",
                "sender": msg.get("sender_name", "Unknown"),
                "text": msg.get("content", "")
            }
            asyncio.run_coroutine_threadsafe(backend_output_queue.put(json.dumps(payload)), loop)

        # Signal conversation end
        asyncio.run_coroutine_threadsafe(backend_output_queue.put("END_OF_CONVERSATION"), loop)
        print("--- [AutoGen Runner] Session finished. Messages sent to frontend. ---")

    # Attach callback so final summary is sent after chat ends
    future.add_done_callback(on_done)

    return "Agent conversation started."
