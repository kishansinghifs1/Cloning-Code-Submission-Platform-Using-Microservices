# LeetCode Clone - Frontend Build Comprehensive Prompt

## System Overview

You are building a full-stack LeetCode-like coding platform consisting of 5 microservices:
1. **User-Service** (Express.js) - Authentication & user management
2. **Problem-Service** (Express.js) - Problem management & definitions
3. **Submission-Service** (Fastify) - Submission management & webhook handling
4. **Evaluator-Service** (Express.ts) - Code execution & evaluation using Docker
5. **Socket-Service** (Node.js) - Real-time WebSocket communication

---

## Architecture & Data Flow

### 1. User Authentication Flow
```
Frontend → User-Service (Port: varies)
├── POST /api/v1/users/register - Create new user
├── POST /api/v1/users/login - User login
├── POST /api/v1/users/refresh - Refresh access token
├── GET /api/v1/users/profile - Get user profile (protected)
├── PUT /api/v1/users/profile - Update profile (protected)
└── PUT /api/v1/users/password - Change password (protected)
```

### 2. Problem Discovery & Management
```
Frontend → Problem-Service (Port: varies)
├── GET /api/v1/problems - Get all problems with filters
├── GET /api/v1/problems/:id - Get specific problem details
├── POST /api/v1/problems - Create problem (admin only)
├── PUT /api/v1/problems/:id - Update problem (admin only)
└── DELETE /api/v1/problems/:id - Delete problem (admin only)
```

### 3. Code Submission & Evaluation Flow
```
1. Frontend → Submission-Service: POST /api/v1/submissions
   ├── Creates submission with status: PENDING
   └── Returns: { submission._id, status }

2. Submission-Service → Evaluator-Service (BullMQ Queue)
   ├── Enqueues job with: { userId, problemId, code, language }
   └── Submission status changes to PROCESSING

3. Evaluator-Service (Worker Process)
   ├── Pulls Docker image (cpp/java/python)
   ├── Creates container with test cases
   ├── Executes code with timeout (10s per test case)
   ├── Compares output vs expected
   └── Webhook callback to Submission-Service with results

4. Submission-Service ← Evaluator-Service (Webhook)
   ├── POST /api/v1/submissions/:submissionId/evaluate-result
   ├── Updates testResults, passedTestCases, failedTestCases
   └── Sets overallStatus: SUCCESS | PARTIAL | FAILED

5. Socket-Service → Frontend (WebSocket)
   ├── Real-time submission status updates
   └── Emits: 'submissionPayloadResponse' with evaluation results
```

### 4. Real-Time Communication
```
Frontend ↔ Socket-Service (WebSocket, Port 3001)
├── Connect to socket.io
├── Emit: setUserId(userId)
├── Emit: getConnectionId(userId)
├── Listen: 'submissionPayloadResponse' with payload
└── Listen: 'connectionId' to get socket id
```

---

## Backend API Specifications

### User-Service API Endpoints

