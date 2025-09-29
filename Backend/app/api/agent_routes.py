# --- START OF FILE agent_routes.py ---

from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import List, Optional

from app.db.database import get_database
from app.db import crud
from app.auth.dependencies import get_current_user
from app.auth.schemas import UserPublic, AgentSpec # AgentSpec is reused for update input
from app.auth.models import AgentConfiguration
from bson.objectid import ObjectId

router = APIRouter(prefix="/agents", tags=["Agent Management"])


@router.post("", response_model=AgentConfiguration, status_code=status.HTTP_201_CREATED)
async def create_new_agent(
    agent_spec: AgentSpec,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Creates and saves a new agent configuration, including its knowledge base sources.
    A public API key will be automatically generated for the agent.
    """
    agent_config = AgentConfiguration(
        user_id=ObjectId(current_user.id),
        name=agent_spec.name,
        system_message=agent_spec.system_message,
        tasks=[task.model_dump() for task in agent_spec.tasks],
        knowledge_base_files=agent_spec.knowledge_base_files,
        # public_api_key is generated in crud.create_agent
    )
    created_agent = await crud.create_agent(db, agent_config)
    return created_agent


# <<< PUBLIC ENDPOINT MUST COME BEFORE /{agent_id} TO AVOID ROUTING CONFLICTS >>>
@router.get("/public/{agent_id}", response_model=AgentConfiguration, summary="Get public agent configuration (requires API Key)")
async def get_public_agent_details(
    agent_id: str,
    x_api_key: Optional[str] = Header(None),  # API key from header
    db=Depends(get_database)
):
    """
    Retrieves the details for a specific agent using its ID and a public API key.
    This endpoint is intended for public embeds/widgets.
    """
    if not x_api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="X-API-Key header is missing."
        )

    agent = await crud.get_agent_by_public_key_and_id(db, agent_id=agent_id, public_api_key=x_api_key)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or invalid API Key."
        )
    return agent


@router.get("/{agent_id}", response_model=AgentConfiguration)
async def get_agent_details(
    agent_id: str,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Retrieves the details for a single, specific agent by its ID.
    """
    agent = await crud.get_agent_by_id(db, agent_id=agent_id, user_id=current_user.id)
    if not agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or you do not have permission to view it."
        )
    return agent


@router.get("", response_model=List[AgentConfiguration])
async def get_my_agents(
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Lists all agents created by the currently authenticated user.
    """
    return await crud.get_agents_for_user(db, user_id=current_user.id)

# <<< NEW ENDPOINTS FOR UPDATING AND DELETING AGENTS >>>

@router.put("/{agent_id}", response_model=AgentConfiguration)
async def update_existing_agent(
    agent_id: str,
    agent_spec: AgentSpec, # Reuse AgentSpec for update input
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Updates an existing agent configuration.
    Requires the agent_id and the updated agent_spec payload.
    """
    updated_agent = await crud.update_agent(db, agent_id, current_user.id, agent_spec)
    if not updated_agent:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or you do not have permission to update it."
        )
    return updated_agent

@router.delete("/{agent_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_existing_agent(
    agent_id: str,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Deletes an agent configuration.
    """
    success = await crud.delete_agent(db, agent_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agent not found or you do not have permission to delete it."
        )
    return # FastAPI automatically handles 204 No Content response