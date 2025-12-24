const express = require('express');

const { problemController } = require('../../controllers');
const validateRequest = require('../../validators/schemaValidator');
const { createProblemSchema, updateProblemSchema } = require('../../validators/problem.validator');

const problemRouter = express.Router();

// If any request comes and route continues with /ping, we map it to pingProblemController
problemRouter.get('/ping', problemController.pingProblemController);

problemRouter.get('/:id', problemController.getProblem);

problemRouter.get('/', problemController.getProblems);

problemRouter.post('/', validateRequest(createProblemSchema), problemController.addProblem);

problemRouter.delete('/:id', problemController.deleteProblem);

problemRouter.put('/:id', validateRequest(updateProblemSchema), problemController.updateProblem);


module.exports = problemRouter;
