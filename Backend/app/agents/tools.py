import asyncio
import json
from typing import List, Optional, Dict, Any

import httpx
from langchain_core.tools import StructuredTool, tool
from pydantic import create_model, Field
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.db import crud
from app.auth.models import ToolInDB


class ToolRegistry:
    """
    Dynamically loads tool definitions from the database for a specific user
    and creates executable LangChain tools with proper argument schemas.
    """

    def __init__(self, db: AsyncIOMotorDatabase, user_id: str):
        self.db = db
        self.user_id = user_id
        self._tools_cache: Optional[List[ToolInDB]] = None

    async def _fetch_tools_from_db(self):
        """Fetch and cache tool definitions from the database."""
        if self._tools_cache is None:
            print(f"--- [ToolRegistry] Fetching tools from DB for user {self.user_id} ---")
            self._tools_cache = await crud.get_tools_for_user(self.db, self.user_id)

    def _create_api_tool(self, tool_def: ToolInDB) -> StructuredTool:
        """
        Creates a LangChain StructuredTool for external API calls.
        Dynamically generates args_schema from a standard JSON Schema
        definition stored in the DB.
        """

        async def api_call_func_async(**kwargs):
            # ... this function does not need to change ...
            print(f"--- [Tool Executed] Calling API tool '{tool_def.name}' with args: {kwargs} ---")
            endpoint = tool_def.endpoint
            if not endpoint:
                return f"Error: Tool '{tool_def.name}' has no API endpoint."

            try:
                # Use GET for Open-Meteo, passing params
                async with httpx.AsyncClient() as client:
                    response = await client.get(endpoint, params=kwargs, timeout=30.0)
                    response.raise_for_status()
                    return json.dumps(response.json())
            except httpx.HTTPStatusError as e:
                return f"Error calling API for '{tool_def.name}': {e.response.status_code} - {e.response.text}"
            except Exception as e:
                return f"Unexpected error calling '{tool_def.name}': {str(e)}"

        def api_call_func(**kwargs):
            return asyncio.run(api_call_func_async(**kwargs))

        # ====================================================================
        # <<< UPGRADED SCHEMA PARSING LOGIC >>>
        # ====================================================================
        args_schema = None
        if getattr(tool_def, "params_schema", None):
            try:
                schema_dict = tool_def.params_schema
                if isinstance(schema_dict, str):
                    schema_dict = json.loads(schema_dict)

                # Check if it's a standard JSON Schema with a 'properties' key
                if "properties" in schema_dict and isinstance(schema_dict["properties"], dict):
                    properties = schema_dict["properties"]
                    required_fields = schema_dict.get("required", [])
                else:
                    # Fallback to the simple format for backward compatibility
                    properties = schema_dict
                    required_fields = list(properties.keys())

                fields = {}
                # Expanded type map to handle JSON schema types
                type_map = {
                    "str": str, "string": str,
                    "int": int, "integer": int,
                    "float": float, "number": float,
                    "bool": bool, "boolean": bool,
                    "dict": dict, "object": dict,
                    "list": list, "array": list
                }

                for param_name, param_details in properties.items():
                    py_type = type_map.get(param_details.get("type", "string"), str)
                    description = param_details.get("description", "")
                    
                    if param_name in required_fields:
                        # For required fields, Pydantic needs `...`
                        fields[param_name] = (py_type, Field(..., description=description))
                    else:
                        # For optional fields, provide a default value (e.g., None)
                        fields[param_name] = (Optional[py_type], Field(default=None, description=description))

                args_schema = create_model(f"{tool_def.name}Args", **fields)
            except Exception as e:
                print(f"--- [ToolRegistry] Failed to parse params_schema for {tool_def.name}: {e} ---")

        return StructuredTool.from_function(
            func=api_call_func,
            name=tool_def.name,
            description=tool_def.description or f"Tool for {tool_def.name}",
            args_schema=args_schema
        )

    async def get_tools(self, tool_names: List[str]) -> List[StructuredTool]:
        """Retrieve and return only the requested tools as LangChain StructuredTools."""
        await self._fetch_tools_from_db()

        langchain_tools = []
        for tool_def in self._tools_cache:
            if tool_def.name in tool_names:
                langchain_tools.append(self._create_api_tool(tool_def))

        print(f"--- [ToolRegistry] Loaded {len(langchain_tools)} tools: {[t.name for t in langchain_tools]} ---")
        return langchain_tools


# --------------------------
# Example Built-in Tool
# --------------------------

@tool
def hello_tool(name: str) -> str:
    """Greets the given name."""
    return f"Hello, {name}!"



@tool
def ask_user(question: str) -> str:
    """
    Use this tool ONLY when you need to ask the user for clarification or
    more information to complete a task. The user's response will be provided
    in the next turn.
    """
    # The implementation is just a placeholder. The agent's execution will be
    # intercepted before this tool is actually called.
    return f"Asking user: {question}"