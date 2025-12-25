"""
Authentication Configuration
JWT and authentication-related settings
"""
from pydantic_settings import BaseSettings


class AuthConfig(BaseSettings):
    """Authentication configuration settings"""
    
    JWT_SECRET_KEY: str = "your-super-secret-jwt-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Password hashing
    BCRYPT_ROUNDS: int = 12
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global auth config instance
auth_config = AuthConfig()
