# Submission-Service: Architecture Analysis & Implementation Plan

## Current Structure Overview

```
Submission-Service (Fastify + MongoDB + BullMQ)
├── API Layer
│   ├── POST /api/v1/submissions → createSubmission()
│   └── [MISSING] GET /api/v1/submissions/:id (retrieve result)
│   └── [MISSING] POST /api/v1/submissions/:id/evaluate-result (webhook)
│
├── Service Layer
│   └── SubmissionService.addSubmission()
│       ├── Fetches problem details from Problem-Service
│       ├── Applies code stubs (startSnippet + userCode + endSnippet)
│       ├── Saves submission to MongoDB
│       └── Pushes to SubmissionQueue → Evaluator-Service
│
├── Data Layer
│   ├── MongoDB: submissionModel (userId, problemId, code, language, status)
│   └── SubmissionRepository: createSubmission()
│
├── Queue Integration
│   ├── SubmissionQueue (producer): Sends jobs to Evaluator-Service
│   └── EvaluationQueue (consumer): Listens for results [BROKEN - currently posts to Evaluator-Service]
│
└── Worker Layer
    └── evaluationWorker: [NEEDS FIX] Should process results from Evaluator-Service
```

---

## Data Flow Issues

### Current (Incomplete) Flow:
```
1. User submits code
   ↓
2. POST /api/v1/submissions
   ↓
3. SubmissionService.addSubmission()
   - Fetch problem details ✅
   - Apply code stubs ✅
   - Save to DB with status: "Pending" ✅
   - Push to SubmissionQueue ✅
   ↓
4. Evaluator-Service processes job
   - Executes code against all test cases ✅
   - Returns EvaluationResult ✅
   ↓
5. [BROKEN] evaluationWorker receives result
   - Currently posts TO Evaluator-Service ❌
   - Doesn't update submission status ❌
   - No user notification ❌
   ↓
6. User has NO way to see results ❌
```

---

## Database Schema Issues

### Current submissionModel:
```javascript
{
  userId: String (unique),         // ❌ Should NOT be unique (user can submit multiple)
  problemId: String (unique),      // ❌ Should NOT be unique (many users solve same problem)
  code: String,
  language: String,
  status: String                   // ❌ Missing test results, completion details
}
```

### What's Missing:
```javascript
{
  userId: String,                  // Remove unique constraint
  problemId: String,               // Remove unique constraint
  code: String,
  language: String,
  status: String,                  // "PENDING", "PROCESSING", "SUCCESS", "FAILED", "ERROR"
  
  // ❌ MISSING - Evaluation Results:
  testResults: Array,              // Individual test case results
  totalTestCases: Number,          // Total tests run
  passedTestCases: Number,         // Tests passed
  failedTestCases: Number,         // Tests failed
  overallStatus: String,           // "SUCCESS", "PARTIAL", "FAILED"
  executionError: String,          // Runtime/compilation errors
  
  // ❌ MISSING - Metadata:
  submittedAt: Date,               // When user submitted
  completedAt: Date,               // When evaluation finished
  executionTime: Number,           // Total execution time (ms)
}
```

---

## Repository Issues

### Current submissionRepository:
```javascript
- createSubmission() ✅
```

### Missing Methods:
```javascript
- findById(submissionId)
- findByUserAndProblem(userId, problemId)
- updateSubmission(submissionId, updates)
- deleteSubmission(submissionId)
- findByUserId(userId)
- findByProblemId(problemId)
```

---

## Service Layer Issues

### Current SubmissionService:
```javascript
- addSubmission() ✅ (Creates & queues)
- pingCheck() ✅ (Health check)
```

### Missing Methods:
```javascript
- getSubmissionResult(submissionId)    // Retrieve results
- handleEvaluationResult(result)       // Process webhook from Evaluator-Service
- getUserSubmissions(userId)           // User's submission history
```

---

## Worker Issues

### Current evaluationWorker:
```javascript
new Worker('EvaluationQueue', async job => {
    // ❌ Posting back to Evaluator-Service (wrong direction)
    // ❌ Not updating submission status
    // ❌ No error handling
    // ❌ No database updates
})
```

### What Should Happen:
```javascript
new Worker('EvaluationQueue', async job => {
    1. Receive evaluation result from Evaluator-Service
    2. Extract: submissionId, testResults, overallStatus, etc.
    3. Update submission in MongoDB:
       - status: "COMPLETED" or "FAILED"
       - testResults: [...]
       - passedTestCases: N
       - completedAt: Date.now()
    4. Optional: Send notification to user (WebSocket, email, etc.)
})
```

---

## API Routes Issues

