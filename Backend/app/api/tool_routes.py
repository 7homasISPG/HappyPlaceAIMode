# --- START OF FILE app/api/tool_routes.py ---

from fastapi import APIRouter, Depends
from typing import List

from app.db.database import get_database
from app.db import crud
from app.auth.dependencies import get_current_user
from app.auth.schemas import UserPublic, ToolCreate, ToolResponse
from app.auth.models import ToolInDB

router = APIRouter(prefix="/tools", tags=["Tool Management"])


@router.get("", response_model=List[ToolResponse])
async def get_my_tools(
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database),
):
    """Lists all reusable tools created by the currently authenticated user."""
    tools_from_db: List[ToolInDB] = await crud.get_tools_for_user(db, user_id=current_user.id)

    # Explicitly cast ObjectId -> str for id
    return [
        ToolResponse(
            id=str(tool.id),
            name=tool.name,
            description=tool.description,
            endpoint=tool.endpoint,
            params_schema=tool.params_schema,
        )
        for tool in tools_from_db
    ]


@router.post("", response_model=List[ToolResponse], summary="Save all tools")
async def save_all_tools(
    tools: List[ToolCreate],
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database),
):
    """
    Replaces the user's entire tool collection with the provided list.
    This corresponds to the 'Save All Tools' button.
    """
    updated_tools_from_db: List[ToolInDB] = await crud.update_tools_for_user(db, tools, current_user.id)

    # Explicitly cast ObjectId -> str for id
    return [
        ToolResponse(
            id=str(tool.id),
            name=tool.name,
            description=tool.description,
            endpoint=tool.endpoint,
            params_schema=tool.params_schema,
        )
        for tool in updated_tools_from_db
    ]
