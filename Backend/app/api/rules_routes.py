# --- START OF FILE app/api/rules_routes.py ---

from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any
import json # Added this import for debugging prints

# CORRECTED IMPORT: Use 'import zen' instead of 'from zen_engine import ZenEngine'
import zen # <<< FIX: Changed import to 'import zen'

from app.db.database import get_database
from app.db import crud
from app.auth.dependencies import get_current_user
from app.auth.schemas import (
    UserPublic,
    DecisionTableCreate,
    DecisionTableResponse,
    EvaluateRuleRequest,
    EvaluateRuleResponse
)
from app.auth.models import DecisionTableInDB
from bson.objectid import ObjectId

router = APIRouter(prefix="/rules", tags=["Rule Management & Evaluation"])

# ====================================================================
# Decision Table CRUD Endpoints
# ====================================================================

@router.post(
    "/decision_tables",
    response_model=DecisionTableResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new decision table"
)
async def create_decision_table_endpoint(
    table_create: DecisionTableCreate,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Creates and saves a new decision table definition.
    """
    created_table = await crud.create_decision_table(db, table_create, current_user.id)
    return DecisionTableResponse(
        id=str(created_table.id),
        name=created_table.name,
        description=created_table.description,
        definition=created_table.definition
    )

@router.get(
    "/decision_tables/{table_id}",
    response_model=DecisionTableResponse,
    summary="Get decision table details by ID"
)
async def get_decision_table_endpoint(
    table_id: str,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Retrieves the details for a single decision table by its ID.
    """
    table = await crud.get_decision_table_by_id(db, table_id=table_id, user_id=current_user.id)
    if not table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision table not found or you do not have permission to view it."
        )
    return DecisionTableResponse(
        id=str(table.id),
        name=table.name,
        description=table.description,
        definition=table.definition
    )

@router.get(
    "/decision_tables",
    response_model=List[DecisionTableResponse],
    summary="List all decision tables for the current user"
)
async def list_my_decision_tables_endpoint(
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Lists all decision tables created by the currently authenticated user.
    """
    tables = await crud.list_decision_tables_for_user(db, user_id=current_user.id)
    return [
        DecisionTableResponse(
            id=str(table.id),
            name=table.name,
            description=table.description,
            definition=table.definition # Include definition for full view
        )
        for table in tables
    ]

@router.put(
    "/decision_tables/{table_id}",
    response_model=DecisionTableResponse,
    summary="Update an existing decision table"
)
async def update_decision_table_endpoint(
    table_id: str,
    table_update: DecisionTableCreate,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Updates an existing decision table definition.
    """
    updated_table = await crud.update_decision_table(db, table_id, current_user.id, table_update)
    if not updated_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision table not found or you do not have permission to update it."
        )
    return DecisionTableResponse(
        id=str(updated_table.id),
        name=updated_table.name,
        description=updated_table.description,
        definition=updated_table.definition
    )

@router.delete(
    "/decision_tables/{table_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a decision table"
)
async def delete_decision_table_endpoint(
    table_id: str,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Deletes a decision table definition.
    """
    success = await crud.delete_decision_table(db, table_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision table not found or you do not have permission to delete it."
        )
    return # No content on successful delete

# ====================================================================
# Decision Table Evaluation Endpoint
# ====================================================================
@router.post(
    "/evaluate_rule",
    response_model=EvaluateRuleResponse,
    summary="Evaluate a decision table with given context"
)
async def evaluate_rule_endpoint(
    payload: EvaluateRuleRequest,
    current_user: UserPublic = Depends(get_current_user),
    db=Depends(get_database)
):
    """
    Accepts an input JSON payload, retrieves a decision table by ID,
    and uses zen-engine to evaluate it, returning the decision results.
    """
    # 1. Fetch the decision table
    decision_table = await crud.get_decision_table_by_id(
        db, table_id=payload.table_id, user_id=current_user.id
    )
    if not decision_table:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Decision table not found or you do not have permission to access it."
        )

    # 2. Debug prints
    print("\n--- DEBUGGING ZEN-ENGINE INITIALIZATION ---")
    print(f"Table ID: {payload.table_id}")
    print(f"Type of definition from DB: {type(decision_table.definition)}")
    print(f"Content of definition from DB:\n{json.dumps(decision_table.definition, indent=2)}")
    print("-------------------------------------------\n")

    try:
        # 3. Initialize engine
        engine = zen.ZenEngine()

        # 4. Wrap plain decision table into a graph if needed
        if "nodes" in decision_table.definition:
            wrapped_definition = decision_table.definition
        else:
            node_type = (
                "decisionTableNode"
                if decision_table.definition.get("kind") == "DecisionTable"
                else "customNode"
            )

            # Ensure decision table content has an ID
            table_content = dict(decision_table.definition)
            if "id" not in table_content:
                table_content["id"] = f"table_{payload.table_id}"

            # Ensure node also has an ID
            wrapped_definition = {
                "nodes": [
                    {
                        "id": "node_main",  # ✅ outer node ID
                        "name": table_content.get("name", "Main Decision Table"),
                        "type": node_type,
                        "content": table_content  # ✅ inner content with ID
                    }
                ],
                "edges": []
            }

        print("\n--- DEBUG: Wrapped Definition ---")
        print(json.dumps(wrapped_definition, indent=2))
        print("---------------------------------\n")

        # 5. Create decision and evaluate
        decision = engine.create_decision(wrapped_definition)
        result = await decision.evaluate(payload.context)

        # 6. Extract results safely
        errors, output = [], None
        if isinstance(result, dict):
            errors = result.get("errors", [])
            output = result.get("result")
        else:
            errors = getattr(result, "errors", [])
            output = getattr(result, "result", None)

        if errors:
            print(f"DEBUG: ZenEngine evaluation errors: {errors}")
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Decision evaluation failed: {errors}"
            )

        if output is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="ZenEngine returned no result."
            )

        # 7. Return response
        return EvaluateRuleResponse(
            table_id=payload.table_id,
            result=output
        )

    except Exception as e:
        print(f"DEBUG: Error during evaluation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during evaluation: {str(e)}"
        )
