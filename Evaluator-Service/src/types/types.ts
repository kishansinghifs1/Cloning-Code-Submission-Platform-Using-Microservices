import { Job } from "bullmq";

export interface CodeExecutorStrategy {
    execute(code: string, inputTestCase: string, outputTestCase: string): Promise<ExecutionResponse>;
}

export type ExecutionResponse = {
    output: string,
    status: string
};

export interface IJob {
    name: string
    payload?: Record<string, unknown>
    handle: (job?: Job) => void
    failed: (job?: Job) => void
}

export interface WorkerResponse {
    status: number,
    message: string
}

export interface DockerStreamOutput {
    stdout: string;
    stderr: string;
}

export type SubmissionPayload = {
    code: string,
    language: string,
    testCases: TestCase[],
    userId: string,
    submissionId: string,
    problemId?: string
};

export type TestResult = {
    testCaseIndex: number,
    input: string,
    expectedOutput: string,
    actualOutput: string,
    status: 'PASS' | 'FAIL',
    error?: string
};

export type EvaluationResult = {
    submissionId: string,
    userId: string,
    totalTestCases: number,
    passedTestCases: number,
    failedTestCases: number,
    overallStatus: 'SUCCESS' | 'PARTIAL' | 'FAILED',
    testResults: TestResult[],
    executionTime?: number // milliseconds
};

export type TestCase = {
    input: string,
    output: string
};

export type TestCases = TestCase[]; 
