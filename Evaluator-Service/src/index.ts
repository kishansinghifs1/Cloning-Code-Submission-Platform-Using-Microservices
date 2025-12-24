import express, { Response } from "express";

import bullBoardAdapter from "./config/bullBoardConfig";
import serverConfig from "./config/serverConfig";
import { submission_queue } from "./utils/constants";
import SubmissionWorker from "./workers/SubmissionWorker";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/ping", (res: Response): void => {
  res.status(200).send("Pong");
});

app.use("/ui", bullBoardAdapter.getRouter());

SubmissionWorker(submission_queue);

app.listen(serverConfig.PORT, () => {
  console.log(`Evaluator Service is up`);
  console.log(`BullMQ UI available at http://localhost:${serverConfig.PORT}/ui`);
});
