const Submission = require('../models/submissionModel');
const Logger = require('../utils/logger');

const logger = new Logger('SubmissionRepository');

class SubmissionRepository {
    constructor() {
        this.submissionModel = Submission;
    }

    async createSubmission(submission) {
        try {
            const response = await this.submissionModel.create(submission);
            logger.debug('Submission created', { submissionId: response._id });
            return response;
        } catch (error) {
            logger.error('Failed to create submission', error, { submission });
            throw error;
        }
    }

    async findById(submissionId) {
        try {
            const submission = await this.submissionModel.findById(submissionId);
            if (!submission) {
                logger.warn('Submission not found', { submissionId });
            }
            return submission;
        } catch (error) {
            logger.error('Error finding submission by ID', error, { submissionId });
            return null;
        }
    }

    async findByUserAndProblem(userId, problemId) {
        try {
            const submissions = await this.submissionModel.find({
                userId,
                problemId
            }).sort({ submittedAt: -1 });
            return submissions;
        } catch (error) {
            logger.error('Error finding submission by user and problem', error, { userId, problemId });
            return [];
        }
    }

    async findByUserId(userId, limit = 20, offset = 0) {
        try {
            const [submissions, total] = await Promise.all([
                this.submissionModel
                    .find({ userId })
                    .sort({ submittedAt: -1 })
                    .limit(limit)
                    .skip(offset)
                    .lean(),
                this.submissionModel.countDocuments({ userId })
            ]);
            
            return { data: submissions, total };
        } catch (error) {
            logger.error('Error finding submissions by user ID', error, { userId, limit, offset });
            return { data: [], total: 0 };
        }
    }

    async updateSubmission(submissionId, updates) {
        try {
            const submission = await this.submissionModel.findByIdAndUpdate(
                submissionId,
                updates,
                { new: true, runValidators: true }
            );
            
            if (!submission) {
                logger.warn('Submission not found for update', { submissionId, updates });
            } else {
                logger.debug('Submission updated', { submissionId, updates });
            }
            
            return submission;
        } catch (error) {
            logger.error('Error updating submission', error, { submissionId, updates });
            return null;
        }
    }

    async deleteSubmission(submissionId) {
        try {
            const submission = await this.submissionModel.findByIdAndDelete(submissionId);
            if (submission) {
                logger.info('Submission deleted', { submissionId });
            }
            return submission;
        } catch (error) {
            logger.error('Error deleting submission', error, { submissionId });
            return null;
        }
    }

    async findFailedWebhookSubmissions(limit = 10) {
        try {
            return await this.submissionModel
                .find({
                    webhookFailed: true,
                    nextRetryAt: { $lt: new Date() }
                })
                .sort({ nextRetryAt: 1 })
                .limit(limit);
        } catch (error) {
            logger.error('Error finding failed webhook submissions', error);
            return [];
        }
    }

    async incrementWebhookAttempt(submissionId, nextRetryAt) {
        try {
            return await this.submissionModel.findByIdAndUpdate(
                submissionId,
                {
                    $inc: { webhookAttempts: 1 },
                    lastWebhookAttempt: new Date(),
                    nextRetryAt
                },
                { new: true }
            );
        } catch (error) {
            logger.error('Error incrementing webhook attempt', error, { submissionId });
            return null;
        }
    }

    async markWebhookFailed(submissionId, nextRetryAt) {
        try {
            return await this.submissionModel.findByIdAndUpdate(
                submissionId,
                {
                    webhookFailed: true,
                    nextRetryAt,
                    lastWebhookAttempt: new Date()
                },
                { new: true }
            );
        } catch (error) {
            logger.error('Error marking webhook as failed', error, { submissionId });
            return null;
        }
    }
}

module.exports = SubmissionRepository;