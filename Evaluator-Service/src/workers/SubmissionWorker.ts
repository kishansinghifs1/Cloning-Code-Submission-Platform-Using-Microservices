import { Job, Worker } from "bullmq";

import redisConnection from "../config/redisConfig";
import SubmissionJob from "../jobs/SubmissionJob";
import { submission_job } from "../utils/constants";

export default function SubmissionWorker(queueName: string) {
    new Worker(
        queueName,
        async (job: Job) => {
            if (job.name === submission_job) {
                const submissionJobInstance = new SubmissionJob(job.data);
                submissionJobInstance.handle(job);
                return true;
            }
        },
        {
            connection: redisConnection
        }
    );
}