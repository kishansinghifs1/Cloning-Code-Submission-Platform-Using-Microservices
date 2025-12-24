// TODO: Add validation layer

async function createSubmission(req, res) {
    const response = await this.submissionService.addSubmission(req.body);
    return res.status(201).send({
        error: {},
        data: response,
        success: true,
        message: 'Created submission successfully'
    })
}

async function getSubmission(req, res) {
    try {
        const { submissionId } = req.params;
        
        if (!submissionId) {
            return res.status(400).send({
                error: { submissionId: 'Submission ID is required' },
                data: null,
                success: false,
                message: 'Submission ID is required'
            });
        }

        const submission = await this.submissionRepository.findById(submissionId);
        
        if (!submission) {
            return res.status(404).send({
                error: { notFound: 'Submission not found' },
                data: null,
                success: false,
                message: 'Submission not found'
            });
        }

        return res.status(200).send({
            error: {},
            data: submission,
            success: true,
            message: 'Submission retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getSubmission:', error);
        return res.status(500).send({
            error: { internal: error.message },
            data: null,
            success: false,
            message: 'Internal server error'
        });
    }
}

async function getUserSubmissions(req, res) {
    try {
        const { userId } = req.query;
        
        if (!userId) {
            return res.status(400).send({
                error: { userId: 'User ID is required' },
                data: null,
                success: false,
                message: 'User ID is required as query parameter'
            });
        }

        const submissions = await this.submissionRepository.findByUserId(userId);
        
        return res.status(200).send({
            error: {},
            data: submissions,
            success: true,
            message: 'User submissions retrieved successfully'
        });
    } catch (error) {
        console.error('Error in getUserSubmissions:', error);
        return res.status(500).send({
            error: { internal: error.message },
            data: null,
            success: false,
            message: 'Internal server error'
        });
    }
}

async function handleEvaluationResult(req, res) {
    try {
        const { submissionId } = req.params;
        const evaluationResult = req.body;

        if (!submissionId) {
            return res.status(400).send({
                error: { submissionId: 'Submission ID is required' },
                success: false,
                message: 'Submission ID is required'
            });
        }

        if (!evaluationResult) {
            return res.status(400).send({
                error: { evaluationResult: 'Evaluation result is required' },
                success: false,
                message: 'Evaluation result is required'
            });
        }

        // Update submission with evaluation results
        const updatedSubmission = await this.submissionRepository.updateSubmission(
            submissionId,
            {
                status: 'COMPLETED',
                testResults: evaluationResult.testResults,
                totalTestCases: evaluationResult.totalTestCases,
                passedTestCases: evaluationResult.passedTestCases,
                failedTestCases: evaluationResult.failedTestCases,
                overallStatus: evaluationResult.overallStatus,
                completedAt: new Date(),
                executionTime: evaluationResult.executionTime
            }
        );

        if (!updatedSubmission) {
            return res.status(404).send({
                error: { notFound: 'Submission not found' },
                success: false,
                message: 'Failed to update submission'
            });
        }

        console.log(`✅ Evaluation result received and saved for submission ${submissionId}`);

        return res.status(200).send({
            error: {},
            data: updatedSubmission,
            success: true,
            message: 'Evaluation result processed successfully'
        });
    } catch (error) {
        console.error('❌ Error in handleEvaluationResult:', error);
        return res.status(500).send({
            error: { internal: error.message },
            success: false,
            message: 'Internal server error while processing evaluation result'
        });
    }
}

module.exports = {
    createSubmission,
    getSubmission,
    getUserSubmissions,
    handleEvaluationResult
};