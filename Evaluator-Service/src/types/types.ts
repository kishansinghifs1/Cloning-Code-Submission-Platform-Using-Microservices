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
    inputCase: string,
    outputCase: string
}

export type TestCase = {
    input: string,
    output: string
};

export type TestCases = TestCase[]; 
