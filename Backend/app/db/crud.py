# --- START OF FILE: app/db/crud.py (Corrected) ---
from motor.motor_asyncio import AsyncIOMotorDatabase
from bson.objectid import ObjectId
from typing import List, Optional
import uuid

from app.auth.schemas import UserCreate, DecisionTableCreate, AgentSpec, WorkflowCreate
from app.auth.utils import get_password_hash
from app.auth.models import (
    UserInDB,
    ChatLog,
    AgentConfiguration,
    DecisionTableInDB,
    WorkflowInDB
)
from app.auth.models import ToolInDB
from app.auth.schemas import ToolCreate



# === User CRUD Operations ===

async def get_user_by_email(db: AsyncIOMotorDatabase, email: str) -> Optional[UserInDB]:
    """Retrieves a user document from the database by email."""
    user_doc = await db["users"].find_one({"email": email})
    if user_doc:
        return UserInDB(**user_doc)
    return None

async def get_user_by_id(db: AsyncIOMotorDatabase, user_id: str) -> Optional[UserInDB]:
    """Retrieves a user document from the database by their ID."""
    try:
        user_doc = await db["users"].find_one({"_id": ObjectId(user_id)})
        if user_doc:
            return UserInDB(**user_doc)
    except Exception:
        return None
    return None

async def create_user(db: AsyncIOMotorDatabase, user_in: UserCreate) -> UserInDB:
    """Creates a new user document in the database."""
    hashed_password = get_password_hash(user_in.password)
    user_doc = {"email": user_in.email, "hashed_password": hashed_password}
    result = await db["users"].insert_one(user_doc)
    created_user = await db["users"].find_one({"_id": result.inserted_id})
    return UserInDB(**created_user)

# === Chat Log CRUD Operations ===

async def create_chat_log(db: AsyncIOMotorDatabase, log: ChatLog):
    """Saves a chat log entry to the database."""
    log_doc = log.model_dump(by_alias=True)
    await db["chat_logs"].insert_one(log_doc)

async def get_chat_history(db: AsyncIOMotorDatabase, user_id: str, session_id: str) -> List[ChatLog]:
    """Retrieves the chat history for a specific session and user."""
    history = []
    cursor = db["chat_logs"].find({"user_id": ObjectId(user_id), "session_id": session_id}).sort("timestamp", 1)
    async for doc in cursor:
        history.append(ChatLog(**doc))
    return history

# === Agent Configuration CRUD ===

async def create_agent(db: AsyncIOMotorDatabase, agent_data: AgentConfiguration) -> AgentConfiguration:
    """Creates a new agent configuration in the 'agents' collection."""
    agent_doc = agent_data.model_dump(by_alias=True)
    if agent_doc.get("public_api_key") is None:
        agent_doc["public_api_key"] = str(uuid.uuid4())
    result = await db["agents"].insert_one(agent_doc)
    created_agent = await db["agents"].find_one({"_id": result.inserted_id})
    return AgentConfiguration(**created_agent)

async def get_agents_for_user(db: AsyncIOMotorDatabase, user_id: str) -> List[AgentConfiguration]:
    """Retrieves all agent configurations for a specific user from the 'agents' collection."""
    agents = []
    cursor = db["agents"].find({"user_id": ObjectId(user_id)})
    async for agent_doc in cursor:
        agents.append(AgentConfiguration(**agent_doc))
    return agents

async def get_agent_by_id(db: AsyncIOMotorDatabase, agent_id: str, user_id: str) -> Optional[AgentConfiguration]:
    """Retrieves a specific agent configuration for a given user."""
    try:
        agent = await db["agents"].find_one({"_id": ObjectId(agent_id), "user_id": ObjectId(user_id)})
        if agent:
            return AgentConfiguration(**agent)
    except Exception:
        return None
    return None

async def get_agent_by_public_key_and_id(db: AsyncIOMotorDatabase, agent_id: str, public_api_key: str) -> Optional[AgentConfiguration]:
    """
    Retrieves a specific agent configuration using its ID and a public API key.
    """
    try:
        agent = await db["agents"].find_one({"_id": ObjectId(agent_id), "public_api_key": public_api_key})
        if agent:
            return AgentConfiguration(**agent)
    except Exception:
        return None
    return None