#### 1. POST /api/v1/users/register
**Request Body:**
```json
{
  "username": "string (3-30 chars, alphanumeric + underscore)",
  "email": "string (valid email)",
  "password": "string (min 8 chars)",
  "firstName": "string (optional, max 50 chars)",
  "lastName": "string (optional, max 50 chars)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "user",
    "isActive": true,
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

#### 2. POST /api/v1/users/login
**Request Body:**
```json
{
  "email": "string",
  "password": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "JWT token",
    "refreshToken": "JWT token",
    "user": {
      "_id": "string",
      "username": "string",
      "email": "string",
      "firstName": "string",
      "lastName": "string",
      "role": "user | admin",
      "isActive": true
    }
  }
}
```

#### 3. POST /api/v1/users/refresh
**Request Body:**
```json
{
  "refreshToken": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "accessToken": "new JWT token"
  }
}
```

#### 4. GET /api/v1/users/profile (Protected)
**Headers:** `Authorization: Bearer <accessToken>`

**Response (200):**
```json
{
  "success": true,
  "message": "User profile retrieved successfully",
  "data": {
    "_id": "string",
    "username": "string",
    "email": "string",
    "firstName": "string",
    "lastName": "string",
    "role": "user | admin",
    "isActive": true,
    "createdAt": "ISO-8601",
    "updatedAt": "ISO-8601"
  }
}
```

#### 5. PUT /api/v1/users/profile (Protected)
**Request Body:**
```json
{
  "firstName": "string (optional)",
  "lastName": "string (optional)"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": { /* updated user object */ }
}
```

#### 6. PUT /api/v1/users/password (Protected)
**Request Body:**
```json
{
  "oldPassword": "string",
  "newPassword": "string"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully",
  "data": {}
}
```

---

### Problem-Service API Endpoints

#### 1. GET /api/v1/problems
**Query Parameters:**
- `difficulty` (optional): 'easy' | 'medium' | 'hard'
- `search` (optional): search by title/description
- `page` (optional): pagination
- `limit` (optional): items per page

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully fetched all the problems",
  "error": {},
  "data": [
    {
      "_id": "string",
      "title": "string",
      "description": "string",
      "difficulty": "easy | medium | hard",
      "codeStubs": [
        {
          "language": "cpp | java | python",
          "startSnippet": "string",
          "userSnippet": "string (default empty)",
          "endSnippet": "string"
        }
      ],
      "testCases": [
        {
          "input": "string",
          "output": "string"
        }
      ],
      "editorial": "string (optional)",
      "createdAt": "ISO-8601",
      "updatedAt": "ISO-8601"
    }
  ]
}
```

#### 2. GET /api/v1/problems/:id
**Response (200):**
```json
{
  "success": true,
  "message": "Successfully fetched a problem",
  "error": {},
  "data": {
    /* same structure as above */
  }
}
```

#### 3. POST /api/v1/problems (Admin Only)
**Request Body:**
```json
{
  "title": "string (min 3 chars)",
  "description": "string",
  "difficulty": "easy | medium | hard",
  "testCases": [
    {
      "input": "string",
      "output": "string"
    }
  ],
  "codeStubs": [
    {
      "language": "cpp | java | python",
      "startSnippet": "string",
      "userSnippet": "string",
      "endSnippet": "string"
    }
  ],
  "editorial": "string (optional)"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Successfully created a new problem",
  "error": {},
  "data": { /* created problem */ }
}
```

#### 4. PUT /api/v1/problems/:id (Admin Only)
**Request Body:** Same as POST

**Response (200):**
```json
{
  "success": true,
  "message": "Successfully updated the problem",
  "error": {},
  "data": { /* updated problem */ }
}
```

#### 5. DELETE /api/v1/problems/:id (Admin Only)
**Response (200):**
```json
{
  "success": true,
  "message": "Successfully deleted the problem",
  "error": {},
  "data": { /* deleted problem */ }
}
```

---

### Submission-Service API Endpoints

#### 1. POST /api/v1/submissions
**Request Body:**
```json
{
  "userId": "string (MongoDB ObjectId)",
  "problemId": "string (MongoDB ObjectId)",
  "code": "string (max 100KB)",
  "language": "cpp | java | python"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Submission created successfully",
  "data": {
    "submission": {
      "_id": "string",
      "userId": "string",
      "problemId": "string",
      "code": "string",
      "language": "string",
      "status": "PENDING",
      "testResults": [],
      "totalTestCases": 0,
      "passedTestCases": 0,
      "failedTestCases": 0,
      "overallStatus": null,
      "submittedAt": "ISO-8601",
      "createdAt": "ISO-8601"
    }
  }
}
```

