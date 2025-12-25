"""
Custom Exceptions
Application-specific exception classes
"""


class BaseCustomException(Exception):
    """Base exception class for custom exceptions"""
    
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)


class ValidationException(BaseCustomException):
    """Exception for validation errors"""
    
    def __init__(self, message: str = "Validation failed"):
        super().__init__(message, status_code=400)


class AuthenticationException(BaseCustomException):
    """Exception for authentication errors"""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(message, status_code=401)


class AuthorizationException(BaseCustomException):
    """Exception for authorization errors"""
    
    def __init__(self, message: str = "Authorization failed"):
        super().__init__(message, status_code=403)


class NotFoundException(BaseCustomException):
    """Exception for resource not found errors"""
    
    def __init__(self, message: str = "Resource not found"):
        super().__init__(message, status_code=404)


class ConflictException(BaseCustomException):
    """Exception for resource conflict errors"""
    
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, status_code=409)


class InternalServerException(BaseCustomException):
    """Exception for internal server errors"""
    
    def __init__(self, message: str = "Internal server error"):
        super().__init__(message, status_code=500)
