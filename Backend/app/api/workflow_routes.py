# --- START OF FILE app/api/workflow_routes.py (REFACTORED) ---

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
import uuid

# --- Core Application Imports ---
from app.db.database import get_database
from app.db import crud
from app.auth.dependencies import get_current_user
from app.auth.schemas import (
    UserPublic, 
    WorkflowCreate, 
    WorkflowResponse,
    WorkflowExecutionRequest, 
    RunAgentRequest
)
from app.auth.models import WorkflowInDB
from app.services import agent_service

router = APIRouter(prefix="/workflows", tags=["Workflow Management"])

# ====================================================================
# Workflow Definition CRUD Endpoints (No changes here)
# ====================================================================
# ... (all CRUD functions remain the same) ...
@router.post(
    "",
    response_model=WorkflowResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new workflow definition"
)
async def create_new_workflow(
    workflow_create: WorkflowCreate,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Creates and saves a new workflow definition for the authenticated user.
    """
    created_workflow = await crud.create_workflow(db, workflow_create, current_user.id)
    return WorkflowResponse(
        id=str(created_workflow.id),
        name=created_workflow.name,
        description=created_workflow.description,
        definition=created_workflow.definition
    )

@router.get(
    "",
    response_model=List[WorkflowResponse],
    summary="List all workflows for the current user"
)
async def get_my_workflows(
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Lists all workflows created by the currently authenticated user.
    """
    workflows = await crud.list_workflows_for_user(db, user_id=current_user.id)
    return [
        WorkflowResponse(
            id=str(workflow.id),
            name=workflow.name,
            description=workflow.description,
            definition=workflow.definition
        )
        for workflow in workflows
    ]

@router.get(
    "/public/{workflow_id}",
    response_model=WorkflowResponse,
    summary="Get public workflow definition (for forms, etc.)"
)
async def get_public_workflow_details(
    workflow_id: str,
    db=Depends(get_database)
):
    """
    Retrieves the public details for a single workflow by its ID.
    This is an unauthenticated endpoint.
    """
    workflow = await crud.get_public_workflow_by_id(db, workflow_id=workflow_id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or is not public."
        )
    return WorkflowResponse(
        id=str(workflow.id),
        name=workflow.name,
        description=workflow.description,
        definition=workflow.definition
    )

@router.get(
    "/{workflow_id}",
    response_model=WorkflowResponse,
    summary="Get workflow details by ID (authenticated)"
)
async def get_workflow_details(
    workflow_id: str,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Retrieves the details for a single workflow by its ID for the authenticated user.
    """
    workflow = await crud.get_workflow_by_id(db, workflow_id=workflow_id, user_id=current_user.id)
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to view it."
        )
    return WorkflowResponse(
        id=str(workflow.id),
        name=workflow.name,
        description=workflow.description,
        definition=workflow.definition
    )

@router.put(
    "/{workflow_id}",
    response_model=WorkflowResponse,
    summary="Update an existing workflow"
)
async def update_existing_workflow(
    workflow_id: str,
    workflow_update: WorkflowCreate,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Updates an existing workflow definition for the authenticated user.
    """
    updated_workflow = await crud.update_workflow(db, workflow_id, current_user.id, workflow_update)
    if not updated_workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to update it."
        )
    return WorkflowResponse(
        id=str(updated_workflow.id),
        name=updated_workflow.name,
        description=updated_workflow.description,
        definition=updated_workflow.definition
    )

@router.delete(
    "/{workflow_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a workflow"
)
async def delete_existing_workflow(
    workflow_id: str,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Deletes a workflow definition for the authenticated user.
    """
    success = await crud.delete_workflow(db, workflow_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Workflow not found or you do not have permission to delete it."
        )
    return

# ====================================================================
# Workflow Execution Endpoint (REWRITTEN FOR SYNCHRONOUS AGENT STEPS)
# ====================================================================

@router.post(
    "/{workflow_id}/execute",
    tags=["Workflow Execution"],
    summary="Execute a saved workflow",
    response_model=Dict[str, Any]
)
async def execute_workflow(
    workflow_id: str,
    payload: WorkflowExecutionRequest,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Executes a saved workflow. If an AI Agent node is reached, it will
    run the agent synchronously and return its final answer as the result
    of this workflow step.
    """
    print(f"--- [ORCHESTRATOR] Executing workflow {workflow_id} ---")
    
    # ... (Workflow fetching and trigger node finding logic is unchanged) ...
    workflow = await crud.get_workflow_by_id(db, workflow_id=workflow_id, user_id=current_user.id)
    if not workflow or not workflow.definition:
        raise HTTPException(status_code=404, detail="Workflow not found or has no definition.")

    nodes = workflow.definition.get("nodes", [])
    edges = workflow.definition.get("edges", [])
    target_node_ids = {edge['target'] for edge in edges}
    trigger_nodes = [node for node in nodes if node['id'] not in target_node_ids]

    if not trigger_nodes:
        raise HTTPException(status_code=400, detail="Workflow has no trigger node.")
    
    current_node = trigger_nodes[0]
    current_data = payload.input_data
    
    print(f"--- [ORCHESTRATOR] Starting with Trigger: {current_node.get('data', {}).get('label')} ---")

    next_step_edge = next((edge for edge in edges if edge['source'] == current_node['id']), None)
    if not next_step_edge:
        return {"result": "Workflow started but has no connected steps."}

    next_node_id = next_step_edge['target']
    current_node = next((node for node in nodes if node['id'] == next_node_id), None)
    
    if not current_node:
        raise HTTPException(status_code=400, detail=f"Graph is broken. Edge points to non-existent node ID {next_node_id}.")
        
    node_type = current_node.get("type")

    # <<< THIS IS THE CORE LOGIC CHANGE >>>
    if node_type == "aiAgentNode":
        print(f"--- [ORCHESTRATOR] AI Agent Node found. Executing synchronously. ---")
        try:
            agent_data = current_node.get("data", {})
            agent_input_data = {"message": current_data.get("message")}
            if not agent_input_data["message"]:
                raise ValueError("Input data for AI Agent node must contain a 'message' field.")

            run_agent_payload = RunAgentRequest(
                input_data=agent_input_data,
                chat_model_config=agent_data.get("chatModel") or {},
                memory_config=agent_data.get("memory"),
                tools_config=agent_data.get("tools", []),
                chat_history=payload.chat_history or []
            )
            
            # Directly await the agent service. No background task or WebSocket.
            final_answer = await agent_service.execute_dynamic_agent(
                payload=run_agent_payload,
                db=db,
                user_id=current_user.id
            )
            
            # Return the agent's answer as the result of the workflow execution.
            return {
                "result": final_answer,
                "workflow_status": "completed",
                "final_node_type": "aiAgentNode"
            }

        except Exception as e:
            print(f"--- [ORCHESTRATOR] UNEXPECTED ERROR during agent node execution: {str(e)} ---")
            raise HTTPException(status_code=500, detail=f"An unexpected error occurred in the agent node: {str(e)}")

    else:
        # This part remains for other, non-interactive node types
        return {"result": f"Reached node '{current_node.get('data', {}).get('label')}' but execution logic is not yet implemented for type '{node_type}'."}