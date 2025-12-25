# User Service - LeetCode Clone

## Overview

The User Service is a FastAPI-based microservice that provides authentication and user management functionality for the LeetCode Clone platform. It implements JWT-based authentication with role-based access control (RBAC).

## Tech Stack

- **Framework**: FastAPI 0.109.0
- **Database**: MongoDB (using Motor async driver)
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: Pydantic
- **Server**: Uvicorn

## Architecture

The service follows a **layered architecture** pattern consistent with other services in the project:

```
User-Service/
├── src/
│   ├── config/          # Configuration files (server, auth, database)
│   ├── models/          # Pydantic models for validation
│   ├── repositories/    # Database operations layer
│   ├── services/        # Business logic layer
│   ├── controllers/     # HTTP request handlers
│   ├── routes/          # API route definitions
│   ├── middleware/      # Authentication and authorization
│   ├── utils/           # Utility functions (JWT, password, etc.)
│   └── errors/          # Error handling
```

## Features

### Authentication
- User registration with email and username
- User login with JWT token generation
- Access token (15 min expiry) and refresh token (7 day expiry)
- Token refresh endpoint
- Password change functionality
- Logout (client-side token invalidation)

### User Management
- Get current user profile
- Update user profile
- Admin: List all users with pagination
- Admin: Get user by ID
- Admin: Deactivate user accounts

### Security
- Password strength validation
- bcrypt password hashing
- JWT token verification middleware
- Role-based access control (USER, ADMIN)
- Unique email and username constraints

## Installation

### Prerequisites
- Python 3.11+
- MongoDB 4.4+

### Setup

1. **Clone the repository and navigate to User-Service**
   ```bash
   cd User-Service
   ```

2. **Create a virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   
   Edit `.env` file with your settings:
   ```env
   PORT=8001
   HOST=0.0.0.0
   MONGODB_URI=mongodb://localhost:27017
   MONGODB_DATABASE=leetcode_users
   JWT_SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
   JWT_ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=15
   REFRESH_TOKEN_EXPIRE_DAYS=7
   CORS_ORIGINS=*
   ```

5. **Start MongoDB**
   ```bash
   mongod
   ```

6. **Run the service**
   ```bash
   uvicorn src.main:app --reload --host 0.0.0.0 --port 8001
   ```

## API Endpoints

### Base URL: `http://localhost:8001`

### Health Check
- `GET /ping` - Health check endpoint

### Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login user | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/change-password` | Change password | Yes |
| POST | `/logout` | Logout user | Yes |

### Users (`/api/v1/users`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/me` | Get current user profile | Yes |
| PUT | `/me` | Update current user profile | Yes |
| GET | `/` | Get all users (paginated) | Admin |
| GET | `/{user_id}` | Get user by ID | Admin |
| DELETE | `/{user_id}` | Deactivate user | Admin |

## API Documentation

FastAPI provides automatic interactive API documentation:

- **Swagger UI**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## Usage Examples

### Register a new user
```bash
curl -X POST http://localhost:8001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "SecurePass123!",
    "full_name": "John Doe"
  }'
```

### Login
```bash
curl -X POST http://localhost:8001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123!"
  }'
```

### Get current user profile
```bash
curl -X GET http://localhost:8001/api/v1/users/me \
  -H "Authorization: Bearer <your_access_token>"
```

### Refresh access token
```bash
curl -X POST http://localhost:8001/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refresh_token": "<your_refresh_token>"
  }'
```

## Data Models

### User
```python
{
  "id": "string",
  "email": "user@example.com",
  "username": "johndoe",
  "full_name": "John Doe",
  "role": "user",  # or "admin"
  "is_active": true,
  "is_verified": false,
  "created_at": "2024-01-01T00:00:00",
  "last_login": "2024-01-01T00:00:00"
}
```

### Token Response
```python
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one digit

## Database Schema

### Users Collection

```javascript
{
  _id: ObjectId,
  email: String (unique, indexed),
  username: String (unique, indexed),
  full_name: String (optional),
  password_hash: String,
  role: String (enum: "user", "admin"),
  is_active: Boolean,
  is_verified: Boolean,
  created_at: DateTime (indexed),
  updated_at: DateTime,
  last_login: DateTime
}
```

## Error Handling

The service uses standardized error responses:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized (authentication failed)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate email/username)
- `500` - Internal Server Error

## Integration with Other Services

Other services can validate JWT tokens from this User Service using the JWT secret key. Example validation:

```python
from jose import jwt

def verify_token(token: str):
    payload = jwt.decode(
        token, 
        "your-jwt-secret", 
        algorithms=["HS256"]
    )
    return payload
```

## Development

### Project Structure
```
User-Service/
├── src/
│   ├── config/              # Configuration management
│   │   ├── server_config.py
│   │   ├── auth_config.py
│   │   └── db_config.py
│   ├── models/              # Pydantic models
│   │   ├── user_model.py
│   │   └── token_model.py
│   ├── repositories/        # Database layer
│   │   └── user_repository.py
│   ├── services/            # Business logic
│   │   ├── auth_service.py
│   │   └── user_service.py
│   ├── controllers/         # Request handlers
│   │   ├── auth_controller.py
│   │   └── user_controller.py
│   ├── routes/              # API routes
│   │   └── v1/
│   │       └── router.py
│   ├── middleware/          # Authentication middleware
│   │   └── auth_middleware.py
│   ├── utils/               # Utilities
│   │   ├── jwt_utils.py
│   │   ├── password_utils.py
│   │   ├── response_utils.py
│   │   └── exceptions.py
│   ├── errors/              # Error handling
│   │   └── error_handler.py
│   └── main.py              # Application entry point
├── requirements.txt
├── .env
└── README.md
```

## Logging

The service uses Python's built-in logging module with the following format:
```
%(asctime)s - %(name)s - %(levelname)s - %(message)s
```

Logs include:
- User registration and login events
- Database operations
- Authentication errors
- Token generation and validation

## Contributing

When extending this service:

1. Follow the layered architecture pattern
2. Add new endpoints in appropriate controllers
3. Implement business logic in service layer
4. Keep database operations in repository layer
5. Use Pydantic models for request/response validation
6. Add appropriate error handling
7. Update API documentation

## License

This service is part of the LeetCode Clone project.

## Contact

For questions or issues, please contact the development team.