async def update_agent(db: AsyncIOMotorDatabase, agent_id: str, user_id: str, agent_data: AgentSpec) -> Optional[AgentConfiguration]:
    """Updates an existing agent configuration."""
    try:
        update_data = agent_data.model_dump(by_alias=True, exclude_unset=True)
        result = await db["agents"].update_one(
            {"_id": ObjectId(agent_id), "user_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        if result.modified_count == 1:
            return await get_agent_by_id(db, agent_id, user_id)
    except Exception:
        pass
    return None

async def delete_agent(db: AsyncIOMotorDatabase, agent_id: str, user_id: str) -> bool:
    """Deletes an agent configuration."""
    try:
        result = await db["agents"].delete_one({"_id": ObjectId(agent_id), "user_id": ObjectId(user_id)})
        return result.deleted_count == 1
    except Exception:
        return False

# === Decision Table CRUD ===

async def create_decision_table(db: AsyncIOMotorDatabase, table_data: DecisionTableCreate, user_id: str) -> DecisionTableInDB:
    """Creates a new decision table definition in the 'decision_tables' collection."""
    table_doc = table_data.model_dump(by_alias=True)
    table_doc["user_id"] = ObjectId(user_id)
    result = await db["decision_tables"].insert_one(table_doc)
    created_table = await db["decision_tables"].find_one({"_id": result.inserted_id})
    return DecisionTableInDB(**created_table)

async def get_decision_table_by_id(db: AsyncIOMotorDatabase, table_id: str, user_id: str) -> Optional[DecisionTableInDB]:
    """Retrieves a specific decision table definition for a given user."""
    try:
        table_doc = await db["decision_tables"].find_one({"_id": ObjectId(table_id), "user_id": ObjectId(user_id)})
        if table_doc:
            return DecisionTableInDB(**table_doc)
    except Exception:
        return None
    return None

async def list_decision_tables_for_user(db: AsyncIOMotorDatabase, user_id: str) -> List[DecisionTableInDB]:
    """Retrieves all decision table definitions for a specific user."""
    tables = []
    cursor = db["decision_tables"].find({"user_id": ObjectId(user_id)})
    async for table_doc in cursor:
        tables.append(DecisionTableInDB(**table_doc))
    return tables

async def update_decision_table(db: AsyncIOMotorDatabase, table_id: str, user_id: str, table_data: DecisionTableCreate) -> Optional[DecisionTableInDB]:
    """Updates an existing decision table definition."""
    try:
        updated_doc = table_data.model_dump(by_alias=True)
        result = await db["decision_tables"].update_one(
            {"_id": ObjectId(table_id), "user_id": ObjectId(user_id)},
            {"$set": updated_doc}
        )
        if result.modified_count == 1:
            return await get_decision_table_by_id(db, table_id, user_id)
    except Exception:
        pass
    return None

async def delete_decision_table(db: AsyncIOMotorDatabase, table_id: str, user_id: str) -> bool:
    """Deletes a decision table definition."""
    try:
        result = await db["decision_tables"].delete_one({"_id": ObjectId(table_id), "user_id": ObjectId(user_id)})
        return result.deleted_count == 1
    except Exception:
        return False

# ====================================================================
# Workflow CRUD
# ====================================================================

async def create_workflow(db: AsyncIOMotorDatabase, workflow_data: WorkflowCreate, user_id: str) -> WorkflowInDB:
    """Creates a new workflow definition in the 'workflows' collection."""
    workflow_doc = workflow_data.model_dump(by_alias=True)
    workflow_doc["user_id"] = ObjectId(user_id)
    result = await db["workflows"].insert_one(workflow_doc)
    created_workflow = await db["workflows"].find_one({"_id": result.inserted_id})
    return WorkflowInDB(**created_workflow)

async def get_workflow_by_id(db: AsyncIOMotorDatabase, workflow_id: str, user_id: str) -> Optional[WorkflowInDB]:
    """Retrieves a specific workflow definition for a given user."""
    try:
        workflow_doc = await db["workflows"].find_one({"_id": ObjectId(workflow_id), "user_id": ObjectId(user_id)})
        if workflow_doc:
            return WorkflowInDB(**workflow_doc)
    except Exception:
        return None
    return None

async def list_workflows_for_user(db: AsyncIOMotorDatabase, user_id: str) -> List[WorkflowInDB]:
    """Retrieves all workflow definitions for a specific user."""
    workflows = []
    cursor = db["workflows"].find({"user_id": ObjectId(user_id)})
    async for workflow_doc in cursor:
        workflows.append(WorkflowInDB(**workflow_doc))
    return workflows

async def update_workflow(db: AsyncIOMotorDatabase, workflow_id: str, user_id: str, workflow_data: WorkflowCreate) -> Optional[WorkflowInDB]:
    """Updates an existing workflow definition."""
    try:
        updated_doc = workflow_data.model_dump(by_alias=True, exclude_unset=True)
        result = await db["workflows"].update_one(
            {"_id": ObjectId(workflow_id), "user_id": ObjectId(user_id)},
            {"$set": updated_doc}
        )
        if result.modified_count == 1:
            return await get_workflow_by_id(db, workflow_id, user_id)
    except Exception:
        pass
    return None

async def delete_workflow(db: AsyncIOMotorDatabase, workflow_id: str, user_id: str) -> bool:
    """Deletes a workflow definition."""
    try:
        result = await db["workflows"].delete_one({"_id": ObjectId(workflow_id), "user_id": ObjectId(user_id)})
        return result.deleted_count == 1
    except Exception:
        return False

# <<< THIS IS THE NEW FUNCTION THAT FIXES THE 404 ERROR >>>
async def get_public_workflow_by_id(db: AsyncIOMotorDatabase, workflow_id: str) -> Optional[WorkflowInDB]:
    """
    Retrieves a specific workflow definition publicly by its ID.
    This does NOT check user_id, making it accessible for public forms.
    Add more security checks (like an 'is_public' flag) here if needed in the future.
    """
    try:
        workflow_doc = await db["workflows"].find_one({"_id": ObjectId(workflow_id)})
        if workflow_doc:
            return WorkflowInDB(**workflow_doc)
    except Exception:
        # Handles cases where workflow_id is not a valid ObjectId string
        return None
    return None


# ====================================================================
# Tool CRUD (NEW SECTION)
# ====================================================================

async def create_tool(db: AsyncIOMotorDatabase, tool_data: ToolCreate, user_id: str) -> ToolInDB:
    """Creates a new tool definition in the 'tools' collection."""
    tool_doc = tool_data.model_dump()
    tool_doc["user_id"] = ObjectId(user_id)
    result = await db["tools"].insert_one(tool_doc)
    created_tool = await db["tools"].find_one({"_id": result.inserted_id})
    return ToolInDB(**created_tool)

async def get_tools_for_user(db: AsyncIOMotorDatabase, user_id: str) -> List[ToolInDB]:
    """Retrieves all tool definitions for a specific user."""
    tools = []
    cursor = db["tools"].find({"user_id": ObjectId(user_id)})
    async for tool_doc in cursor:
        tools.append(ToolInDB(**tool_doc))
    return tools

async def update_tools_for_user(db: AsyncIOMotorDatabase, tools_data: List[ToolCreate], user_id: str) -> List[ToolInDB]:
    """
    Deletes all existing tools for a user and replaces them with a new list.
    This is a simple way to handle the "Save All Tools" functionality.
    """
    user_object_id = ObjectId(user_id)
    # Delete all existing tools for this user
    await db["tools"].delete_many({"user_id": user_object_id})
    
    if not tools_data:
        return []

    # Insert the new list of tools
    new_tools_docs = [tool.model_dump() for tool in tools_data]
    for doc in new_tools_docs:
        doc["user_id"] = user_object_id
        
    await db["tools"].insert_many(new_tools_docs)
    
    return await get_tools_for_user(db, user_id)