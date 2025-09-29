# --- START OF FILE app/api/auth_routes.py ---

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm

# Import from our new, refactored modules
from app.auth import schemas, utils, dependencies
from app.db.database import get_database
from app.db import crud

# Create a new router for authentication endpoints
# We add a prefix and tags for better organization in the API docs
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post(
    "/register", # Renamed from /signup for consistency
    response_model=schemas.UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new user"
)
async def register_user(
    user_in: schemas.UserCreate,
    db=Depends(get_database)
):
    """
    Create a new user account. Asynchronous and uses the CRUD layer.
    """
    # 1. Check if user already exists using our CRUD function
    db_user = await crud.get_user_by_email(db, email=user_in.email)
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email already exists.",
        )
    
    # 2. Create the user using our CRUD function
    created_user = await crud.create_user(db, user_in)
    
    # 3. Return the public representation of the user
    return schemas.UserPublic(id=str(created_user.id), email=created_user.email)


@router.post(
    "/login",
    response_model=schemas.Token,
    summary="User login to get an access token"
)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db=Depends(get_database)
):
    """
    Logs in a user and returns a JWT access token. Asynchronous and uses the CRUD layer.
    The `username` field from the form data will contain the user's email.
    """
    # 1. Find the user by email using our CRUD function
    user = await crud.get_user_by_email(db, email=form_data.username)
    
    # 2. Check if the user exists and the password is correct
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # 3. Create the JWT access token with the user's ID as the subject
    access_token = utils.create_access_token(subject=str(user.id))
    
    return {"access_token": access_token, "token_type": "bearer"}


@router.get(
    "/me",
    response_model=schemas.UserPublic,
    summary="Get current user's details"
)
async def read_users_me(
    current_user: schemas.UserPublic = Depends(dependencies.get_current_user)
):
    """
    Fetch the details of the currently authenticated user.
    This endpoint is protected by the `get_current_user` dependency.
    """
    return current_user


@router.post("/logout", summary="User logout (Client-side action)")
async def logout():
    """
    In a stateless JWT system, logout is a client-side action.
    This endpoint is provided for API completeness.
    """
    return {"msg": "Successfully logged out. Please clear your token on the client side."}