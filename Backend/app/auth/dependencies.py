# --- START OF FILE app/auth/dependencies.py ---

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt  # Correctly import jwt from jose
from pydantic import ValidationError

from app.db.database import get_database
from app.db import crud
from app.auth import schemas
from app.config import settings

# This is for standard HTTP requests
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


# --- Function 1: For HTTP Endpoints (Fully Corrected) ---
async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db=Depends(get_database)
) -> schemas.UserPublic:
    """Standard dependency for protecting HTTP routes."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except (JWTError, ValidationError):
        raise credentials_exception

    user_model = await crud.get_user_by_id(db, user_id=user_id)
    if user_model is None:
        raise credentials_exception
    
    # Correctly return all required fields as strings
    return schemas.UserPublic(
        id=str(user_model.id),
        email=user_model.email
    )



# --- Function 2: For WebSocket Connections (Corrected) ---
async def get_current_user_for_websocket(token: str) -> schemas.UserPublic:
    """A self-contained authenticator for WebSocket connections."""
    db = get_database()
    
    # --- THIS IS THE FIX ---
    # Explicitly check for None, as required by the PyMongo/Motor library.
    if db is None:
    # --- END OF FIX ---
        raise Exception("Database connection not available for WebSocket authentication.")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
    except (JWTError, ValidationError):
        return None

    user_model = await crud.get_user_by_id(db, user_id=user_id)
    if user_model is None:
        return None
    
    return schemas.UserPublic(
        id=str(user_model.id),
        email=user_model.email
    )