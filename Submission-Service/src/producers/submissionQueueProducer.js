const submissionQueue = require("../queues/submissionQueue");
const Logger = require('../utils/logger');

const logger = new Logger('SubmissionQueueProducer');

module.exports = async function (payload) {
    try {
        const submissionId = Object.keys(payload)[0];
        
        logger.debug('Adding submission job to queue', { submissionId });

        const job = await submissionQueue.add("SubmissionJob", payload, {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 2000
            },
            removeOnComplete: true,
            removeOnFail: false
        });

        logger.info('Successfully added submission job to queue', { submissionId, jobId: job.id });
        
        return job.id;
    } catch (error) {
        logger.error('Failed to add submission job to queue', error, { payload });
        throw error;
    }
};