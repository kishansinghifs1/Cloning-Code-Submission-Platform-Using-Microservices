"""
User Controller
Handles user management HTTP requests
"""
from fastapi import APIRouter, HTTPException, status, Depends, Query
from src.models.user_model import UserResponse, UserUpdate
from src.services.user_service import user_service
from src.middleware.auth_middleware import get_current_active_user, require_admin
from src.utils.exceptions import NotFoundException, ConflictException
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: Dict = Depends(get_current_active_user)):
    """
    Get current user's profile
    
    Args:
        current_user: Current authenticated user
        
    Returns:
        UserResponse with user data
    """
    try:
        user_response = await user_service.get_user_by_id(current_user["_id"])
        return user_response
        
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user profile"
        )


@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: UserUpdate,
    current_user: Dict = Depends(get_current_active_user)
):
    """
    Update current user's profile
    
    Args:
        update_data: Profile update data
        current_user: Current authenticated user
        
    Returns:
        Updated UserResponse
    """
    try:
        updated_user = await user_service.update_user_profile(
            current_user["_id"],
            update_data
        )
        return updated_user
        
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except ConflictException as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user profile"
        )


@router.get("", response_model=List[UserResponse])
async def get_all_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    current_user: Dict = Depends(require_admin)
):
    """
    Get all users (Admin only)
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        current_user: Current authenticated admin user
        
    Returns:
        List of UserResponse
    """
    try:
        users = await user_service.get_all_users(skip, limit)
        return users
        
    except Exception as e:
        logger.error(f"Error getting all users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get users"
        )


@router.get("/{user_id}", response_model=UserResponse)
async def get_user_by_id(
    user_id: str,
    current_user: Dict = Depends(require_admin)
):
    """
    Get user by ID (Admin only)
    
    Args:
        user_id: User ID
        current_user: Current authenticated admin user
        
    Returns:
        UserResponse with user data
    """
    try:
        user_response = await user_service.get_user_by_id(user_id)
        return user_response
        
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error getting user by ID: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user"
        )


@router.delete("/{user_id}")
async def deactivate_user(
    user_id: str,
    current_user: Dict = Depends(require_admin)
):
    """
    Deactivate user account (Admin only)
    
    Args:
        user_id: User ID
        current_user: Current authenticated admin user
        
    Returns:
        Success message
    """
    try:
        result = await user_service.deactivate_user(user_id)
        
        if result:
            return {
                "success": True,
                "message": "User deactivated successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to deactivate user"
            )
            
    except NotFoundException as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=e.message
        )
    except Exception as e:
        logger.error(f"Error deactivating user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to deactivate user"
        )
