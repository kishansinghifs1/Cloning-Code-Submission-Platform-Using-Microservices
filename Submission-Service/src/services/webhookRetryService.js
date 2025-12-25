const axios = require('axios');
const Logger = require('../utils/logger');

const logger = new Logger('WebhookRetryService');

const WEBHOOK_CONFIG = {
    MAX_RETRIES: 5,
    INITIAL_DELAY: 5000, // 5 seconds
    MAX_DELAY: 3600000, // 1 hour
    BACKOFF_MULTIPLIER: 2
};

class WebhookRetryService {
    constructor(submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    /**
     * Calculate next retry time using exponential backoff
     */
    calculateNextRetry(attemptCount) {
        let delay = WEBHOOK_CONFIG.INITIAL_DELAY * Math.pow(
            WEBHOOK_CONFIG.BACKOFF_MULTIPLIER,
            attemptCount
        );

        delay = Math.min(delay, WEBHOOK_CONFIG.MAX_DELAY);
        return new Date(Date.now() + delay);
    }

    /**
     * Send webhook callback with retry logic
     */
    async sendWebhookCallback(submission) {
        try {
            const webhookUrl = process.env.SUBMISSION_SERVICE_WEBHOOK_URL ||
                `http://localhost:5000/api/v1/submissions/${submission._id}/evaluate-result`;

            logger.debug('Sending webhook callback', { submissionId: submission._id, webhookUrl });

            const evaluationResult = {
                submissionId: submission._id,
                userId: submission.userId,
                totalTestCases: submission.totalTestCases,
                passedTestCases: submission.passedTestCases,
                failedTestCases: submission.failedTestCases,
                overallStatus: submission.overallStatus,
                testResults: submission.testResults,
                executionTime: submission.executionTime
            };

            const response = await axios.post(webhookUrl, evaluationResult, {
                timeout: 10000,
                headers: {
                    'Content-Type': 'application/json',
                    'X-Submission-ID': submission._id
                }
            });

            logger.info('Webhook callback sent successfully', {
                submissionId: submission._id,
                statusCode: response.status
            });

            return { success: true, response };
        } catch (error) {
            logger.error('Webhook callback failed', error, { submissionId: submission._id });
            return { success: false, error };
        }
    }

    /**
     * Retry failed webhook submissions
     */
    async retryFailedWebhooks() {
        try {
            logger.info('Starting webhook retry process');

            const failedSubmissions = await this.submissionRepository.findFailedWebhookSubmissions();

            if (failedSubmissions.length === 0) {
                logger.debug('No failed webhooks to retry');
                return;
            }

            logger.info(`Found ${failedSubmissions.length} submissions with failed webhooks`);

            for (const submission of failedSubmissions) {
                try {
                    if (submission.webhookAttempts >= WEBHOOK_CONFIG.MAX_RETRIES) {
                        logger.warn('Max webhook retries exceeded', { submissionId: submission._id });
                        // Could send alert or notification here
                        continue;
                    }

                    const result = await this.sendWebhookCallback(submission);

                    if (result.success) {
                        // Success - mark webhook as resolved
                        await this.submissionRepository.updateSubmission(submission._id, {
                            webhookFailed: false,
                            webhookAttempts: 0,
                            lastWebhookAttempt: new Date()
                        });
                        logger.info('Webhook retry successful', { submissionId: submission._id });
                    } else {
                        // Failure - schedule next retry
                        const nextRetry = this.calculateNextRetry(submission.webhookAttempts);
                        await this.submissionRepository.incrementWebhookAttempt(submission._id, nextRetry);
                        logger.warn('Webhook retry failed, scheduled next attempt', {
                            submissionId: submission._id,
                            attempt: submission.webhookAttempts + 1,
                            nextRetry
                        });
                    }
                } catch (error) {
                    logger.error('Error processing webhook retry', error, { submissionId: submission._id });
                }
            }

            logger.info('Webhook retry process completed');
        } catch (error) {
            logger.error('Error in retryFailedWebhooks', error);
        }
    }

    /**
     * Start periodic retry job (should be called once on server start)
     */
    startRetryJob(intervalMs = 60000) {
        logger.info('Starting webhook retry job with interval', { intervalMs });

        setInterval(async () => {
            try {
                await this.retryFailedWebhooks();
            } catch (error) {
                logger.error('Error in retry job interval', error);
            }
        }, intervalMs);
    }
}

module.exports = WebhookRetryService;