#### 2. GET /api/v1/submissions
**Query Parameters:**
- `userId` (required): Get user's submissions
- `status` (optional): PENDING | PROCESSING | COMPLETED | ERROR
- `page` (optional): pagination
- `limit` (optional): items per page

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "_id": "string",
      "userId": "string",
      "problemId": "string",
      "status": "string",
      "testResults": [
        {
          "testCaseIndex": 0,
          "input": "string",
          "expectedOutput": "string",
          "actualOutput": "string",
          "status": "PASS | FAIL",
          "error": "string (if any)"
        }
      ],
      "totalTestCases": 5,
      "passedTestCases": 3,
      "failedTestCases": 2,
      "overallStatus": "SUCCESS | PARTIAL | FAILED | null",
      "executionTime": 234,
      "submittedAt": "ISO-8601",
      "completedAt": "ISO-8601"
    }
  ]
}
```

#### 3. GET /api/v1/submissions/:submissionId
**Response (200):**
```json
{
  "success": true,
  "message": "Submission retrieved successfully",
  "data": { /* submission object */ }
}
```

#### 4. POST /api/v1/submissions/:submissionId/evaluate-result (Webhook - Internal)
**Internal Request Body (from Evaluator-Service):**
```json
{
  "testResults": [
    {
      "testCaseIndex": 0,
      "input": "string",
      "expectedOutput": "string",
      "actualOutput": "string",
      "status": "PASS | FAIL",
      "error": "string"
    }
  ],
  "totalTestCases": 5,
  "passedTestCases": 3,
  "failedTestCases": 2,
  "overallStatus": "SUCCESS | PARTIAL | FAILED",
  "executionTime": 234
}
```

---

### Socket.IO Events

#### Client → Server

**1. Connect (Automatic)**
- Establishes WebSocket connection
- CORS allowed from: `http://localhost:5173`

**2. Emit: setUserId**
```javascript
socket.emit('setUserId', userId);
// Stores userId -> socketId mapping in Redis
```

**3. Emit: getConnectionId**
```javascript
socket.emit('getConnectionId', userId);
// Retrieves socket connection ID for a user
```

#### Server → Client

**1. Listen: submissionPayloadResponse**
```javascript
socket.on('submissionPayloadResponse', (payload) => {
  // payload contains evaluation results
  console.log(payload);
});
// Sent from Socket-Service when evaluation completes
```

**2. Listen: connectionId**
```javascript
socket.on('connectionId', (socketId) => {
  console.log('Your socket ID:', socketId);
});
```

---

## Data Models

### User Model
```javascript
{
  _id: ObjectId,
  username: String (unique, 3-30 chars),
  email: String (unique, valid email),
  password: String (hashed, min 8 chars),
  firstName: String (optional, max 50 chars),
  lastName: String (optional, max 50 chars),
  role: String (enum: ['user', 'admin'], default: 'user'),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### Problem Model
```javascript
{
  _id: ObjectId,
  title: String (min 3 chars),
  description: String,
  difficulty: String (enum: ['easy', 'medium', 'hard']),
  testCases: [
    {
      input: String,
      output: String
    }
  ],
  codeStubs: [
    {
      language: String (cpp, java, python),
      startSnippet: String,
      userSnippet: String (default: ''),
      endSnippet: String
    }
  ],
  editorial: String (optional),
  createdAt: Date,
  updatedAt: Date
}
```

### Submission Model
```javascript
{
  _id: ObjectId,
  userId: String (indexed),
  problemId: String (indexed),
  code: String (max 100KB),
  language: String,
  status: String (enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'ERROR']),
  testResults: [
    {
      testCaseIndex: Number,
      input: String,
      expectedOutput: String,
      actualOutput: String,
      status: String (enum: ['PASS', 'FAIL']),
      error: String
    }
  ],
  totalTestCases: Number,
  passedTestCases: Number,
  failedTestCases: Number,
  overallStatus: String (enum: ['SUCCESS', 'PARTIAL', 'FAILED', null]),
  executionError: String,
  executionTime: Number (ms),
  submittedAt: Date (indexed, default: now),
  completedAt: Date,
  idempotencyKey: String (unique, sparse),
  webhookAttempts: Number (default: 0),
  lastWebhookAttempt: Date,
  nextRetryAt: Date,
  webhookFailed: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

---

## Frontend Requirements

### Core Features to Build

#### 1. Authentication Module
- **Register Page**
  - Form fields: username, email, password, firstName (optional), lastName (optional)
  - Password strength indicator
  - Email validation
  - Username uniqueness check
  - Submit button with loading state
  - Link to login page

- **Login Page**
  - Form fields: email, password
  - "Remember me" checkbox (optional)
  - "Forgot password" link (for future implementation)
  - Submit button with loading state
  - Link to register page
  - Error handling for invalid credentials

- **Token Management**
  - Store accessToken & refreshToken in secure storage
  - Implement token refresh logic (call refresh endpoint before expiry)
  - Automatic logout on token expiry
  - Handle token refresh on 401 responses

- **Protected Routes**
  - Implement route guards (PrivateRoute component)
  - Redirect to login if not authenticated
  - Maintain user session across page refreshes

