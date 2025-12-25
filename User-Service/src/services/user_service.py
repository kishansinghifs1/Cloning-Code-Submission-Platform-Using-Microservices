"""
User Service
Business logic for user management
"""
from typing import Optional, List
from src.repositories.user_repository import user_repository
from src.models.user_model import UserCreate, UserUpdate, UserResponse, UserRole
from src.utils.exceptions import NotFoundException, ConflictException
import logging

logger = logging.getLogger(__name__)


class UserService:
    """Service for user business logic"""
    
    def __init__(self):
        """Initialize the service with repository"""
        self.repository = user_repository
    
    async def get_user_by_id(self, user_id: str) -> UserResponse:
        """
        Get user by ID
        
        Args:
            user_id: User ID
            
        Returns:
            UserResponse model
            
        Raises:
            NotFoundException: If user not found
        """
        user = await self.repository.get_user_by_id(user_id)
        
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")
        
        return UserResponse(
            id=user["_id"],
            email=user["email"],
            username=user["username"],
            full_name=user.get("full_name"),
            role=user["role"],
            is_active=user["is_active"],
            is_verified=user["is_verified"],
            created_at=user["created_at"],
            last_login=user.get("last_login")
        )
    
    async def update_user_profile(self, user_id: str, update_data: UserUpdate) -> UserResponse:
        """
        Update user profile
        
        Args:
            user_id: User ID
            update_data: Data to update
            
        Returns:
            Updated UserResponse model
            
        Raises:
            NotFoundException: If user not found
            ConflictException: If email/username already exists
        """
        # Check if user exists
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")
        
        # Prepare update data
        update_dict = update_data.dict(exclude_unset=True)
        
        # Check for email conflict
        if "email" in update_dict:
            existing_user = await self.repository.get_user_by_email(update_dict["email"])
            if existing_user and existing_user["_id"] != user_id:
                raise ConflictException("Email already in use")
        
        # Check for username conflict
        if "username" in update_dict:
            existing_user = await self.repository.get_user_by_username(update_dict["username"])
            if existing_user and existing_user["_id"] != user_id:
                raise ConflictException("Username already in use")
        
        # Update user
        updated_user = await self.repository.update_user(user_id, update_dict)
        
        return UserResponse(
            id=updated_user["_id"],
            email=updated_user["email"],
            username=updated_user["username"],
            full_name=updated_user.get("full_name"),
            role=updated_user["role"],
            is_active=updated_user["is_active"],
            is_verified=updated_user["is_verified"],
            created_at=updated_user["created_at"],
            last_login=updated_user.get("last_login")
        )
    
    async def get_all_users(self, skip: int = 0, limit: int = 10) -> List[UserResponse]:
        """
        Get all users with pagination
        
        Args:
            skip: Number of records to skip
            limit: Maximum number of records to return
            
        Returns:
            List of UserResponse models
        """
        users = await self.repository.get_all_users(skip, limit)
        
        return [
            UserResponse(
                id=user["_id"],
                email=user["email"],
                username=user["username"],
                full_name=user.get("full_name"),
                role=user["role"],
                is_active=user["is_active"],
                is_verified=user["is_verified"],
                created_at=user["created_at"],
                last_login=user.get("last_login")
            )
            for user in users
        ]
    
    async def deactivate_user(self, user_id: str) -> bool:
        """
        Deactivate a user account
        
        Args:
            user_id: User ID
            
        Returns:
            True if successful
            
        Raises:
            NotFoundException: If user not found
        """
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise NotFoundException(f"User with ID {user_id} not found")
        
        result = await self.repository.delete_user(user_id)
        
        if result:
            logger.info(f"User {user_id} deactivated")
            return True
        
        return False


# Global service instance
user_service = UserService()
