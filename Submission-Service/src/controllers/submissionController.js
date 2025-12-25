const ApiResponse = require('../utils/apiResponse');
const Logger = require('../utils/logger');
const {
    submissionValidationSchema,
    getSubmissionSchema,
    getUserSubmissionsSchema,
    evaluationResultSchema
} = require('../validators/submissionValidator');

const logger = new Logger('SubmissionController');

async function createSubmission(req, res) {
    try {
        const { error, value } = submissionValidationSchema.validate(req.body);

        if (error) {
            logger.warn('Validation failed for create submission', { error: error.details });
            return res.status(400).send(
                ApiResponse.error(
                    'Validation failed',
                    error.details.map(d => d.message).join(', ')
                )
            );
        }

        logger.info('Creating submission', { userId: value.userId, problemId: value.problemId });

        const response = await this.submissionService.addSubmission(value);

        logger.info('Submission created successfully', { submissionId: response.submission._id });

        return res.status(201).send(
            ApiResponse.success(response, 'Submission created successfully')
        );
    } catch (error) {
        logger.error('Error creating submission', error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).send(
            ApiResponse.error(
                error.message || 'Failed to create submission',
                error.details || null
            )
        );
    }
}

async function getSubmission(req, res) {
    try {
        const { error, value } = getSubmissionSchema.validate({ submissionId: req.params.submissionId });

        if (error) {
            logger.warn('Validation failed for get submission');
            return res.status(400).send(
                ApiResponse.error('Validation failed', error.details[0].message)
            );
        }

        logger.debug('Fetching submission', { submissionId: value.submissionId });

        const submission = await this.submissionRepository.findById(value.submissionId);

        if (!submission) {
            logger.warn('Submission not found', { submissionId: value.submissionId });
            return res.status(404).send(
                ApiResponse.error('Submission not found', null, null)
            );
        }

        logger.info('Submission retrieved', { submissionId: value.submissionId });

        return res.status(200).send(
            ApiResponse.success(submission, 'Submission retrieved successfully')
        );
    } catch (error) {
        logger.error('Error retrieving submission', error);
        return res.status(500).send(
            ApiResponse.error('Internal server error', error.message)
        );
    }
}

async function getUserSubmissions(req, res) {
    try {
        const { error, value } = getUserSubmissionsSchema.validate(req.query);

        if (error) {
            logger.warn('Validation failed for get user submissions');
            return res.status(400).send(
                ApiResponse.error('Validation failed', error.details[0].message)
            );
        }

        logger.debug('Fetching user submissions', { userId: value.userId, limit: value.limit, offset: value.offset });

        const result = await this.submissionRepository.findByUserId(value.userId, value.limit, value.offset);

        logger.info('User submissions retrieved', { userId: value.userId, count: result.data.length });

        return res.status(200).send(
            ApiResponse.paginated(
                result.data,
                result.total,
                value.limit,
                value.offset,
                'User submissions retrieved successfully'
            )
        );
    } catch (error) {
        logger.error('Error retrieving user submissions', error);
        return res.status(500).send(
            ApiResponse.error('Internal server error', error.message)
        );
    }
}

async function handleEvaluationResult(req, res) {
    try {
        const { submissionId } = req.params;
        const evaluationResult = req.body;

        // Validate request
        const { error, value } = evaluationResultSchema.validate({
            submissionId,
            ...evaluationResult
        });

        if (error) {
            logger.warn('Validation failed for evaluation result', { submissionId, error: error.details });
            return res.status(400).send(
                ApiResponse.error(
                    'Validation failed',
                    error.details[0].message
                )
            );
        }

        logger.info('Processing evaluation result', { submissionId, status: value.overallStatus });

        const updatedSubmission = await this.submissionRepository.updateSubmission(
            submissionId,
            {
                status: 'COMPLETED',
                testResults: value.testResults,
                totalTestCases: value.totalTestCases,
                passedTestCases: value.passedTestCases,
                failedTestCases: value.failedTestCases,
                overallStatus: value.overallStatus,
                completedAt: new Date(),
                executionTime: value.executionTime,
                webhookFailed: false,
                webhookAttempts: 0
            }
        );

        if (!updatedSubmission) {
            logger.error('Submission not found for update', null, { submissionId });
            return res.status(404).send(
                ApiResponse.error('Submission not found', null, null)
            );
        }

        logger.info('Evaluation result processed successfully', { submissionId, status: value.overallStatus });

        return res.status(200).send(
            ApiResponse.success(updatedSubmission, 'Evaluation result processed successfully')
        );
    } catch (error) {
        logger.error('Error processing evaluation result', error, { submissionId: req.params.submissionId });
        return res.status(500).send(
            ApiResponse.error('Internal server error', error.message)
        );
    }
}

module.exports = {
    createSubmission,
    getSubmission,
    getUserSubmissions,
    handleEvaluationResult
};