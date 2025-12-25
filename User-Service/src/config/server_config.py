"""
Server Configuration
Loads server-related settings from environment variables
"""
from pydantic_settings import BaseSettings
from typing import List


class ServerConfig(BaseSettings):
    """Server configuration settings"""
    
    PORT: int = 8001
    HOST: str = "0.0.0.0"
    CORS_ORIGINS: str = "*"
    
    class Config:
        env_file = ".env"
        case_sensitive = True
    
    def get_cors_origins(self) -> List[str]:
        """Parse CORS origins from string to list"""
        if self.CORS_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]


# Global server config instance
server_config = ServerConfig()
