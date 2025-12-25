const { fetchProblemDetails } = require('../apis/problemAdminApi');
const codeCreator = require('../utils/codeCreator');
const SubmissionCreationError = require('../errors/submissionCreationError');
const SubmissionProducer = require('../producers/submissionQueueProducer');
const Logger = require('../utils/logger');

const logger = new Logger('SubmissionService');

const ALLOWED_LANGUAGES = ['cpp', 'java', 'python'];

class SubmissionService {
    constructor(submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    async pingCheck() {
        return 'pong';
    }

    async addSubmission(submissionPayload) {
        try {
            // Validate language
            if (!ALLOWED_LANGUAGES.includes(submissionPayload.language.toLowerCase())) {
                throw new SubmissionCreationError(
                    `Language '${submissionPayload.language}' is not supported. Allowed: ${ALLOWED_LANGUAGES.join(', ')}`
                );
            }

            const problemId = submissionPayload.problemId;
            const userId = submissionPayload.userId;

            logger.info('Fetching problem details', { problemId, userId });

            // Fetch problem details from Problem-Service
            let problemAdminApiResponse;
            try {
                problemAdminApiResponse = await fetchProblemDetails(problemId);
            } catch (error) {
                logger.error('Failed to fetch problem details', error, { problemId });
                throw new SubmissionCreationError('Failed to fetch problem details. Problem may not exist.');
            }

            if (!problemAdminApiResponse?.data) {
                logger.error('Invalid problem response', null, { problemId, response: problemAdminApiResponse });
                throw new SubmissionCreationError('Failed to fetch problem details');
            }

            // Find code stub for the language
            const languageCodeStub = problemAdminApiResponse.data.codeStubs?.find(
                codeStub => codeStub.language.toLowerCase() === submissionPayload.language.toLowerCase()
            );

            if (!languageCodeStub) {
                logger.warn('No code stub found for language', { language: submissionPayload.language, problemId });
                throw new SubmissionCreationError(
                    `No code stub found for language: ${submissionPayload.language}`
                );
            }

            // Create complete code with boilerplate
            const completeCode = codeCreator(
                languageCodeStub.startSnippet,
                submissionPayload.code,
                languageCodeStub.endSnippet
            );

            submissionPayload.code = completeCode;
            submissionPayload.status = 'PENDING';

            logger.debug('Creating submission in database', { userId, problemId });

            // Create submission in database
            const submission = await this.submissionRepository.createSubmission(submissionPayload);
            if (!submission) {
                throw new SubmissionCreationError('Failed to create submission in database');
            }

            logger.info('Submission created successfully', { submissionId: submission._id });

            try {
                // Push to evaluation queue
                const payload = {
                    [submission._id]: {
                        code: submission.code,
                        language: submission.language,
                        testCases: problemAdminApiResponse.data.testCases,
                        userId,
                        submissionId: submission._id,
                        problemId: problemId
                    }
                };

                await SubmissionProducer(payload);
                logger.info('Submission pushed to evaluation queue', { submissionId: submission._id });
            } catch (queueError) {
                logger.error('Failed to push submission to queue', queueError, { submissionId: submission._id });
                // Update submission status to ERROR
                await this.submissionRepository.updateSubmission(submission._id, {
                    status: 'ERROR',
                    executionError: 'Failed to queue submission for evaluation'
                });
                throw new SubmissionCreationError('Failed to queue submission for evaluation');
            }

            return { 
                queueResponse: 'Submission queued successfully', 
                submission: {
                    _id: submission._id,
                    userId: submission.userId,
                    problemId: submission.problemId,
                    language: submission.language,
                    status: submission.status,
                    submittedAt: submission.submittedAt
                }
            };
        } catch (error) {
            logger.error('Error in addSubmission', error, { payload: submissionPayload });
            throw error;
        }
    }

    async getSubmissionStatus(submissionId) {
        try {
            const submission = await this.submissionRepository.findById(submissionId);
            if (!submission) {
                return null;
            }
            return {
                _id: submission._id,
                userId: submission.userId,
                problemId: submission.problemId,
                status: submission.status,
                overallStatus: submission.overallStatus,
                passedTestCases: submission.passedTestCases,
                totalTestCases: submission.totalTestCases,
                submittedAt: submission.submittedAt,
                completedAt: submission.completedAt,
                executionTime: submission.executionTime
            };
        } catch (error) {
            logger.error('Error getting submission status', error, { submissionId });
            return null;
        }
    }
}

module.exports = SubmissionService;