# --- START OF FILE: app/auth/schemas.py (Corrected) ---

from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Dict, Any

# ====================================================================
# User Schemas
# ====================================================================

class UserCreate(BaseModel):
    """Schema for user registration input."""
    email: EmailStr = Field(..., description="The user's email address (must be unique).")
    password: str = Field(..., min_length=8, description="Password for the user account (minimum 8 characters).")

class UserLogin(BaseModel):
    """Schema for user login input."""
    email: EmailStr = Field(..., description="The user's email address.")
    password: str = Field(..., description="The user's password.")

class UserPublic(BaseModel):
    """Schema for public representation of a user."""
    id: str = Field(..., description="The unique identifier of the user.")
    email: EmailStr = Field(..., description="The user's email address.")

    class Config:
        from_attributes = True # Allows Pydantic to read from ORM models or attributes


# ====================================================================
# Token Schemas
# ====================================================================

class Token(BaseModel):
    """Schema for JWT access token response."""
    access_token: str = Field(..., description="The JWT access token.")
    token_type: str = Field("bearer", description="The type of the token (e.g., 'bearer').")

class TokenData(BaseModel):
    """Schema for data contained within a JWT token."""
    user_id: Optional[str] = Field(None, description="The unique identifier of the user (subject of the token).")


# ====================================================================
# Agent Schemas
# ====================================================================

class Task(BaseModel):
    """Defines a tool or task an agent can perform."""
    name: str = Field(..., description="The programmatic name of the task/tool.")
    description: str = Field(..., description="A natural language description of what the task/tool does.")
    endpoint: Optional[str] = Field(None, description="The API endpoint to call for this task, if it's an external tool.")
    params_schema: Dict[str, Any] = Field(..., description="JSON schema defining the input parameters for the task/tool.")

class AgentSpec(BaseModel):
    """
    Defines the specification for an agent. 
    This is the data structure the frontend sends to create/define an agent.
    """
    name: str = Field(..., min_length=1, description="A user-friendly name for the agent.")
    system_message: str = Field(..., min_length=1, description="The initial system message or persona that guides the agent's behavior.")
    tasks: List[Task] = Field(default_factory=list, description="A list of tasks/tools this agent is configured to use.")

    knowledge_base_files: List[str] = Field(default_factory=list, description="A list of file paths (e.g., PDF names) in the knowledge base associated with this agent.")
    knowledge_base_urls: List[str] = Field(default_factory=list, description="A list of URLs ingested into the knowledge base associated with this agent.")


# ====================================================================
# Decision Table Schemas (NEW SECTION)
# ====================================================================

class DecisionTableCreate(BaseModel):
    """Schema for creating a new decision table."""
    name: str = Field(..., min_length=1, max_length=100, description="A unique and descriptive name for the decision table.")
    description: Optional[str] = Field(None, max_length=500, description="An optional detailed description of the decision table's purpose.")
    definition: Dict[str, Any] = Field(..., description="The full JSON definition of the decision table in GoRules (ZenEngine) format.")

class DecisionTableResponse(BaseModel):
    """Schema for responding with decision table details."""
    id: str = Field(..., description="The unique identifier of the decision table.")
    name: str = Field(..., description="The name of the decision table.")
    description: Optional[str] = Field(None, description="The description of the decision table.")
    definition: Dict[str, Any] = Field(..., description="The full JSON definition of the decision table.")

    class Config:
        from_attributes = True # Enable Pydantic to read from object attributes (like _id)
        json_schema_extra = { # Example for OpenAPI documentation
            "example": {
                "id": "60c72b2f9b1d4c001f8e4a1b",
                "name": "Support Ticket Router",
                "description": "Routes support tickets based on urgency and department.",
                "definition": {
                    "kind": "DecisionTable",
                    "inputs": [{"name": "Urgency", "type": "string"}, {"name": "Department", "type": "string"}],
                    "outputs": [{"name": "Handler", "type": "string"}, {"name": "SLA", "type": "number"}],
                    "rules": [
                        {"Urgency": "High", "Department": "Technical", "Handler": "Level 2 Tech", "SLA": 4},
                        {"Urgency": "Medium", "Department": "Billing", "Handler": "Billing Support", "SLA": 24},
                        {"Urgency": "Low", "Department": "General", "Handler": "General Support", "SLA": 48}
                    ]
                }
            }
        }

class EvaluateRuleRequest(BaseModel):
    """Schema for requesting a decision table evaluation."""
    table_id: str = Field(..., description="The ID of the decision table to evaluate.")
    context: Dict[str, Any] = Field(..., description="The input data (context) for the decision table evaluation, conforming to its input schema.")

    class Config:
        json_schema_extra = { # Example for OpenAPI documentation
            "example": {
                "table_id": "60c72b2f9b1d4c001f8e4a1b",
                "context": {
                    "Urgency": "High",
                    "Department": "Technical"
                }
            }
        }

class EvaluateRuleResponse(BaseModel):
    """Schema for the response of a decision table evaluation."""
    table_id: str = Field(..., description="The ID of the decision table that was evaluated.")
    result: Any = Field(..., description="The output from the decision table evaluation.")

    class Config:
        json_schema_extra = { # Example for OpenAPI documentation
            "example": {
                "table_id": "60c72b2f9b1d4c001f8e4a1b",
                "result": {
                    "Handler": "Level 2 Tech",
                    "SLA": 4
                }
            }
        }

# ====================================================================
# Workflow Schemas (NEW SECTION)
# ====================================================================

