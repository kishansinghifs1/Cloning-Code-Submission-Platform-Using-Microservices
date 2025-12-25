"""
FastAPI Application Entry Point
Main application initialization and configuration
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from src.config.server_config import server_config
from src.config.db_config import connect_to_database, close_database_connection
from src.routes.v1.router import api_router
from src.errors.error_handler import custom_exception_handler, global_exception_handler
from src.utils.exceptions import BaseCustomException
from src.repositories.user_repository import user_repository

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager
    Handles startup and shutdown events
    """
    # Startup
    logger.info("Starting User Service...")
    try:
        await connect_to_database()
        await user_repository.create_indexes()
        logger.info("User Service started successfully")
    except Exception as e:
        logger.error(f"Failed to start User Service: {e}")
        raise e
    
    yield
    
    # Shutdown
    logger.info("Shutting down User Service...")
    await close_database_connection()
    logger.info("User Service shut down successfully")


# Create FastAPI application
app = FastAPI(
    title="User Service API",
    description="Authentication and user management service for LeetCode Clone",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=server_config.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register exception handlers
app.add_exception_handler(BaseCustomException, custom_exception_handler)
app.add_exception_handler(Exception, global_exception_handler)

# Include API routes
app.include_router(api_router, prefix="/api/v1")


# Health check endpoint
@app.get("/ping")
async def health_check():
    """Health check endpoint"""
    return {
        "success": True,
        "message": "User Service is alive"
    }


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "main:app",
        host=server_config.HOST,
        port=server_config.PORT,
        reload=True,
        log_level="info"
    )