### Current Routes:
```
POST /api/v1/submissions                  ✅ Create submission
GET  /todos                                ❌ Wrong prefix (copy-paste error?)
```

### Missing Routes:
```
GET  /api/v1/submissions/:submissionId     ❌ Retrieve submission result
GET  /api/v1/submissions?userId=...        ❌ List user's submissions
POST /api/v1/submissions/:id/evaluate-result ❌ Webhook for evaluation results (from Evaluator-Service)
```

---

## Controllers Issues

### Current submissionController:
```javascript
- createSubmission()  ✅
```

### Missing Methods:
```javascript
- getSubmissionById(submissionId)      // GET /:id
- getUserSubmissions(userId)           // GET with query param
- handleEvaluationResult(result)       // POST /webhook endpoint
```

---

## Communication Issues

### Missing Connection: Evaluator-Service → Submission-Service
Currently evaluator-service returns results but Submission-Service doesn't handle them:

#### Option 1: Evaluator-Service Pushes Results (RECOMMENDED)
```
Evaluator-Service → POST http://localhost:3001/api/v1/submissions/:id/evaluate-result
```

#### Option 2: Submission-Service Polls Results
```
Submission-Service → Polls Redis/Database for results
```

---

## Implementation Plan

### Phase 1: Database Schema Update
1. **Update submissionModel**
   - Remove `unique` constraint from userId, problemId
   - Add test results fields: testResults[], totalTestCases, passedTestCases, failedTestCases
   - Add status fields: overallStatus, executionError
   - Add metadata: submittedAt, completedAt, executionTime

### Phase 2: Repository Enhancement
2. **Expand submissionRepository**
   - Add findById()
   - Add findByUserAndProblem()
   - Add updateSubmission()
   - Add findByUserId()
   - Add deleteSubmission()

### Phase 3: Service Layer Enhancement
3. **Update SubmissionService**
   - Add getSubmissionResult()
   - Add handleEvaluationResult()
   - Add getUserSubmissions()

### Phase 4: Fix Evaluation Worker
4. **Rewrite evaluationWorker**
   - Remove axios POST to Evaluator-Service
   - Add database update logic
   - Add proper error handling
   - Add logging

### Phase 5: Controller Expansion
5. **Add controllers**
   - Add getSubmissionById()
   - Add getUserSubmissions()
   - Add handleEvaluationResult() (webhook handler)
   - Add validation

### Phase 6: Route Update
6. **Register new routes**
   - GET /api/v1/submissions/:submissionId
   - GET /api/v1/submissions?userId=...
   - POST /api/v1/submissions/:submissionId/evaluate-result (webhook)

### Phase 7: Setup Webhook
7. **Configure Evaluator-Service callback**
   - Tell Evaluator-Service to POST results to Submission-Service webhook
   - Set environment variable: SUBMISSION_SERVICE_WEBHOOK_URL

---

## Dependencies Required

✅ Already installed:
- fastify, mongoose, bullmq, axios, ioredis

❌ Might need:
- zod (validation) - optional
- joi (validation) - optional

---

## Error Handling Strategy

```javascript
// Errors to handle:
1. Problem-Service unavailable
2. Code execution timeout
3. Code compilation error
4. Test case mismatch
5. Database connection lost
6. Queue processing failed
7. Webhook delivery failed (retry with exponential backoff)
```

---

## Testing Strategy

1. **Unit Tests**
   - SubmissionService.addSubmission()
   - SubmissionService.handleEvaluationResult()
   - Repository methods

2. **Integration Tests**
   - Full submission → evaluation → result flow
   - Multiple language support
   - Error scenarios

3. **Manual Testing**
   - Use test queue payload from evaluator-service
   - Monitor BullMQ UI for job status
   - Check MongoDB for updates

---

## Summary: What Needs to be Done

| Component | Status | Action |
|-----------|--------|--------|
| Database Schema | ❌ Incomplete | Update submissionModel |
| Repository | ❌ Minimal | Add CRUD methods |
| Service Layer | ⚠️ Partial | Add result handling |
| Controller | ❌ Minimal | Add GET/result handlers |
| Routes | ❌ Incomplete | Add missing endpoints |
| Worker | ❌ Broken | Rewrite evaluation handler |
| Error Handling | ❌ Missing | Implement try-catch, validation |
| Webhook Setup | ❌ Missing | Configure callback from Evaluator |

---

## Next Steps (After Approval)

Once you approve this plan, I'll implement:
1. Database schema update
2. Repository expansion
3. Service methods
4. Worker fix
5. Controllers
6. Routes
7. Error handling
8. Testing endpoints

Ready to proceed? ✅

