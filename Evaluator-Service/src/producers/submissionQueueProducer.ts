import submissionQueue from "../queues/submissionQueue";
import { submission_job } from "../utils/constants";

export default async function (payload: Record<string, unknown>) {
    await submissionQueue.add(submission_job, payload);
    console.log("Successfully added a new submission job");
}