#### 2. User Profile Module
- **Profile View Page**
  - Display: username, email, firstName, lastName, role, joinDate
  - Show user statistics (total submissions, solved problems count)
  - Edit profile button

- **Edit Profile Page**
  - Form to update firstName & lastName
  - Save with loading state
  - Success/error notifications

- **Change Password Page**
  - Form fields: oldPassword, newPassword, confirmPassword
  - Password validation
  - Success/error notifications

#### 3. Problem Listing Module
- **Problems Page**
  - List all problems in table/card format
  - Columns: #, Title, Difficulty, Acceptance Rate (optional)
  - Filter by difficulty: easy, medium, hard
  - Search by title/description
  - Pagination (10-20 problems per page)
  - Sort options: newest, most solved, difficulty
  - Click to view problem details
  - Status indicator: solved (✓), attempted, not attempted

- **Problem Card Component**
  - Show: Title, Difficulty (color-coded), Acceptance Rate
  - Quick preview of description
  - Solved status badge

#### 4. Problem Detail & Code Editor Module
- **Problem Detail Page**
  - Display: Title, Description, Difficulty, Acceptance Rate
  - Test cases display (input/output)
  - Editorial/solution explanation (if available)
  - Code stubs for each language (cpp, java, python)

- **Code Editor Section**
  - Monaco Editor or similar (syntax highlighting, line numbers)
  - Language selector dropdown (cpp, java, python)
  - Font size adjustment
  - Theme toggle (light/dark)
  - Code auto-save every 30 seconds (localStorage)

- **Editor Actions**
  - "Submit" button → POST /api/v1/submissions
  - "Reset Code" button → restore to code stub
  - "Run Code" button (optional - run against sample test cases)

#### 5. Submission Status & Results Module
- **Submit Code Flow**
  - POST request with userId, problemId, code, language
  - Show loading spinner while "PENDING"
  - Show processing message while "PROCESSING"
  - WebSocket listener for real-time result updates

- **Results Display Page/Modal**
  - Submission status badge: SUCCESS | PARTIAL | FAILED
  - Display: Passed X out of Y test cases
  - Test case results table:
    - Test Case #, Input, Expected Output, Actual Output, Status (✓/✗)
    - Expandable rows for detailed view
  - Execution time
  - Error messages (if any)
  - Actions: View Editorial, Submit Again, Go to Problem List

- **Submission History**
  - List all user's submissions
  - Filter by: All Problems, Solved, Attempted
  - Sort by: Most Recent, Oldest, Problem
  - Click submission to view results
  - Stats: Total Submissions, Accepted, etc.

#### 6. Real-Time Updates Module
- **WebSocket Integration**
  - Connect socket.io on app load
  - Emit setUserId on login
  - Listen for submissionPayloadResponse
  - Update UI in real-time without polling

- **Notification System**
  - Toast notifications for: Login, Logout, Submission Success/Failure
  - Real-time result update notification
  - Error notifications for failed requests

#### 7. Code Execution Flow UI
- **Visual Feedback**
  - Show submission status transitions:
    - PENDING → PROCESSING → COMPLETED (with success/partial/failed)
    - or → ERROR
  - Loading indicators at each stage
  - Status badge with color coding:
    - PENDING: Gray
    - PROCESSING: Yellow
    - SUCCESS: Green
    - PARTIAL: Orange
    - FAILED: Red
    - ERROR: Red

#### 8. Admin Features (Optional)
- **Problem Management Page** (for admin users)
  - List all problems
  - Create Problem form
  - Edit Problem form
  - Delete Problem with confirmation
  - Form fields: title, description, difficulty, test cases, code stubs

---

## Technology Stack Recommendations

### Frontend Framework
- **React** (or Vue.js/Angular)
- **TypeScript** for type safety
- **Next.js** (if server-side rendering needed) or Vite

### State Management
- **Redux Toolkit** or **Zustand** for global state
- **TanStack Query (React Query)** for server state management

### UI Components & Styling
- **Tailwind CSS** for styling
- **shadcn/ui** or **Material-UI** for component library
- **Radix UI** for headless components

