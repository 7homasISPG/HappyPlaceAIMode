# --- START OF FILE agent_service.py ---

# --- Python & FastAPI Imports ---
import json
import asyncio
from fastapi import HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, Any, List

# --- LangChain Core Imports ---
from langchain_core.messages import AIMessage, HumanMessage, BaseMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import tool

# --- LangChain Integration Imports ---
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import AgentExecutor, create_openai_tools_agent

# --- Local Application Imports ---
from app.auth.schemas import RunAgentRequest
from app.agents.tools import ToolRegistry
# Queues are no longer needed for this synchronous flow
# from app.state import frontend_input_queue, backend_output_queue


# ====================================================================
# Helper Function: Deserialize frontend messages into LangChain messages
# ====================================================================
def deserialize_messages(serialized_messages: List[Dict[str, Any]]) -> List[BaseMessage]:
    if not serialized_messages:
        return []
    deserialized = []
    for msg in serialized_messages:
        if msg["type"] == "human":
            deserialized.append(HumanMessage(content=msg["content"]))
        elif msg["type"] == "ai":
            tool_calls = msg.get("tool_calls", [])
            deserialized.append(AIMessage(content=msg.get("content", ""), tool_calls=tool_calls))
    return deserialized


# ====================================================================
# Main Agent Execution: Synchronous Request/Response
# ====================================================================
async def execute_dynamic_agent(
    payload: RunAgentRequest,
    db: AsyncIOMotorDatabase,
    user_id: str
) -> str:
    """
    Runs an agent session synchronously and returns the final answer directly.
    This is designed for a standard HTTP request/response flow.
    """
    print("--- [Agent Service] Starting synchronous agent execution ---")

    try:
        # --- 1. Initialize Chat Model ---
        chat_model_config = payload.chat_model_config
        provider = chat_model_config.get("provider", "").lower()
        model_name = chat_model_config.get("model_name")
        if "openai" in provider:
            llm = ChatOpenAI(model_name=model_name, temperature=0, streaming=False)
        elif "google" in provider:
            llm = ChatGoogleGenerativeAI(model=model_name, temperature=0)
        else:
            raise ValueError(f"Unsupported LLM provider: {provider}")

        # --- 2. Define a tool for asking the user ---
        # In a sync flow, we can't wait for input. The agent's job is to
        # formulate the question, which becomes the final response for this turn.
        @tool
        def ask_user_for_input(question: str) -> str:
            """
            If you don't have enough information to use another tool, use this
            tool to formulate a clarifying question for the user. The user's answer
            will be provided in a subsequent request. This tool returns the question you asked.
            """
            print(f"--- [Agent Service] Agent needs to ask user: '{question}' ---")
            return f"CLARIFICATION_NEEDED: {question}"

        # --- 3. Load DB tools and include the interactive tool ---
        tools_config = payload.tools_config or []
        tool_names = [t.get("name") for t in tools_config]
        tool_registry = ToolRegistry(db=db, user_id=user_id)
        db_tools = await tool_registry.get_tools(tool_names)

        tools = db_tools + [ask_user_for_input]
        tool_name_list = [t.name for t in tools]
        print(f"--- [Agent Service] Loaded tools: {tool_name_list} ---")

        # --- 4. Build agent prompt ---
        prompt = ChatPromptTemplate.from_messages([
            (
                "system",
                "You are a helpful assistant. You have access to the following tools: {tool_names}. "
                "If you do not have enough information to use a tool, you MUST use the 'ask_user_for_input' tool to ask for the missing information. "
                "Do not make up information or parameters."
            ),
            MessagesPlaceholder(variable_name="chat_history"),
            ("human", "{input}"),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        # --- 5. Create AgentExecutor ---
        agent = create_openai_tools_agent(llm, tools, prompt)
        agent_executor = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            handle_parsing_errors=True,
        )

        # --- 6. Prepare chat history & initial query ---
        chat_history = deserialize_messages(payload.chat_history)
        input_query = payload.input_data.get("message")
        if not input_query:
            raise ValueError("Input data must contain a 'message' field.")

        # --- 7. Invoke agent ---
        print(f"\n--- [Agent Service] Invoking agent with input: '{input_query}' ---")
        result = await agent_executor.ainvoke({
            "input": input_query,
            "tool_names": ", ".join(tool_name_list),
            "chat_history": chat_history,
        })
        final_answer = result.get("output", "Task completed.")

        # --- 8. Return the final answer as a string ---
        print(f"--- [Agent Service] Agent finished with final answer: '{final_answer}' ---")
        return final_answer

    except Exception as e:
        import traceback
        traceback.print_exc()
        error_message = f"An error occurred during agent execution: {str(e)}"
        print(f"--- [Agent Service] ERROR: {error_message} ---")
        # Return the error message as the response
        return error_message