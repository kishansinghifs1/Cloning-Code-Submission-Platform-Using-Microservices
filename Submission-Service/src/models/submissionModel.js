const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, "User id for the submission is missing"],
        index: true
    },
    problemId: {
        type: String,
        required: [true, "Problem id for the submission is missing"],
        index: true
    },
    code: {
        type: String,
        required: [true, "Code for the submission is missing"],
    },
    language: {
        type: String,
        required: [true, "Language for the submission is missing"],
    },
    status: {
        type: String,
        enum: ["PENDING", "PROCESSING", "COMPLETED", "ERROR"],
        default: "PENDING"
    },

    testResults: [{
        testCaseIndex: Number,
        input: String,
        expectedOutput: String,
        actualOutput: String,
        status: {
            type: String,
            enum: ["PASS", "FAIL"],
            default: "FAIL"
        },
        error: String
    }],
    totalTestCases: {
        type: Number,
        default: 0
    },
    passedTestCases: {
        type: Number,
        default: 0
    },
    failedTestCases: {
        type: Number,
        default: 0
    },
    overallStatus: {
        type: String,
        enum: ["SUCCESS", "PARTIAL", "FAILED", null],
        default: null
    },
    executionError: String,
    submittedAt: {
        type: Date,
        default: Date.now,
        index: true
    },
    completedAt: Date,
    executionTime: Number,
    
    // Idempotency & Retry Fields
    idempotencyKey: {
        type: String,
        unique: true,
        sparse: true
    },
    webhookAttempts: {
        type: Number,
        default: 0
    },
    lastWebhookAttempt: Date,
    nextRetryAt: Date,
    webhookFailed: {
        type: Boolean,
        default: false
    },
    
    // Indexes for common queries
    __v: { type: Number, select: false }
}, { 
    timestamps: true,
    indexes: [
        { userId: 1, submittedAt: -1 },
        { problemId: 1, userId: 1 },
        { status: 1, submittedAt: -1 },
        { webhookFailed: 1, nextRetryAt: 1 }
    ]
});

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;