"""
API Router
Main router that combines all API routes
"""
from fastapi import APIRouter
from src.controllers import auth_controller, user_controller

# Create main API router
api_router = APIRouter()

# Include authentication routes
api_router.include_router(
    auth_controller.router,
    prefix="/auth",
    tags=["Authentication"]
)

# Include user routes
api_router.include_router(
    user_controller.router,
    prefix="/users",
    tags=["Users"]
)
