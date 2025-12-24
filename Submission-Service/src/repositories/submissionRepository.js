const Submission = require('../models/submissionModel');

class SubmissionRepository {
    constructor() {
        this.submissionModel = Submission;
    }

    async createSubmission(submission) {
        const response = await this.submissionModel.create(submission);
        return response;
    }

    async findById(submissionId) {
        try {
            const submission = await this.submissionModel.findById(submissionId);
            return submission;
        } catch (error) {
            console.error('Error finding submission by ID:', error);
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
            console.error('Error finding submission by user and problem:', error);
            return [];
        }
    }

    async findByUserId(userId) {
        try {
            const submissions = await this.submissionModel
                .find({ userId })
                .sort({ submittedAt: -1 });
            return submissions;
        } catch (error) {
            console.error('Error finding submissions by user ID:', error);
            return [];
        }
    }

    async updateSubmission(submissionId, updates) {
        try {
            const submission = await this.submissionModel.findByIdAndUpdate(
                submissionId,
                updates,
                { new: true, runValidators: true }
            );
            return submission;
        } catch (error) {
            console.error('Error updating submission:', error);
            return null;
        }
    }

    async deleteSubmission(submissionId) {
        try {
            const submission = await this.submissionModel.findByIdAndDelete(submissionId);
            return submission;
        } catch (error) {
            console.error('Error deleting submission:', error);
            return null;
        }
    }
}

module.exports = SubmissionRepository;