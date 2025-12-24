import { Job } from "bullmq";

import { IJob } from "../types/types";
import {
  EvaluationResult,
  ExecutionResponse,
  SubmissionPayload,
  TestResult,
} from "../types/types";
import createExecutor from "../utils/ExecutorFactory";

export default class SubmissionJob implements IJob {
  name: string;
  payload: Record<string, SubmissionPayload>;
  constructor(payload: Record<string, SubmissionPayload>) {
    this.payload = payload;
    this.name = this.constructor.name;
  }

  handle = async (job?: Job) => {
    console.log("Processing submission job", this.payload);
    if (job) {
      const key = Object.keys(this.payload)[0];
      const submissionData: SubmissionPayload = this.payload[key];

      const codeLanguage = submissionData.language;
      const code = submissionData.code;
      const testCases = submissionData.testCases;
      const submissionId = submissionData.submissionId;
      const userId = submissionData.userId;

      const strategy = createExecutor(codeLanguage);

      if (strategy != null) {
        const testResults: TestResult[] = [];
        let passedCount = 0;
        for (let i = 0; i < testCases.length; i++) {
          const testCase = testCases[i];
          try {
            const response: ExecutionResponse = await strategy.execute(
              code,
              testCase.input,
              testCase.output
            );

            const testPassed = response.status === "SUCCESS";
            if (testPassed) passedCount++;

            const testResult: TestResult = {
              testCaseIndex: i,
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput: response.output || "",
              status: testPassed ? "PASS" : "FAIL",
            };

            testResults.push(testResult);
            console.log(`Test case ${i}: ${testResult.status}`);
          } catch (error) {
            const testResult: TestResult = {
              testCaseIndex: i,
              input: testCase.input,
              expectedOutput: testCase.output,
              actualOutput: "",
              status: "FAIL",
              error: error instanceof Error ? error.message : String(error),
            };
            testResults.push(testResult);
            console.log(`Test case ${i}: FAIL - ${testResult.error}`);
          }
        }

        
        const evaluationResult: EvaluationResult = {
          submissionId,
          userId,
          totalTestCases: testCases.length,
          passedTestCases: passedCount,
          failedTestCases: testCases.length - passedCount,
          overallStatus:
            passedCount === testCases.length
              ? "SUCCESS"
              : passedCount > 0
              ? "PARTIAL"
              : "FAILED",
          testResults,
        };

        console.log("Evaluation complete:", evaluationResult);

        // TODO: Send results back to Submission-Service via webhook or Redis
        // For now, just return the result (can be accessed via job.returnvalue)
        return evaluationResult;
      } else {
        throw new Error(`No executor found for language: ${codeLanguage}`);
      }
    }
  };

  failed = (job?: Job): void => {
    console.log("Job failed");
    if (job) {
      console.log("Job ID:", job.id);
      console.log("Error:", job.failedReason);
    }
  };
}
