"""
Token Model
Token-related Pydantic models
"""
from pydantic import BaseModel


class TokenResponse(BaseModel):
    """Token response model"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenRefreshRequest(BaseModel):
    """Token refresh request model"""
    refresh_token: str


class TokenRefreshResponse(BaseModel):
    """Token refresh response model"""
    access_token: str
    token_type: str = "bearer"
