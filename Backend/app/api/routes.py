# --- START OF FILE routes.py ---

import os
import json
import shutil
import asyncio
import uuid # <<< NEW IMPORT
from typing import List, Dict, Any, Optional

from fastapi import (
    APIRouter, Depends, HTTPException, BackgroundTasks, # <<< BackgroundTasks IMPORT
    UploadFile, File, Request, status, Header
)
from pydantic import BaseModel, HttpUrl, Field

from app.services import agent_service 

from motor.motor_asyncio import AsyncIOMotorDatabase 
# --- Core Application Imports ---
from app.orchestrator import (
    run_agent_session,
    SUPERVISOR_PROFILE,
    ASSISTANT_CONFIGS,
    load_supervisor_profile,
    load_assistants_config
)
from app.autogen_runner3 import SuperAgentConfigRequest
from app.data.data_ingestion_pipeline import run_ingestion_pipeline
from app.data.usage import load_from_source
from app.data.chunker import chunk_documents
from app.data.embedder import embed_and_store_chunks
from app.rag.pipeline import get_rag_answer

# --- Database and Authentication Imports ---
from app.db.database import get_database
from app.db import crud
from app.auth.dependencies import get_current_user
from app.auth.models import ChatLog, AgentConfiguration
from app.auth.schemas import (
    UserPublic,
    AgentSpec,
    RunAgentRequest,
    Task,
    ChatMessageTrigger,        # <<< NEW IMPORT
    FormSubmissionTrigger      # <<< NEW IMPORT
)


from app.agents.tools import ToolRegistry

# <<< NEW LANGCHAIN IMPORTS >>>
from langchain_openai import ChatOpenAI
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferWindowMemory
from langchain.agents import AgentExecutor, create_openai_tools_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder



# --- Pydantic Models for this router ---

class UserQueryRequest(BaseModel):
    query: str
    lang: Optional[str] = "en"
    agent_id: Optional[str] = None
    session_id: Optional[str] = None

class RAGQueryRequest(BaseModel):
    query: str
    lang: Optional[str] = "en"
    session_id: Optional[str] = None

class URLIngestRequest(BaseModel):
    url: HttpUrl

class SupervisorProfileRequest(BaseModel):
    name: str
    model: str
    persona: str
    supervisor_system_message: str

class AssistantsConfigRequest(BaseModel):
    assistants: List[AgentSpec]



router = APIRouter()
KNOWLEDGE_BASE_DIR = "Knowledge_Base"
os.makedirs(KNOWLEDGE_BASE_DIR, exist_ok=True)

