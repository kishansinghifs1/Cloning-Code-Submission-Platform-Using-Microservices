const { createSubmission, getSubmission, getUserSubmissions, handleEvaluationResult } = require("../../../controllers/submissionController");

async function submissionRoutes(fastify, options) {
    // Create new submission
    fastify.post('/', createSubmission);
    
    // Get all submissions for a user (must be before /:submissionId to avoid route conflict)
    fastify.get('/', getUserSubmissions);
    
    // Get specific submission by ID
    fastify.get('/:submissionId', getSubmission);
    
    // Webhook endpoint: Evaluator-Service sends evaluation results here
    fastify.post('/:submissionId/evaluate-result', handleEvaluationResult);
}

module.exports = submissionRoutes;