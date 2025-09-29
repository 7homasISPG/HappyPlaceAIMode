# --- START OF FILE app/orchestrator.py (Corrected) ---

import os
import json
from typing import TypedDict, List, Literal, Dict, Optional, Any

from pydantic import BaseModel, Field
from langchain_openai import ChatOpenAI
from langgraph.graph import StateGraph, END

from app.config import settings
from app.rag.pipeline import get_rag_answer
from app.autogen_runner3 import run_conversation_from_config 

# --- Global variables to hold loaded configurations ---
# Initialize them as empty. They will be populated at app startup.
SUPERVISOR_PROFILE: Dict = {}
ASSISTANT_CONFIGS: List[Dict] = []


# --- TOP-LEVEL CONFIGURATION LOADING FUNCTIONS ---
# These functions are designed to be called ONCE at application startup.
def load_supervisor_profile():
    """Loads the supervisor profile from a JSON file into the global variable."""
    global SUPERVISOR_PROFILE
    try:
        with open("supervisor_profile.json", "r") as f:
            SUPERVISOR_PROFILE = json.load(f)
        print(f"--- Loaded supervisor profile: {SUPERVISOR_PROFILE.get('name', 'Unnamed')} ---")
    except FileNotFoundError:
        SUPERVISOR_PROFILE = {"supervisor_system_message": "You are a helpful supervisor."}
        print(f"--- WARNING: supervisor_profile.json not found. Using default profile. ---")
    except Exception as e:
        SUPERVISOR_PROFILE = {"supervisor_system_message": "You are a helpful supervisor."}
        print(f"--- WARNING: Error loading supervisor profile: {e}. Using default. ---")

def load_assistants_config():
    """Loads the default assistant configurations from a JSON file into the global variable."""
    global ASSISTANT_CONFIGS
    try:
        with open("assistant_config.json", "r") as f:
            data = json.load(f)
            # Correctly extract the LIST from the "assistants" key.
            ASSISTANT_CONFIGS = data.get("assistants", [])
        print(f"--- Loaded {len(ASSISTANT_CONFIGS)} default assistants from assistant_config.json ---")
    except FileNotFoundError:
        ASSISTANT_CONFIGS = []
        print(f"--- WARNING: assistant_config.json not found. No default assistants loaded. ---")
    except Exception as e:
        ASSISTANT_CONFIGS = []
        print(f"--- WARNING: Error loading assistant_config.json: {e}. No default assistants loaded. ---")


# --- MAIN INITIALIZER FOR STARTUP ---
def initialize_orchestrator():
    """
    Main initialization function called once on app startup via the lifespan manager.
    It loads configurations and compiles the LangGraph.
    """
    print("--- Initializing Orchestrator ---")
    
    # Load all configurations from their dedicated functions
    load_supervisor_profile()
    load_assistants_config()

    llm = ChatOpenAI(model=settings.LLM_MODEL_NAME, temperature=0, api_key=settings.OPENAI_API_KEY)

    # --- LangGraph Definition ---
    class GraphState(TypedDict):
        question: str
        lang: str
        rag_answer: Optional[Dict]
        agent_decision: Optional[str]
        final_response: Optional[Dict]
        assistant_configs: List[Dict]
        supervisor_profile: Dict

    # --- NODE 1: Perform RAG ---
    def structured_rag_node(state: GraphState) -> Dict[str, Any]:
        print("--- [LangGraph] Node 1: Running Structured RAG ---")
        rag_result = get_rag_answer(state["question"], state["lang"])
        return {"rag_answer": rag_result}

    # --- NODE 2: Decide the Route ---
    def route_query_node(state: GraphState) -> Dict[str, str]:
        print("--- [LangGraph] Node 2: Routing Query ---")
        
        # This logic is now robust. It correctly checks the configs for the specific run.
        assistant_configs_for_this_run = state.get("assistant_configs", [])
        
        if not assistant_configs_for_this_run:
            print("--- [LangGraph] No agents configured for this run. Defaulting to RAG_Is_Sufficient. ---")
            return {"agent_decision": "RAG_Is_Sufficient"}
            
        class RouterTool(BaseModel):
            decision: Literal["Invoke_AutoGen_Conversation", "RAG_Is_Sufficient"] = Field(description="Choose 'Invoke_AutoGen_Conversation' for complex tasks. Choose 'RAG_Is_Sufficient' for simple informational questions.")
        
        structured_llm = llm.with_structured_output(RouterTool)
        prompt = f"""You are an expert routing agent. Based on the user's query, decide if a direct answer from a knowledge base is sufficient or if a team of AI agents is needed.

        **CRITERIA:**
        - If the query is a direct informational question (e.g., "What are...", "How do I..."), choose 'RAG_Is_Sufficient'.
        - If the query is a command or a request for an action (e.g., "Book a demo.", "Help me schedule..."), choose 'Invoke_AutoGen_Conversation'.

        **User Query:** "{state['question']}"
        """
        result = structured_llm.invoke(prompt)
        print(f"--- [LangGraph] Routing Decision: {result.decision} ---")
        return {"agent_decision": result.decision}

    # --- NODE 3: Format Final Output ---
    def format_rag_output_node(state: GraphState) -> Dict[str, Dict]:
        print("--- [LangGraph] Node 3a: Formatting RAG Output ---")
        return {"final_response": state["rag_answer"]}
        
    def format_agent_output_node(state: GraphState) -> Dict[str, Dict]:
        print("--- [LangGraph] Node 3b: Formatting Agent Output ---")
        return {"final_response": {"type": "interactive_session_start"}}

    # --- Define the Workflow ---
    workflow = StateGraph(GraphState)
    workflow.add_node("structured_rag", structured_rag_node)
    workflow.add_node("route_query", route_query_node)
    workflow.add_node("format_rag_output", format_rag_output_node)
    workflow.add_node("format_agent_output", format_agent_output_node)
    
    workflow.set_entry_point("structured_rag")
    workflow.add_edge("structured_rag", "route_query")
    
    workflow.add_conditional_edges(
        "route_query",
        lambda state: state["agent_decision"],
        {
            "RAG_Is_Sufficient": "format_rag_output",
            "Invoke_AutoGen_Conversation": "format_agent_output"
        }
    )

    workflow.add_edge("format_rag_output", END)
    workflow.add_edge("format_agent_output", END)
    
    app_graph = workflow.compile()
    print("--- Orchestrator Initialized: LangGraph is ready. ---")
    
    return app_graph

# --- TOP-LEVEL HELPER FOR BACKGROUND TASKS ---
def run_agent_session(config, loop, session_id: str): # Added session_id for Redis
    """Helper function to run the AutoGen session in a background task."""
    print(f"--- [Background Task] Kicking off AutoGen session for session_id: {session_id} ---")
    # This assumes you have implemented the Redis-based wait logic from our previous discussions
    # For example: await redis_manager.wait_for_session(session_id)
    run_conversation_from_config(config, loop)
    print(f"--- [Background Task] AutoGen session has finished for session_id: {session_id}. ---")