"""
Error Handler
Global error handling for FastAPI application
"""
from fastapi import Request
from fastapi.responses import JSONResponse
from src.utils.exceptions import BaseCustomException
import logging

logger = logging.getLogger(__name__)


async def custom_exception_handler(request: Request, exc: BaseCustomException):
    """
    Handle custom exceptions
    
    Args:
        request: FastAPI request object
        exc: Custom exception instance
        
    Returns:
        JSONResponse with error details
    """
    logger.error(f"Custom exception: {exc.message} - Status: {exc.status_code}")
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.message,
            "error": str(exc)
        }
    )


async def global_exception_handler(request: Request, exc: Exception):
    """
    Handle unexpected exceptions
    
    Args:
        request: FastAPI request object
        exc: Exception instance
        
    Returns:
        JSONResponse with generic error message
    """
    logger.error(f"Unexpected error: {str(exc)}", exc_info=True)
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Internal server error",
            "error": str(exc)
        }
    )
