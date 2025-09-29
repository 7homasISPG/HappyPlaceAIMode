# --- START OF FILE app/api/trigger_routes.py ---

from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Dict, Any, Optional

# --- Database and Authentication Imports ---
from app.db.database import get_database
from app.auth.schemas import ChatMessageTrigger, FormSubmissionTrigger

router = APIRouter(prefix="/trigger", tags=["Workflow Triggers"])

@router.post("/chat_message", status_code=status.HTTP_200_OK)
async def handle_chat_message_trigger(
    payload: ChatMessageTrigger,
    # In a real app, you'd authenticate this with a specific API key
    # associated with the workflow, not a user token.
    x_workflow_api_key: Optional[str] = Header(None), # For securing the trigger
    db=Depends(get_database) # Access to DB for workflow lookup
):
    """
    Endpoint to receive a chat message and trigger a workflow.
    Requires a workflow-specific API key for security (X-Workflow-API-Key header).
    """
    if not x_workflow_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Workflow-API-Key header is missing. This trigger requires authentication."
        )

    # TODO: In a real implementation, you would:
    # 1. Validate x_workflow_api_key against a key stored with the workflow.
    #    e.g., workflow = await crud.get_workflow_by_api_key(db, payload.flow_id, x_workflow_api_key)
    # 2. Retrieve the full workflow definition using payload.flow_id.
    # 3. Queue/Start the workflow execution with the payload data.
    
    print(f"--- [TRIGGER] Chat Message Received for Flow ID: {payload.flow_id} ---")
    print(f"Message: {payload.message}")
    print(f"Session ID: {payload.session_id}")
    print(f"User ID: {payload.user_id}")
    
    return {"message": "Chat message received, workflow triggered (mock)."}

@router.post("/form_submission", status_code=status.HTTP_200_OK)
async def handle_form_submission_trigger(
    payload: FormSubmissionTrigger,
    x_workflow_api_key: Optional[str] = Header(None), # For securing the trigger
    db=Depends(get_database)
):
    """
    Endpoint to receive a form submission and trigger a workflow.
    Requires a workflow-specific API key for security (X-Workflow-API-Key header).
    """
    if not x_workflow_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-Workflow-API-Key header is missing. This trigger requires authentication."
        )

    # TODO: Real implementation would validate the key and queue the workflow.
    
    print(f"--- [TRIGGER] Form Submission Received for Flow ID: {payload.flow_id} ---")
    print(f"Form Data: {payload.form_data}")

    return {"message": "Form submission received, workflow triggered (mock)."}