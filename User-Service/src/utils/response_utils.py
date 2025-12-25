"""
Response Utilities
Standardized API response formats
"""
from typing import Any, Optional
from fastapi.responses import JSONResponse


def success_response(
    data: Any = None,
    message: str = "Success",
    status_code: int = 200
) -> JSONResponse:
    """
    Create a standardized success response
    
    Args:
        data: Response data payload
        message: Success message
        status_code: HTTP status code
        
    Returns:
        JSONResponse with standardized format
    """
    response_data = {
        "success": True,
        "message": message,
        "data": data
    }
    return JSONResponse(content=response_data, status_code=status_code)


def error_response(
    message: str = "Error occurred",
    error: Optional[str] = None,
    status_code: int = 400
) -> JSONResponse:
    """
    Create a standardized error response
    
    Args:
        message: Error message
        error: Detailed error information
        status_code: HTTP status code
        
    Returns:
        JSONResponse with standardized error format
    """
    response_data = {
        "success": False,
        "message": message,
        "error": error
    }
    return JSONResponse(content=response_data, status_code=status_code)
