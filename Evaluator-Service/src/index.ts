import express, { Response } from "express";

import bullBoardAdapter from "./config/bullBoardConfig";
import serverConfig from "./config/serverConfig";
import SubmissionWorker from "./workers/SubmissionWorker";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/ping", (res: Response): void => {
  res.status(200).send("Pong");
});

app.use("/ui", bullBoardAdapter.getRouter());

// Start the submission queue worker
SubmissionWorker('SubmissionQueue');

app.listen(serverConfig.PORT, () => {
  console.log(`🚀 Evaluator Service is up on port ${serverConfig.PORT}`);
  console.log(`📊 BullMQ UI available at http://localhost:${serverConfig.PORT}/ui`);
  console.log(`⏳ Waiting for jobs from SubmissionQueue...`);
});



// import submissionQueueProducer from "./producers/submissionQueueProducer";
// import { submission_queue } from "./utils/constants";
// import SubmissionWorker from "./workers/SubmissionWorker";

// const submissionId: string = "67639f8c9d8b2c5a1f9e0a1b";
// const dummyCode: string = `
// import java.util.*;

// public class Main {
//     public static void main(String[] args) {
//         Scanner sc = new Scanner(System.in);
//         int a = sc.nextInt();
//         int b = sc.nextInt();
//         System.out.print(a + b);
//         sc.close();
//     }
// }
// `;
// const dummyPayload = {
//   [submissionId]: {
//     code: dummyCode,
//     language: "JAVA",
//     testCases: [
//       {
//         input: "5 3",
//         output: "8",
//       },
//       {
//         input: "10 20",
//         output: "30",
//       },
//       {
//         input: "100 50",
//         output: "150",
//       },
//     ],
//     userId: "user123",
//     submissionId: submissionId,
//     problemId: "problem456",
//   },
// };

// SubmissionWorker(submission_queue);
// submissionQueueProducer(dummyPayload);