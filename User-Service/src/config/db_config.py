"""
Database Configuration
MongoDB connection using Motor (async driver)
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic_settings import BaseSettings
import logging

logger = logging.getLogger(__name__)


class DatabaseConfig(BaseSettings):
    """Database configuration settings"""
    
    MONGODB_URI: str = "mongodb://localhost:27017"
    MONGODB_DATABASE: str = "leetcode_users"
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Global database config instance
db_config = DatabaseConfig()

# MongoDB client and database instances
mongodb_client: AsyncIOMotorClient = None
mongodb_database = None


async def connect_to_database():
    """Connect to MongoDB database"""
    global mongodb_client, mongodb_database
    
    try:
        logger.info(f"Connecting to MongoDB at {db_config.MONGODB_URI}")
        mongodb_client = AsyncIOMotorClient(db_config.MONGODB_URI)
        mongodb_database = mongodb_client[db_config.MONGODB_DATABASE]
        
        # Test the connection
        await mongodb_client.admin.command('ping')
        logger.info(f"Successfully connected to MongoDB database: {db_config.MONGODB_DATABASE}")
        
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise e


async def close_database_connection():
    """Close MongoDB connection"""
    global mongodb_client
    
    if mongodb_client:
        logger.info("Closing MongoDB connection")
        mongodb_client.close()
        logger.info("MongoDB connection closed")


def get_database():
    """Get the database instance"""
    return mongodb_database
