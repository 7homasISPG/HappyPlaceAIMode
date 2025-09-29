import asyncio
import os
import json
from typing import Dict, List, Any, Optional

from pydantic import BaseModel, Field
import autogen


# Shared queue for frontend inputs
frontend_input_queue = asyncio.Queue()

class FrontendUserProxy(autogen.UserProxyAgent):
    def __init__(self, **kwargs):
        super().__init__(**kwargs)

    def get_human_input(self, prompt: str) -> str:
        print(f"[UserProxy] Waiting for frontend input. Prompt: {prompt}")
        # Block until frontend puts an answer
        return asyncio.run(frontend_input_queue.get())

# ===================================================================
# 1. Pydantic Models
# ===================================================================
class Task(BaseModel):
    name: str
    description: str
    endpoint: Optional[str] = None
    params_schema: Dict[str, Any]

class AgentSpec(BaseModel):
    name: str
    system_message: str
    tasks: List[Task] = Field(default_factory=list)

class SuperAgentConfigRequest(BaseModel):
    prompt: str
    supervisor_system_message: Optional[str] = None
    assistants: List[AgentSpec]
    max_turns: int = 15

# ===================================================================
# 2. Helper and Builder Functions
# ===================================================================
def is_termination_message(message: Dict) -> bool:
    content = message.get("content")
    return isinstance(content, str) and content.rstrip().endswith("TERMINATE")

def execute_mock_api_tool(endpoint: str, **kwargs) -> str:
    print(f"--- [AutoGen Runner] MOCK API CALL to: {endpoint} with params: {kwargs} ---")
    return json.dumps({"status": "success", "data": f"Mock response for {endpoint}"})

def build_agents_and_manager(config: SuperAgentConfigRequest) -> Dict[str, Any]:
    # ... (This function is unchanged from the previous version)
    function_map = {}
    tools_by_assistant = {}
    for spec in config.assistants:
        tools_list = []
        for task in spec.tasks:
            if task.endpoint:
                def make_tool(endpoint_val):
                    return lambda **kwargs: execute_mock_api_tool(endpoint=endpoint_val, **kwargs)
                function_map[task.name] = make_tool(task.endpoint)
            tools_list.append({"type": "function", "function": { "name": task.name, "description": task.description, "parameters": task.params_schema }})
        tools_by_assistant[spec.name] = tools_list

    assistant_agents = [autogen.AssistantAgent(name=spec.name, system_message=spec.system_message, llm_config={"config_list": [{"model": "gpt-4o-2024-05-13", "api_key": os.getenv("OPENAI_API_KEY")}], "tools": tools_by_assistant.get(spec.name)}) for spec in config.assistants]
    supervisor = autogen.AssistantAgent(name="Supervisor", system_message=config.supervisor_system_message or "You are the supervisor.", llm_config={"config_list": [{"model": "gpt-4o-2024-05-13", "api_key": os.getenv("OPENAI_API_KEY")}]})
    user_proxy = FrontendUserProxyAgent(name="UserProxy", human_input_mode="ALWAYS", code_execution_config=False, function_map=function_map, is_termination_msg=is_termination_message)
    groupchat = autogen.GroupChat(agents=[user_proxy, supervisor, *assistant_agents], messages=[], max_round=config.max_turns)
    manager = autogen.GroupChatManager(groupchat=groupchat, llm_config={"config_list": [{"model": "gpt-4o-2024-05-13", "api_key": os.getenv("OPENAI_API_KEY")}]})
    
    return {"user_proxy": user_proxy, "manager": manager, "groupchat": groupchat}

# ===================================================================
# 3. The Main Entry Point Function
# ===================================================================
def run_conversation_from_config(config: SuperAgentConfigRequest) -> str:
    """
    Takes a full agent configuration, runs the conversation, and returns the
    final plain text result from the supervisor.
    """
    print("--- [AutoGen Runner] Starting conversational session ---")
    
    agent_components = build_agents_and_manager(config)
    user_proxy = agent_components["user_proxy"]
    manager = agent_components["manager"]
    groupchat = agent_components["groupchat"]

    # Run the chat synchronously
    user_proxy.initiate_chat(manager, message=config.prompt)

    # <<< IMPROVED LOGIC to find the Supervisor's final answer >>>
    # The supervisor's final message ending in TERMINATE is usually the true final answer.
    # We search backwards through the chat history to find it.
    
    final_message = "The task has been completed, but a final summary was not provided."
    
    # Check if the conversation produced any messages
    if not groupchat.messages:
        print("--- [AutoGen Runner] Session finished. No messages were generated. ---")
        return "The conversation ended without a result."

    # Get the very last message in the chat
    last_message = groupchat.messages[-1]
    last_content = str(last_message.get("content", "")).strip()

    # Case 1: The last message is the termination message AND it's just "TERMINATE".
    # In this case, the real answer is the message before it.
    if last_content == "TERMINATE" and len(groupchat.messages) > 1:
        # Get the second-to-last message
        second_last_message = groupchat.messages[-2]
        final_message_content = second_last_message.get("content")
        
        # Ensure it's a valid string before using it
        if isinstance(final_message_content, str):
            final_message = final_message_content.strip()
        
    # Case 2: The last message is a full sentence that includes "TERMINATE".
    elif last_content.endswith("TERMINATE"):
        final_message = last_content.replace("TERMINATE", "").strip()
        
    # Case 3: The conversation ended for other reasons (e.g., max_turns).
    # We'll take the content of the last message as the best available result.
    else:
        final_message_content = last_message.get("content")
        if isinstance(final_message_content, str):
            final_message = final_message_content.strip()

    print(f"--- [AutoGen Runner] Session finished. Final message: {final_message} ---")
    
    return final_message