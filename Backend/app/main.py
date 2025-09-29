# --- START OF FILE app/main.py ---

import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query, status, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.orchestrator import initialize_orchestrator
from app.db.database import connect_to_mongo, close_mongo_connection, get_database

# --- This import section is now complete and correct ---
from app.api import (
    routes as api_routes,
    auth_routes as auth_api_routes,
    agent_routes as agent_api_routes,
    rules_routes as rules_api_routes, # Assuming this was already added
    workflow_routes as workflow_api_routes,
    tool_routes as tool_api_routes,
    trigger_routes as trigger_api_routes # <<< FIX: ADDED THIS IMPORT
)

#from app.api import websocket_routes


from app.state import frontend_input_queue, backend_output_queue, SESSION_EVENTS
from app.auth.dependencies import get_current_user_for_websocket
from app.auth.schemas import UserPublic
from app.auth.models import ChatLog
from app.db import crud

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Manages application startup and shutdown events using the recommended lifespan protocol.
    """
    print("--- Application Lifespan: Startup ---")
    await connect_to_mongo()
    app.state.graph = initialize_orchestrator()
    print("--- Application Lifespan: Startup Complete ---")

    yield  # The application runs here

    print("--- Application Lifespan: Shutdown ---")
    await close_mongo_connection()
    print("--- Application Lifespan: Shutdown Complete ---")

# Create the main FastAPI application instance and attach the lifespan manager
app = FastAPI(title="Conversational RAG Orchestrator", lifespan=lifespan)

# --- Middleware Configuration ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Using wildcard for simplicity, can be restricted to http://localhost:5173
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- WebSocket Endpoint ---
@app.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    session_id: str = Query(...),
    token: str = Query(...)
):
    try:
        user: UserPublic = await get_current_user_for_websocket(token)
        if not user:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    except Exception as e:
        await websocket.close(code=status.WS_1011_INTERNAL_ERROR)
        return

    await websocket.accept()
    print(f"✅ WebSocket connected: {user.email} session={session_id}")

    db = get_database()

    session_event = SESSION_EVENTS.get(session_id)
    if session_event:
        session_event.set()
        print(f"--- [WebSocket] Session event set for {session_id}")

    async def listen_to_client(ws: WebSocket, sid: str, current_user: UserPublic, db_conn):
        try:
            while True:
                data = await ws.receive_text()
                print(f"--- [WebSocket] Received from client (session={sid}): {data} ---")
                log = ChatLog(session_id=sid, user_id=current_user.id, sender="user", content=data)
                if db_conn:
                    await crud.create_chat_log(db_conn, log)
                await frontend_input_queue.put(data)
        except WebSocketDisconnect:
            print(f"--- [WebSocket] Client disconnected from session {sid} ---")
            await frontend_input_queue.put("User has disconnected.")

    async def send_to_client(ws: WebSocket, sid: str, current_user: UserPublic, db_conn):
        try:
            while True:
                message = await backend_output_queue.get()
                if message == "END_OF_CONVERSATION":
                    print(f"--- [WebSocket] End of conversation for session={sid}. Closing. ---")
                    await ws.close()
                    break
                print(f"--- [WebSocket] Sending to client (session={sid}): {message} ---")
                log = ChatLog(session_id=sid, user_id=current_user.id, sender="agent", content=message)
                if db_conn:
                    await crud.create_chat_log(db_conn, log)
                await ws.send_text(message)
                backend_output_queue.task_done()
        except asyncio.CancelledError:
            print(f"--- [WebSocket] Send task cancelled for session={sid}. ---")

    try:
        listen_task = asyncio.create_task(listen_to_client(websocket, session_id, user, db))
        send_task = asyncio.create_task(send_to_client(websocket, session_id, user, db))
        print(f"--- [WebSocket] Started listen/send tasks for session={session_id} ---")
        await asyncio.gather(listen_task, send_task)
    finally:
        if session_id in SESSION_EVENTS:
            del SESSION_EVENTS[session_id]
            print(f"--- [WebSocket] Cleaned up session event for session={session_id}. ---")
            
app.include_router(auth_api_routes.router, prefix="/api")

# Resource management routers for agents, rules, workflows, and triggers.
# Their order among themselves is less critical, but they should come before the general router.
app.include_router(agent_api_routes.router, prefix="/api")
app.include_router(rules_api_routes.router, prefix="/api")
app.include_router(workflow_api_routes.router, prefix="/api")
app.include_router(trigger_api_routes.router, prefix="/api")
app.include_router(tool_api_routes.router, prefix="/api")


# The main operational router containing `/ask`, `/run_agent`, etc. should be last.
# This ensures that a request to `/api/workflows/some-id` is not mistakenly
# matched by a more generic rule if one existed in `api_routes`.
app.include_router(api_routes.router, prefix="/api")

@app.get("/")
async def root():
    """Root endpoint to confirm that the server is running."""
    return {"message": "Conversational RAG Orchestrator is running!"}