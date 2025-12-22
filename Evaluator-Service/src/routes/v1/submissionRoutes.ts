import express from "express";

import { addSubmission, sampleSubmission } from "../../controllers/submissionController";
import { createSubmissionZodSchema } from "../../dtos/CreateSubmissionDto";
import { validate } from "../../validators/zodValidator";


const submissionRouter = express.Router();

submissionRouter.post(
    '/',
    validate(createSubmissionZodSchema),
    addSubmission
);

submissionRouter.post(
    '/dummy',
    sampleSubmission
)

export default submissionRouter;