class WorkflowCreate(BaseModel):
    """Schema for creating a new workflow definition."""
    name: str = Field(..., min_length=1, max_length=100, description="A unique and descriptive name for the workflow.")
    description: Optional[str] = Field(None, max_length=500, description="An optional detailed description of the workflow's purpose.")
    definition: Dict[str, Any] = Field(..., description="The JSON definition of the workflow structure (e.g., LangGraph or custom format).")

class WorkflowResponse(BaseModel):
    """Schema for responding with workflow details."""
    id: str = Field(..., description="The unique identifier of the workflow.")
    name: str = Field(..., description="The name of the workflow.")
    description: Optional[str] = Field(None, description="The description of the workflow.")
    definition: Dict[str, Any] = Field(..., description="The JSON definition of the workflow structure.")

    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": "60c72b2f9b1d4c001f8e4a1c",
                "name": "Customer Onboarding Flow",
                "description": "Guides new customers through setup and initial product usage.",
                "definition": {
                    "start_node": "welcome",
                    "nodes": {
                        "welcome": {"type": "agent_message", "content": "Welcome! Let's get you set up."},
                        "ask_email": {"type": "form_input", "fields": ["email", "name"]},
                        "evaluate_risk": {"type": "decision_table_call", "table_id": "risk_assessment_table_id"},
                        "end_success": {"type": "message", "content": "Onboarding complete!"}
                    },
                    "edges": [
                        {"from": "welcome", "to": "ask_email"},
                        {"from": "ask_email", "to": "evaluate_risk"},
                        {"from": "evaluate_risk", "to": "end_success", "condition": "{{ result.risk_level == 'low' }}"}
                    ]
                }
            }
        }


# ====================================================================
# Trigger Schemas (<<< NEW SECTION >>>)
# ====================================================================

class ChatMessageTrigger(BaseModel):
    """Schema for incoming chat message trigger data."""
    flow_id: str = Field(..., description="The ID of the workflow to trigger.")
    message: str = Field(..., description="The content of the chat message.")
    session_id: Optional[str] = Field(None, description="Optional ID for a continuous chat session.")
    user_id: Optional[str] = Field(None, description="Optional ID of the user sending the message.")
    # Add other relevant chat message metadata as needed

class FormSubmissionTrigger(BaseModel):
    """Schema for incoming form submission trigger data."""
    flow_id: str = Field(..., description="The ID of the workflow to trigger.")
    form_data: Dict[str, Any] = Field(..., description="A dictionary of form field names and their submitted values.")
    # Add other relevant form submission metadata as needed (e.g., submission_id, timestamp)


class WorkflowExecutionRequest(BaseModel):
    """Schema for requesting a workflow execution."""
    input_data: Dict[str, Any] = Field(
        ..., 
        description="The initial data to start the workflow, typically from a trigger."
    )
    # --- ADD THIS FIELD ---
    chat_history: Optional[List[Dict[str, Any]]] = Field(
        default=None, 
        description="The ongoing conversation history for context, if any."
    )

    class Config:
        json_schema_extra = {
            "example": {
                "input_data": {
                    "message": "What is the weather like in London?"
                },
                "chat_history": [
                    {"type": "human", "content": "I need to know the weather."},
                    {"type": "ai", "content": "Of course, for which city?"}
                ]
            }
        }

# Model for the /run_agent endpoint
class RunAgentRequest(BaseModel):
    input_data: Dict[str, Any] = Field(..., description="Data from the trigger (e.g., form submission).")
    chat_model_config: Dict[str, Any] = Field(..., description="Configuration for the language model.")
    memory_config: Optional[Dict[str, Any]] = Field(None, description="Configuration for the memory component.")
    tools_config: Optional[List[Dict[str, Any]]] = Field(None, description="Configuration for the tools.")
    chat_history: Optional[List[Dict[str, str]]] = Field(
        default=None,
        description="A list of previous messages for conversational context."
    )

    class Config:
        json_schema_extra = {
            "example": {
                "input_data": {"message": "I need help with my booking."},
                "chat_model_config": {"provider": "OpenAI", "model_name": "gpt-4-turbo"},
                "memory_config": {"type": "ConversationBufferWindowMemory", "k": 5},
                "tools_config": [{"name": "get_booking_details"}],
                # I've also updated the example to be more helpful
                "chat_history": [
                    {"type": "human", "content": "Hello there."},
                    {"type": "ai", "content": "How can I assist you today?"}
                ]
            }
        }

# ====================================================================
# Tool Schemas (NEW SECTION)
# ====================================================================

class ToolCreate(BaseModel):
    """Schema for creating or updating a tool. Matches the Task schema."""
    name: str = Field(..., description="The programmatic name of the tool.")
    description: str = Field(..., description="A natural language description of what the tool does.")
    endpoint: Optional[str] = Field(None, description="The API endpoint to call for this tool.")
    params_schema: Dict[str, Any] = Field(..., description="JSON schema defining the input parameters.")

class ToolResponse(BaseModel):
    """Schema for responding with tool details, including its database ID."""
    id: str
    name: str
    description: str
    endpoint: Optional[str] = None
    params_schema: Dict[str, Any]

    # <<< THIS IS THE FIX >>>
    class Config:
        """
        Pydantic config settings.
        `from_attributes = True` tells Pydantic to read data from class attributes,
        not just dictionaries. This is essential for converting ORM/ODM models
        like our `ToolInDB` into this response schema. It allows Pydantic
        to correctly serialize special types like PyObjectId into strings.
        """
        from_attributes = True
    # <<< END OF FIX >>>