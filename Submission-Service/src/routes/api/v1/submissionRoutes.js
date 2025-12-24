const { createSubmission, getSubmission, getUserSubmissions, handleEvaluationResult } = require("../../../controllers/submissionController");

async function submissionRoutes(fastify, options) {
    // Create new submission
    fastify.post('/', createSubmission);
    
    // Get specific submission by ID
    fastify.get('/:submissionId', getSubmission);
    
    // Get all submissions for a user
    fastify.get('/', getUserSubmissions);
    
    // Webhook endpoint: Evaluator-Service sends evaluation results here
    fastify.post('/:submissionId/evaluate-result', handleEvaluationResult);
}

module.exports = submissionRoutes;