### Code Editor
- **Monaco Editor** (VSCode's editor)
- **CodeMirror** (alternative)

### Real-Time Communication
- **Socket.IO Client** for WebSocket

### HTTP Client
- **Axios** or **Fetch API** (with custom wrapper)
- **Axios instance with interceptors** for token refresh

### Form Handling
- **React Hook Form** with **Zod/Yup** validation

### Routing
- **React Router** (v6+)
- **Next.js** (if using Next.js)

### Development Tools
- **ESLint** for linting
- **Prettier** for code formatting
- **Vitest** for unit testing
- **Playwright/Cypress** for e2e testing

---

## Key Implementation Considerations

### 1. Authentication Flow
```typescript
// Token refresh interceptor
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('/api/v1/users/refresh', { refreshToken });
      localStorage.setItem('accessToken', response.data.data.accessToken);
      // Retry original request
    }
  }
);
```

### 2. Code Submission & Real-Time Results
```typescript
// Submit code
const response = await axios.post('/api/v1/submissions', {
  userId,
  problemId,
  code,
  language
});

// Listen for results via WebSocket
socket.on('submissionPayloadResponse', (payload) => {
  // payload contains evaluation results
  updateSubmissionState(payload);
});
```

### 3. Code Execution Status States
```typescript
const submissionStates = {
  initial: 'NOT_SUBMITTED',
  submitted: 'PENDING',           // Waiting in queue
  processing: 'PROCESSING',       // Being evaluated
  completed: {
    success: 'SUCCESS',           // All tests passed
    partial: 'PARTIAL',           // Some tests passed
    failed: 'FAILED'              // All/most tests failed
  },
  error: 'ERROR'                  // Execution error
};
```

### 4. Error Handling
- Network errors with retry logic
- Validation errors with field-level messaging
- Server errors with user-friendly messages
- 404 errors for missing problems/submissions
- 401/403 errors for authentication/authorization

### 5. Performance Optimization
- Code editor lazy loading
- Problem list pagination
- Submission history pagination
- Image optimization
- CSS splitting
- Bundle size optimization

### 6. Security Considerations
- Store tokens in secure httpOnly cookies (if possible)
- Validate all user inputs
- Sanitize code before display
- CSRF protection
- XSS prevention
- Content Security Policy headers

### 7. Responsive Design
- Mobile-first approach
- Tablet optimization
- Desktop optimization
- Touch-friendly button sizes
- Responsive layouts for editor and results

---

## API Base URLs Configuration

The frontend needs to be configured to communicate with services. Create environment variables:

```env
VITE_API_USER_SERVICE_URL=http://localhost:3001/api      # User-Service
VITE_API_PROBLEM_SERVICE_URL=http://localhost:3002/api   # Problem-Service
VITE_API_SUBMISSION_SERVICE_URL=http://localhost:3003/api # Submission-Service
VITE_SOCKET_IO_URL=http://localhost:3001                 # Socket-Service
```

Or create a centralized API client config based on your actual service ports.

---

## Testing Scenarios

### Manual Testing Checklist
1. **Registration**
   - Valid registration with all fields
   - Duplicate email/username error
   - Password validation errors
   - Form validation

2. **Login**
   - Valid credentials
   - Invalid credentials
   - Token refresh on expiry
   - Auto-logout on token expiry

3. **Problem Browsing**
   - Fetch all problems
   - Filter by difficulty
   - Search by title
   - Pagination

4. **Code Submission**
   - Submit code in different languages
   - View submission status transitions
   - Receive real-time results via WebSocket
   - See test case results

5. **Submission History**
   - View all user submissions
   - Filter submissions
   - View submission details
   - See acceptance rate

6. **Real-Time Updates**
   - WebSocket connection established
   - setUserId event sent
   - Receive submissionPayloadResponse in real-time

---

## Future Enhancements (Nice to Have)
1. Discussion/Comments on problems
2. User leaderboard/rankings
3. Problem tags/categories
4. Difficulty-based problem recommendations
5. Blind mode (hide problem statement)
6. Solution video explanations
7. Premium features (company-specific problems, interview kits)
8. Bookmarks/Favorites
9. Code templates/snippets
10. Custom test case runner
11. Multiple submission attempts tracking
12. Time-based challenges/contests
13. Dark mode toggle
14. Accessibility features (WCAG compliance)
15. Internationalization (i18n)