# ====================================================================
# AI Agent Execution Endpoint (REWRITTEN FOR SYNCHRONOUS RESPONSE)
# ====================================================================
@router.post("/run_agent", tags=["AI Execution"], summary="Execute a configured AI Agent and get a direct response")
async def run_ai_agent(
    payload: RunAgentRequest,
    current_user: UserPublic = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Executes a LangChain agent session synchronously and returns the final answer.
    This endpoint is for single-turn interactions. If the agent needs more
    information, its response will be a question for the user.
    """
    print("--- [API] /run_agent called for synchronous execution ---")

    try:
        # Directly await the agent service execution. No background task.
        final_answer = await agent_service.execute_dynamic_agent(
            payload=payload,
            db=db,
            user_id=current_user.id
        )

        # Return the final answer from the agent service directly to the client.
        return {"answer": final_answer}
        
    except Exception as e:
        # This is a safeguard. The service is designed to return error strings,
        # but this handles unexpected exceptions during the call.
        print(f"--- [API] /run_agent UNEXPECTED ERROR: {str(e)} ---")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )
# --- Chat & History Endpoints ---

# In app/api/routes.py

@router.post("/ask", tags=["Core"])
async def smart_ask(
    payload: UserQueryRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
) -> Dict:
    app_graph = request.app.state.graph
    if not app_graph:
        raise HTTPException(status_code=500, detail="Orchestrator not initialized.")

    try:
        session_id = payload.session_id or str(uuid.uuid4())
        user_log = ChatLog(session_id=session_id, user_id=current_user.id, sender="user", content=payload.query)
        await crud.create_chat_log(db, user_log)

        final_assistant_configs = []

        if payload.agent_id:
            print(f"--- [API /ask] Using dynamic agent with ID: {payload.agent_id} ---")
            agent_config_model = await crud.get_agent_by_id(db, agent_id=payload.agent_id, user_id=current_user.id)
            if not agent_config_model:
                raise HTTPException(status_code=404, detail="Agent not found or you don't have permission.")
            # .model_dump() returns a dictionary, which is correct.
            final_assistant_configs = [agent_config_model.model_dump()]
        else:
            print(f"--- [API /ask] Using default globally-loaded assistants ---")
            # ASSISTANT_CONFIGS is loaded from JSON and should be a list of dictionaries.
            final_assistant_configs = ASSISTANT_CONFIGS

        if not final_assistant_configs:
            # This is a valid state if no agents are configured.
            # The orchestrator will handle this by defaulting to RAG.
            print("--- [API /ask] No agents configured for this run. Proceeding with orchestrator for RAG fallback. ---")

        print(f"--- [API /ask] Invoking orchestrator with {len(final_assistant_configs)} assistant(s). ---")
        
        inputs = {
            "question": payload.query, "lang": payload.lang,
            "supervisor_profile": SUPERVISOR_PROFILE, 
            "assistant_configs": final_assistant_configs
        }
        
        final_state = app_graph.invoke(inputs)
        response = final_state.get("final_response") or {}
        response["session_id"] = session_id

        if response.get("type") == "interactive_session_start":
            
            # <<< THIS IS THE FIX >>>
            # Add a check to ensure every item is a dictionary before unpacking.
            # This makes the code resilient to malformed data in assistant_config.json.
            
            valid_specs = []
            for spec in final_assistant_configs:
                if isinstance(spec, dict):
                    valid_specs.append(spec)
                else:
                    # Log a warning if we find invalid data, then skip it.
                    print(f"--- [API /ask] WARNING: Found an invalid entry in assistant configs, skipping. Entry was: {spec} ---")

            if not valid_specs:
                # If after filtering there are no valid agents, we cannot start an interactive session.
                # This is an edge case that indicates a configuration error.
                # We can return a graceful error or let the system proceed with an empty agent list.
                # For now, let's return an error to make the problem visible.
                 raise HTTPException(
                    status_code=500,
                    detail="Interactive session requested, but no valid agent configurations were found."
                )

            assistant_specs = [AgentSpec(**spec) for spec in valid_specs]
            # <<< END OF FIX >>>

            agent_config_payload = SuperAgentConfigRequest(
                prompt=payload.query,
                supervisor_system_message=SUPERVISOR_PROFILE.get("supervisor_system_message"),
                assistants=assistant_specs, max_turns=25
            )
            main_loop = asyncio.get_running_loop()
            # Pass session_id for Redis-based synchronization
            background_tasks.add_task(run_agent_session, agent_config_payload, main_loop, session_id)
            
            system_log = ChatLog(session_id=session_id, user_id=current_user.id, sender="system", content=json.dumps({"message": "Starting interactive agent session."}))
            await crud.create_chat_log(db, system_log)
        else:
            rag_log = ChatLog(session_id=session_id, user_id=current_user.id, sender="rag", content=json.dumps(response))
            await crud.create_chat_log(db, rag_log)

        return response
        
    except Exception as e:
        print(f"ERROR in smart_ask: {type(e).__name__}: {e}")
        # Add more detail to the exception for easier debugging
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"An internal server error occurred: {str(e)}")

@router.post("/ask/public/{agent_id}", tags=["Core"], summary="Ask a question to a public agent (requires API Key)")
async def public_smart_ask(
    agent_id: str,
    payload: UserQueryRequest,
    request: Request,
    background_tasks: BackgroundTasks,
    x_api_key: Optional[str] = Header(None), # API key from header
    db=Depends(get_database)
) -> Dict:
    """
    Allows unauthenticated users to interact with a specific agent using a public API key.
    The agent's configuration is loaded dynamically and processed by the central orchestrator.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key header is missing."
        )

    # 1. Validate the API key and get the agent configuration
    agent_config_model = await crud.get_agent_by_public_key_and_id(db, agent_id=agent_id, public_api_key=x_api_key)
    if not agent_config_model:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or invalid API Key."
        )

    app_graph = request.app.state.graph
    if not app_graph:
        raise HTTPException(status_code=500, detail="Orchestrator not initialized.")

    try:
        # Use the agent owner's user_id for all logging
        owner_user_id = agent_config_model.user_id
        session_id = payload.session_id or str(uuid.uuid4())
        
        # Log the incoming user query
        user_log = ChatLog(session_id=session_id, user_id=owner_user_id, sender="user", content=payload.query)
        await crud.create_chat_log(db, user_log)

        # 2. Prepare inputs for the orchestrator
        # Use the dynamically loaded agent's configuration
        final_assistant_configs = [agent_config_model.model_dump()]

        print(f"--- [API /ask/public] Invoking orchestrator for agent: {agent_config_model.name} ---")
        
        inputs = {
            "question": payload.query,
            "lang": payload.lang,
            "supervisor_profile": SUPERVISOR_PROFILE, # Using the global supervisor profile
            "assistant_configs": final_assistant_configs
        }
        
        # 3. Invoke the central orchestrator (LangGraph)
        final_state = app_graph.invoke(inputs)
        response = final_state.get("final_response") or {}
        response["session_id"] = session_id

        # 4. Handle the orchestrator's decision
        if response.get("type") == "interactive_session_start":
            # The orchestrator decided a multi-agent conversation is needed
            
            assistant_specs = [AgentSpec(**spec) for spec in final_assistant_configs]
            agent_config_payload = SuperAgentConfigRequest(
                prompt=payload.query,
                supervisor_system_message=SUPERVISOR_PROFILE.get("supervisor_system_message"),
                assistants=assistant_specs,
                max_turns=25
            )
            main_loop = asyncio.get_running_loop()
            
            # <<< THIS IS THE CRITICAL FIX >>>
            # Pass the session_id to the background task for Redis synchronization
            background_tasks.add_task(run_agent_session, agent_config_payload, main_loop, session_id)
            # <<< END OF FIX >>>
            
            # Log that an interactive session was initiated
            system_log_content = json.dumps({"message": f"Starting interactive agent session for agent '{agent_config_model.name}'."})
            system_log = ChatLog(session_id=session_id, user_id=owner_user_id, sender="system", content=system_log_content)
            await crud.create_chat_log(db, system_log)
        else:
            # The orchestrator decided a direct RAG response was sufficient
            # The 'response' variable already contains the full structured JSON from the RAG pipeline
            rag_log = ChatLog(session_id=session_id, user_id=owner_user_id, sender="rag", content=json.dumps(response))
            await crud.create_chat_log(db, rag_log)

        return response
        
    except Exception as e:
        print(f"ERROR in public_smart_ask: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred.")


