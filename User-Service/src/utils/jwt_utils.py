"""
JWT Utilities
Functions for creating and verifying JWT tokens
"""
from datetime import datetime, timedelta
from typing import Dict, Optional
from jose import JWTError, jwt
from src.config.auth_config import auth_config


def create_access_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token
    
    Args:
        data: Data to encode in the token (usually user_id and role)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=auth_config.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, auth_config.JWT_SECRET_KEY, algorithm=auth_config.JWT_ALGORITHM)
    
    return encoded_jwt


def create_refresh_token(data: Dict, expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT refresh token
    
    Args:
        data: Data to encode in the token (usually user_id)
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=auth_config.REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, auth_config.JWT_SECRET_KEY, algorithm=auth_config.JWT_ALGORITHM)
    
    return encoded_jwt


def decode_token(token: str) -> Dict:
    """
    Decode and verify a JWT token
    
    Args:
        token: JWT token string to decode
        
    Returns:
        Decoded token payload
        
    Raises:
        JWTError: If token is invalid or expired
    """
    try:
        payload = jwt.decode(token, auth_config.JWT_SECRET_KEY, algorithms=[auth_config.JWT_ALGORITHM])
        return payload
    except JWTError as e:
        raise e


def verify_token_type(payload: Dict, expected_type: str) -> bool:
    """
    Verify that the token is of the expected type (access or refresh)
    
    Args:
        payload: Decoded token payload
        expected_type: Expected token type ("access" or "refresh")
        
    Returns:
        True if token type matches, False otherwise
    """
    return payload.get("type") == expected_type
