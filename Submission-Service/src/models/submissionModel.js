const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: [true, "User id for the submission is missing"],
        index: true // For querying user submissions efficiently
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
    
    // Evaluation Results
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
    
    // Metadata
    submittedAt: {
        type: Date,
        default: Date.now
    },
    completedAt: Date,
    executionTime: Number // milliseconds
}, { timestamps: true });

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;