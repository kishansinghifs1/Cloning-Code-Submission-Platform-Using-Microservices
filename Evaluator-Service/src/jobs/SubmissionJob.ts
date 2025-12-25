import axios from "axios";
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

      if (!submissionData) {
        throw new Error("Invalid payload: submission data not found");
      }

      const codeLanguage = submissionData.language;
      const code = submissionData.code;
      const testCases = submissionData.testCases;
      const submissionId = submissionData.submissionId;
      const userId = submissionData.userId;

      const strategy = createExecutor(codeLanguage);

      if (strategy != null) {
        const testResults: TestResult[] = [];
        let passedCount = 0;
        const startTime = Date.now();
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

        const executionTime = Date.now() - startTime;

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
          executionTime,
        };

        await this.sendWebhookCallback(evaluationResult);

        return evaluationResult;
      } else {
        throw new Error(`No executor found for language: ${codeLanguage}`);
      }
    }
  };

  private sendWebhookCallback = async (evaluationResult: EvaluationResult) => {
    try {
      const webhookUrl = process.env.SUBMISSION_SERVICE_WEBHOOK_URL ||
        `http://localhost:5000/api/v1/submissions/${evaluationResult.submissionId}/evaluate-result`;

      console.log(`Sending webhook callback to: ${webhookUrl}`);

      const response = await axios.post(webhookUrl, evaluationResult, {
        timeout: 5000
      });

      console.log(`Webhook callback sent successfully`);
      return response.data;
    } catch (error) {
      console.error(
        `Failed to send webhook callback`,
        error instanceof Error ? error.message : error
      );
    }
  };

  failed = (job?: Job): void => {
    console.error("Job failed");
    if (job) {
      console.error("Job ID:", job.id);
      console.error("Error:", job.failedReason);
    }
  };
}
