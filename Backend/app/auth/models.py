# --- START OF FILE: app/auth/models.py (Corrected) ---

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any
from bson import ObjectId
from pydantic_core import core_schema # Import this for Pydantic v2 compatibility

# Required for default_factory for timestamp in ChatLog
from datetime import datetime

# --- THIS IS THE CORRECTED PyObjectId CLASS for Pydantic v2 ---
class PyObjectId(ObjectId):
    @classmethod
    def __get_pydantic_core_schema__(
        cls, _source_type: Any, _handler: Any
    ) -> core_schema.CoreSchema:
        
        # <<< FIX 3: ADD `info` TO THE VALIDATE FUNCTION'S ARGUMENTS >>>
        def validate(v, info): # Add 'info' here
            if not ObjectId.is_valid(v):
                raise ValueError("Invalid ObjectId")
            return ObjectId(v)

        return core_schema.json_or_python_schema(
            json_schema=core_schema.str_schema(),
            python_schema=core_schema.with_info_plain_validator_function(validate),
            serialization=core_schema.to_string_ser_schema(),
        )
# ====================================================================
# User Models
# ====================================================================

# This is the structure for documents in the 'users' collection
class UserInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id", description="Unique identifier for the user")
    email: EmailStr = Field(..., description="User's email address (unique)")
    hashed_password: str = Field(..., description="Hashed password for the user")
    
    class Config:
        json_encoders = {ObjectId: str} # Ensures ObjectId is serialized to string
        populate_by_name = True # Allows field name to be different from the alias
        arbitrary_types_allowed = True # Needed for PyObjectId


# ====================================================================
# Chat Log Models
# ====================================================================

class ChatLog(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id", description="Unique identifier for the chat log entry")
    session_id: str = Field(..., description="Identifier for the chat session") # Make session_id mandatory
    user_id: PyObjectId = Field(..., description="ID of the user who initiated the chat") # Make user_id mandatory
    sender: str = Field(..., description="Who sent the message ('user', 'agent', 'system')") # Make sender mandatory (e.g., "user", "agent", "system")
    content: str = Field(..., description="The actual message content, can be plain text or a JSON string") # Make content mandatory (actual message or JSON string)
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat(), description="ISO formatted UTC timestamp of the message") # Add default timestamp
    
    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        arbitrary_types_allowed = True

# ====================================================================
# Agent Configuration Models
# ====================================================================

class AgentConfiguration(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id", description="Unique identifier for the agent configuration")
    user_id: PyObjectId = Field(..., description="ID of the user who owns this agent")
    name: str = Field(..., min_length=1, description="Name of the agent")
    system_message: str = Field(..., min_length=1, description="System message / persona for the agent")
    tasks: List[Dict[str, Any]] = Field(default_factory=list, description="List of tasks/tools the agent can perform, defined as dictionaries")
    knowledge_base_files: List[str] = Field(default_factory=list, description="List of filenames in the knowledge base associated with this agent")
    public_api_key: Optional[str] = Field(default=None, description="Unique API key for public access to this agent, auto-generated on creation") # Added public_api_key
    
    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        arbitrary_types_allowed = True

# ====================================================================
# Decision Table Models (NEW SECTION)
# ====================================================================

class DecisionTableInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id", description="Unique identifier for the decision table")
    user_id: PyObjectId = Field(..., description="ID of the user who owns this decision table")
    name: str = Field(..., min_length=1, max_length=100, description="Name of the decision table")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the decision table's purpose")
    definition: Dict[str, Any] = Field(..., description="The JSON definition of the decision table in GoRules format")

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        arbitrary_types_allowed = True

# ====================================================================
# Workflow Models (NEW SECTION ADDED)
# ====================================================================

class WorkflowInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id", description="Unique identifier for the workflow")
    user_id: PyObjectId = Field(..., description="ID of the user who owns this workflow")
    name: str = Field(..., min_length=1, max_length=100, description="Name of the workflow")
    description: Optional[str] = Field(None, max_length=500, description="Optional description of the workflow's purpose")
    # This could be a complex JSON structure for your workflow engine (e.g., LangGraph, custom format)
    definition: Dict[str, Any] = Field(..., description="The JSON definition of the workflow structure.")

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        arbitrary_types_allowed = True

class ToolInDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    user_id: PyObjectId = Field(...)
    name: str = Field(..., description="The programmatic name of the tool, e.g., 'get_weather'.")
    description: str = Field(..., description="A natural language description of what the tool does.")
    endpoint: Optional[str] = Field(None, description="The API endpoint this tool calls, if applicable.")
    params_schema: Dict[str, Any] = Field(..., description="JSON schema defining the input parameters for the tool.")

    class Config:
        json_encoders = {ObjectId: str}
        populate_by_name = True
        arbitrary_types_allowed = True