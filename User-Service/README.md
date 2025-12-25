# User Service

A microservice for user authentication and management built with Express.js, MongoDB, and JWT.

## Features

- 🔐 User registration with password strength validation
- 🔑 JWT-based authentication (access & refresh tokens)
- 👤 User profile management
- 🔒 Protected routes with authentication middleware
- 📝 Clean layered architecture (Models → Repositories → Services → Controllers)
- ⚡ MongoDB with Mongoose ODM
- 📊 Winston logging with MongoDB integration
- 🛡️ Password hashing with bcrypt
- ✅ Input validation and error handling

## Architecture

```
src/
├── config/          # Configuration files (DB, server, logger)
├── models/          # Mongoose schemas and models
├── repositories/    # Database operations
├── services/        # Business logic
├── controllers/     # HTTP request handlers
├── routes/          # API route definitions (versioned)
├── middleware/      # Authentication middleware
├── errors/          # Custom error classes
└── utils/           # Utilities (JWT, password, error handler)
```

## API Endpoints

### Public Routes

- `POST /api/v1/users/register` - Register new user
- `POST /api/v1/users/login` - Login user
- `POST /api/v1/users/refresh` - Refresh access token

### Protected Routes (requires JWT)

- `GET /api/v1/users/profile` - Get user profile
- `PUT /api/v1/users/profile` - Update user profile
- `PUT /api/v1/users/password` - Change password

### Health Check

- `GET /ping` - Service health check

## Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```env
PORT=3001
NODE_ENV=development
ATLAS_DB_URL=mongodb://localhost:27017/leetcode-user-service

JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_refresh_secret_key_change_in_production
JWT_REFRESH_EXPIRES_IN=7d
```

3. Start the service:
```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start
```

## Usage Examples

### Register a User

```bash
curl -X POST http://localhost:3001/api/v1/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "johndoe",
    "email": "john@example.com",
    "password": "SecurePass@123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/v1/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass@123"
  }'
```

### Get Profile (Protected)

```bash
curl -X GET http://localhost:3001/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### Update Profile (Protected)

```bash
curl -X PUT http://localhost:3001/api/v1/users/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Jane",
    "lastName": "Smith"
  }'
```

### Change Password (Protected)

```bash
curl -X PUT http://localhost:3001/api/v1/users/password \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "oldPassword": "SecurePass@123",
    "newPassword": "NewSecurePass@456"
  }'
```

### Refresh Token

```bash
curl -X POST http://localhost:3001/api/v1/users/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

## Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Response Format

All responses follow this structure:

```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

## Error Handling

- 400: Bad Request (validation errors)
- 401: Unauthorized (authentication failures)
- 404: Not Found
- 409: Conflict (duplicate email/username)
- 500: Internal Server Error

## Technology Stack

- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Winston** - Logging
- **Zod** - Validation (support)

## License

ISC