@router.post("/rag", tags=["Core"])
async def direct_rag_query(
    payload: RAGQueryRequest,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
) -> Dict:
    """
    Performs a direct RAG query against the knowledge base without agentic routing.
    """
    try:
        session_id = payload.session_id or str(uuid.uuid4())
        user_log = ChatLog(session_id=session_id, user_id=current_user.id, sender="user", content=payload.query)
        await crud.create_chat_log(db, user_log)

        rag_response = get_rag_answer(query=payload.query, lang=payload.lang)
        rag_response["session_id"] = session_id

        rag_log = ChatLog(session_id=session_id, user_id=current_user.id, sender="rag", content=json.dumps(rag_response))
        await crud.create_chat_log(db, rag_log)

        return rag_response
    except Exception as e:
        print(f"ERROR in direct_rag_query: {type(e).__name__}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/chat-history/{session_id}", response_model=List[ChatLog], tags=["Core"])
async def get_session_history(
    session_id: str,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    history = await crud.get_chat_history(db, user_id=current_user.id, session_id=session_id)
    return [ChatLog(**log) for log in history]


# --- Admin & Data Endpoints ---

@router.post("/upload", tags=["Admin & Data"])
async def upload_file(file: UploadFile = File(...), current_user: UserPublic = Depends(get_current_user)):
    file_path = os.path.join(KNOWLEDGE_BASE_DIR, file.filename)
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        docs = load_from_source(file_path)
        if not docs:
            raise HTTPException(status_code=400, detail="Could not process file.")
        chunks = chunk_documents(docs)
        embed_and_store_chunks(chunks)
        return {"message": f"Successfully ingested '{file.filename}'. {len(chunks)} chunks added."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {e}")

@router.post("/ingest-url", tags=["Admin & Data"])
async def ingest_from_url(payload: URLIngestRequest, current_user: UserPublic = Depends(get_current_user)):
    url_to_ingest = str(payload.url)
    try:
        docs = load_from_source(url_to_ingest)
        if not docs:
            raise HTTPException(status_code=400, detail=f"Could not load content from URL: {url_to_ingest}.")
        chunks = chunk_documents(docs)
        embed_and_store_chunks(chunks)
        return {"message": f"Successfully ingested content from '{url_to_ingest}'. {len(chunks)} chunks added."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process URL: {str(e)}")

@router.post("/ingest-knowledge-base", tags=["Admin & Data"])
async def ingest_knowledge_base(background_tasks: BackgroundTasks, current_user: UserPublic = Depends(get_current_user)):
    background_tasks.add_task(run_ingestion_pipeline)
    return {"message": "Knowledge base ingestion started in the background. Check server logs for progress."}


# --- Studio & Default Config Endpoints ---

@router.get("/get-supervisor-profile", response_model=Dict, tags=["Studio Config"])
async def get_supervisor_profile(current_user: UserPublic = Depends(get_current_user)):
    return SUPERVISOR_PROFILE

@router.post("/save-supervisor-profile", tags=["Studio Config"])
async def save_supervisor_profile(profile: SupervisorProfileRequest, current_user: UserPublic = Depends(get_current_user)):
    with open("supervisor_profile.json", "w") as f:
        json.dump(profile.model_dump(), f, indent=2)
    load_supervisor_profile()
    return {"message": "Supervisor profile saved and reloaded."}

@router.get("/get-assistants-config", response_model=List[AgentSpec], tags=["Studio Config"])
async def get_assistants_config(current_user: UserPublic = Depends(get_current_user)):
    return ASSISTANT_CONFIGS

@router.post("/save-assistants-config", tags=["Studio Config"])
async def save_assistants_config(config: AssistantsConfigRequest, current_user: UserPublic = Depends(get_current_user)):
    full_config = {"assistants": [a.model_dump() for a in config.assistants]}
    with open("assistant_config.json", "w") as f:
        json.dump(full_config, f, indent=2)
    load_assistants_config()
    return {"message": "Assistants configuration saved and reloaded."}