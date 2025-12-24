import { Queue } from "bullmq";

import redisConnection from "../config/redisConfig";
import { submission_queue } from "../utils/constants";

export default new Queue(submission_queue, { connection: redisConnection });