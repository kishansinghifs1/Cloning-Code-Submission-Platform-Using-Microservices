const { fetchProblemDetails } = require('../apis/problemAdminApi');
const codeCreator = require('../utils/codeCreator');

//for error handling
const SubmissionCreationError = require('../errors/submissionCreationError');

//for pushing the submission to the queue
const SubmissionProducer = require('../producers/submissionQueueProducer');

class SubmissionService {
    constructor(submissionRepository) {
        this.submissionRepository = submissionRepository;
    }

    async pingCheck() {
        return 'pong'
    }

    async addSubmission(submissionPayload) {
        // Hit the problem admin service and fetch the problem details
        const problemId = submissionPayload.problemId;
        const userId = submissionPayload.userId;

        const problemAdminApiResponse = await fetchProblemDetails(problemId);

        if(!problemAdminApiResponse) {
            throw new SubmissionCreationError('Failed to fetch problem details');
        }

        // Find the code stub matching the user's language
        const languageCodeStub = problemAdminApiResponse.data.codeStubs.find(
            codeStub => codeStub.language.toLowerCase() === submissionPayload.language.toLowerCase()
        );

        if(!languageCodeStub) {
            throw new SubmissionCreationError(`No code stub found for language: ${submissionPayload.language}`);
        }

        console.log('Code stub found:', languageCodeStub);

        // Create complete code by combining start snippet, user code, and end snippet
        const completeCode = codeCreator(
            languageCodeStub.startSnippet,
            submissionPayload.code,
            languageCodeStub.endSnippet
        );

        // Update the submission payload with complete code
        submissionPayload.code = completeCode;

        const submission = await this.submissionRepository.createSubmission(submissionPayload);
        if(!submission) {
            throw new SubmissionCreationError('Failed to create a submission in the repository');
        }
        console.log('Submission created:', submission);

        // Push to queue with all test cases and complete code
        const response = await SubmissionProducer({
            [submission._id]: {
                code: submission.code,
                language: submission.language,
                testCases: problemAdminApiResponse.data.testCases,
                userId,
                submissionId: submission._id,
                problemId: problemId
            }
        });

        return {queueResponse: response, submission};
    }
}

module.exports = SubmissionService