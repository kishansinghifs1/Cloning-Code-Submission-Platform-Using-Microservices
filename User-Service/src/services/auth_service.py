"""
Authentication Service
Business logic for authentication and authorization
"""
from typing import Dict
from src.repositories.user_repository import user_repository
from src.models.user_model import UserCreate, UserRole
from src.models.token_model import TokenResponse
from src.utils.password_utils import hash_password, verify_password
from src.utils.jwt_utils import create_access_token, create_refresh_token, decode_token, verify_token_type
from src.utils.exceptions import (
    AuthenticationException,
    ConflictException,
    ValidationException,
    NotFoundException
)
from jose import JWTError
import logging

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication business logic"""
    
    def __init__(self):
        """Initialize the service with repository"""
        self.repository = user_repository
    
    async def register_user(self, user_data: UserCreate) -> TokenResponse:
        """
        Register a new user
        
        Args:
            user_data: User registration data
            
        Returns:
            TokenResponse with access and refresh tokens
            
        Raises:
            ConflictException: If email or username already exists
        """
        # Check if email already exists
        existing_user = await self.repository.get_user_by_email(user_data.email)
        if existing_user:
            raise ConflictException("Email already registered")
        
        # Check if username already exists
        existing_user = await self.repository.get_user_by_username(user_data.username)
        if existing_user:
            raise ConflictException("Username already taken")
        
        # Hash password
        password_hash = hash_password(user_data.password)
        
        # Prepare user document
        user_dict = {
            "email": user_data.email,
            "username": user_data.username,
            "full_name": user_data.full_name,
            "password_hash": password_hash,
            "role": UserRole.USER.value
        }
        
        # Create user
        created_user = await self.repository.create_user(user_dict)
        
        # Generate tokens
        access_token = create_access_token(
            data={"sub": created_user["_id"], "role": created_user["role"]}
        )
        refresh_token = create_refresh_token(
            data={"sub": created_user["_id"]}
        )
        
        logger.info(f"User registered successfully: {created_user['email']}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
    
    async def login_user(self, email: str, password: str) -> TokenResponse:
        """
        Authenticate user and generate tokens
        
        Args:
            email: User email
            password: User password
            
        Returns:
            TokenResponse with access and refresh tokens
            
        Raises:
            AuthenticationException: If credentials are invalid
        """
        # Find user by email
        user = await self.repository.get_user_by_email(email)
        
        if not user:
            raise AuthenticationException("Invalid email or password")
        
        # Verify password
        if not verify_password(password, user["password_hash"]):
            raise AuthenticationException("Invalid email or password")
        
        # Check if user is active
        if not user.get("is_active", True):
            raise AuthenticationException("Account is deactivated")
        
        # Update last login
        await self.repository.update_last_login(user["_id"])
        
        # Generate tokens
        access_token = create_access_token(
            data={"sub": user["_id"], "role": user["role"]}
        )
        refresh_token = create_refresh_token(
            data={"sub": user["_id"]}
        )
        
        logger.info(f"User logged in successfully: {user['email']}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token
        )
    
    async def refresh_access_token(self, refresh_token: str) -> str:
        """
        Generate new access token from refresh token
        
        Args:
            refresh_token: Valid refresh token
            
        Returns:
            New access token
            
        Raises:
            AuthenticationException: If refresh token is invalid
        """
        try:
            # Decode refresh token
            payload = decode_token(refresh_token)
            
            # Verify token type
            if not verify_token_type(payload, "refresh"):
                raise AuthenticationException("Invalid token type")
            
            # Get user ID from token
            user_id = payload.get("sub")
            if not user_id:
                raise AuthenticationException("Invalid token payload")
            
            # Verify user exists
            user = await self.repository.get_user_by_id(user_id)
            if not user:
                raise AuthenticationException("User not found")
            
            # Check if user is active
            if not user.get("is_active", True):
                raise AuthenticationException("Account is deactivated")
            
            # Generate new access token
            access_token = create_access_token(
                data={"sub": user["_id"], "role": user["role"]}
            )
            
            logger.info(f"Access token refreshed for user: {user_id}")
            
            return access_token
            
        except JWTError as e:
            logger.error(f"JWT error during token refresh: {e}")
            raise AuthenticationException("Invalid or expired refresh token")
    
    async def change_password(self, user_id: str, old_password: str, new_password: str) -> bool:
        """
        Change user password
        
        Args:
            user_id: User ID
            old_password: Current password
            new_password: New password
            
        Returns:
            True if successful
            
        Raises:
            NotFoundException: If user not found
            AuthenticationException: If old password is incorrect
        """
        # Find user
        user = await self.repository.get_user_by_id(user_id)
        if not user:
            raise NotFoundException("User not found")
        
        # Verify old password
        if not verify_password(old_password, user["password_hash"]):
            raise AuthenticationException("Current password is incorrect")
        
        # Hash new password
        new_password_hash = hash_password(new_password)
        
        # Update password
        await self.repository.update_user(user_id, {"password_hash": new_password_hash})
        
        logger.info(f"Password changed for user: {user_id}")
        
        return True
    
    async def verify_token_and_get_user(self, token: str) -> Dict:
        """
        Verify access token and return user data
        
        Args:
            token: JWT access token
            
        Returns:
            User data dictionary
            
        Raises:
            AuthenticationException: If token is invalid
        """
        try:
            # Decode token
            payload = decode_token(token)
            
            # Verify token type
            if not verify_token_type(payload, "access"):
                raise AuthenticationException("Invalid token type")
            
            # Get user ID from token
            user_id = payload.get("sub")
            if not user_id:
                raise AuthenticationException("Invalid token payload")
            
            # Get user from database
            user = await self.repository.get_user_by_id(user_id)
            if not user:
                raise AuthenticationException("User not found")
            
            # Check if user is active
            if not user.get("is_active", True):
                raise AuthenticationException("Account is deactivated")
            
            return user
            
        except JWTError as e:
            logger.error(f"JWT error during token verification: {e}")
            raise AuthenticationException("Invalid or expired token")


# Global service instance
auth_service = AuthService()
