# Multi-Test Case Evaluation Flow

## Payload Structure

### Submission-Service → Queue

```javascript
{
  [submissionId]: {
    code: "function twoSum(nums, target) { ... }",
    language: "javascript",
    testCases: [
      {
        input: "1 2 3 4",
        output: "0 1"
      },
      {
        input: "5 6 7 8",
        output: "0 3"
      },
      {
        input: "10 20 30",
        output: "0 2"
      }
    ],
    userId: "user123",
    submissionId: "sub456",
    problemId: "prob789"
  }
}
```

## Processing Flow

```
1. User submits code
   ↓
2. Submission-Service.addSubmission()
   - Fetch problem details (includes ALL testCases)
   - Wrap code with codeStubs (startSnippet + userCode + endSnippet)
   - Save submission to DB with initial status: "PENDING"
   - Push to queue with ALL testCases
   ↓
3. BullMQ Queue receives job
   ↓
4. Evaluator-Service Worker picks up job
   - SubmissionJob.handle() is called
   - Iterate through ALL testCases
   - For each test case:
     * Execute code with input
     * Compare output with expected output
     * Mark as PASS or FAIL
   - Aggregate results
   - Return EvaluationResult
   ↓
5. Queue Job Complete (with return value)
   ↓
6. Send results back to Submission-Service
   - Via webhook callback (Option A - RECOMMENDED)
   - Via Redis (Option B)
   ↓
7. Update submission status in DB
   - status: "COMPLETED"
   - testResults: [...]
   - passedTests: 3/3 or 2/3
```

## Evaluation Result Structure

```typescript
{
  submissionId: "sub456",
  userId: "user123",
  totalTestCases: 3,
  passedTestCases: 2,
  failedTestCases: 1,
  overallStatus: "PARTIAL",  // "SUCCESS" | "PARTIAL" | "FAILED"
  testResults: [
    {
      testCaseIndex: 0,
      input: "1 2 3 4",
      expectedOutput: "0 1",
      actualOutput: "0 1",
      status: "PASS"
    },
    {
      testCaseIndex: 1,
      input: "5 6 7 8",
      expectedOutput: "0 3",
      actualOutput: "0 2",  // Wrong answer
      status: "FAIL"
    },
    {
      testCaseIndex: 2,
      input: "10 20 30",
      expectedOutput: "0 2",
      actualOutput: "0 2",
      status: "PASS"
    }
  ]
}
```

## Key Changes Made

### 1. Submission-Service (submissionService.js)
```javascript
// OLD: Only first test case
inputCase: problemAdminApiResponse.data.testCases[0].input,
outputCase: problemAdminApiResponse.data.testCases[0].output,

// NEW: All test cases
testCases: problemAdminApiResponse.data.testCases,
```

### 2. Evaluator-Service (SubmissionJob.ts)
```typescript
// OLD: Single test case execution
const response = await strategy.execute(code, inputTestCase, outputTestCase);

// NEW: Loop through all test cases
for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    const response = await strategy.execute(code, testCase.input, testCase.output);
    testResults.push({...});
}
```

### 3. Types (types.ts)
Added:
- `testCases: TestCase[]` instead of individual inputCase/outputCase
- `TestResult` - individual test result
- `EvaluationResult` - complete evaluation summary

## Next Steps

### Option A: Webhook Callback (RECOMMENDED)

**Evaluator-Service** (SubmissionJob.ts):
```typescript
import axios from 'axios';

// After aggregating results
const webhookUrl = process.env.SUBMISSION_SERVICE_WEBHOOK_URL 
  || 'http://localhost:3001/api/v1/submissions/evaluate-result';

await axios.post(webhookUrl, evaluationResult);
```

**Submission-Service** (submissionController.js):
```javascript
async handleEvaluationResult(req, res) {
    const { submissionId, passedTestCases, totalTestCases, testResults } = req.body;
    
    const updatedSubmission = await submissionRepository.updateSubmission(
        submissionId,
        {
            status: "COMPLETED",
            passedTests: passedTestCases,
            totalTests: totalTestCases,
            testResults,
            completedAt: new Date()
        }
    );
    
    return res.json({ success: true, data: updatedSubmission });
}
```

### Option B: Redis Result Storage

**Evaluator-Service** (SubmissionJob.ts):
```typescript
import redisClient from '../config/redisConfig';

// After aggregating results
await redisClient.hset(
    `evaluation:${submissionId}`,
    'result',
    JSON.stringify(evaluationResult)
);
await redisClient.expire(`evaluation:${submissionId}`, 3600); // 1 hour TTL
```

**Submission-Service** (submissionController.js):
```javascript
async getEvaluationResult(req, res) {
    const { submissionId } = req.params;
    const result = await redisClient.hget(`evaluation:${submissionId}`, 'result');
    
    if (result) {
        const evaluationResult = JSON.parse(result);
        await submissionRepository.updateSubmission(submissionId, evaluationResult);
    }
    
    return res.json({ success: true, data: evaluationResult });
}
```

## Status Codes

- **SUCCESS**: All test cases passed
- **PARTIAL**: Some test cases passed
- **FAILED**: No test cases passed or execution error

