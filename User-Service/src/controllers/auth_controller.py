"""
Authentication Controller
Handles authentication-related HTTP requests
"""
from fastapi import APIRouter, HTTPException, status, Depends
from src.models.user_model import UserCreate, PasswordChange
from src.models.token_model import TokenResponse, TokenRefreshRequest, TokenRefreshResponse
from src.services.auth_service import auth_service
from src.middleware.auth_middleware import get_current_active_user
from src.utils.exceptions import (
    ConflictException,
    AuthenticationException,
    ValidationException
)
from pydantic import BaseModel, EmailStr
from typing import Dict
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class LoginRequest(BaseModel):
    """Login request model"""
    email: EmailStr
    password: str


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """
    Register a new user
    
    Args:
        user_data: User registration data
        
    Returns:
        TokenResponse with access and refresh tokens
    """
    try:
        tokens = await auth_service.register_user(user_data)
        return tokens
        
    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message
        )
    except ValidationException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error during registration: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=TokenResponse)
async def login(login_data: LoginRequest):
    """
    Authenticate user and generate tokens
    
    Args:
        login_data: Login credentials
        
    Returns:
        TokenResponse with access and refresh tokens
    """
    try:
        tokens = await auth_service.login_user(login_data.email, login_data.password)
        return tokens
        
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(refresh_data: TokenRefreshRequest):
    """
    Refresh access token using refresh token
    
    Args:
        refresh_data: Refresh token
        
    Returns:
        New access token
    """
    try:
        access_token = await auth_service.refresh_access_token(refresh_data.refresh_token)
        return TokenRefreshResponse(access_token=access_token)
        
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error during token refresh: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/change-password")
async def change_password(
    password_data: PasswordChange,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Change user password
    
    Args:
        password_data: Old and new passwords
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    try:
        await auth_service.change_password(
            current_user["_id"],
            password_data.old_password,
            password_data.new_password
        )
        
        return {
            "success": True,
            "message": "Password changed successfully"
        }
        
    except AuthenticationException as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error during password change: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )


@router.post("/logout")
async def logout(current_user: Dict = Depends(get_current_active_user)):
    """
    Logout user (client should discard tokens)
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        Success message
    """
    # In a stateless JWT system, logout is handled client-side by discarding tokens
    # For enhanced security, you could implement a token blacklist
    
    return {
        "success": True,
        "message": "Logged out successfully"
    }
