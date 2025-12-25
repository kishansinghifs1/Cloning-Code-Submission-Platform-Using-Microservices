// Submission related types

export interface Submission {
    _id: string;
    userId: string;
    problemId: string;
    code: string;
    language: string;
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
    overallStatus?: 'ACCEPTED' | 'WRONG_ANSWER' | 'TIME_LIMIT_EXCEEDED' | 'RUNTIME_ERROR' | 'COMPILATION_ERROR';
    testResults?: TestResult[];
    totalTestCases?: number;
    passedTestCases?: number;
    failedTestCases?: number;
    executionTime?: number;
    createdAt: string;
    completedAt?: string;
}

export interface TestResult {
    testCaseId: string;
    status: 'PASSED' | 'FAILED' | 'ERROR' | 'TIMEOUT';
    input?: string;
    expectedOutput?: string;
    actualOutput?: string;
    executionTime?: number;
    errorMessage?: string;
}

export interface CreateSubmissionData {
    code: string;
    language: string;
    problemId: string;
    userId: string;
}

export interface SubmissionResponse {
    success: boolean;
    message: string;
    data: Submission;
}

export interface SubmissionsListResponse {
    success: boolean;
    message: string;
    data: Submission[];
    total: number;
    limit: number;
    offset: number;
}
