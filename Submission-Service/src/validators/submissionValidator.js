const joi = require('joi');

const submissionValidationSchema = joi.object({
    userId: joi
        .string()
        .required()
        .trim()
        .messages({
            'any.required': 'User ID is required',
            'string.empty': 'User ID cannot be empty'
        }),
    
    problemId: joi
        .string()
        .required()
        .trim()
        .messages({
            'any.required': 'Problem ID is required',
            'string.empty': 'Problem ID cannot be empty'
        }),
    
    language: joi
        .string()
        .required()
        .valid('cpp', 'java', 'python')
        .lowercase()
        .messages({
            'any.required': 'Programming language is required',
            'any.only': 'Language must be one of: cpp, java, python'
        }),
    
    code: joi
        .string()
        .required()
        .max(102400)
        .messages({
            'any.required': 'Code is required',
            'string.max': 'Code size exceeds maximum limit of 100KB'
        })
});

const getSubmissionSchema = joi.object({
    submissionId: joi
        .string()
        .required()
        .trim()
        .messages({
            'any.required': 'Submission ID is required'
        })
});

const getUserSubmissionsSchema = joi.object({
    userId: joi
        .string()
        .required()
        .trim()
        .messages({
            'any.required': 'User ID is required'
        }),
    limit: joi
        .number()
        .integer()
        .min(1)
        .max(100)
        .default(20)
        .messages({
            'number.max': 'Limit cannot exceed 100'
        }),
    offset: joi
        .number()
        .integer()
        .min(0)
        .default(0)
});

const evaluationResultSchema = joi.object({
    submissionId: joi
        .string()
        .required()
        .messages({
            'any.required': 'Submission ID is required'
        }),
    userId: joi
        .string()
        .required(),
    totalTestCases: joi
        .number()
        .required()
        .min(0),
    passedTestCases: joi
        .number()
        .required()
        .min(0),
    failedTestCases: joi
        .number()
        .required()
        .min(0),
    overallStatus: joi
        .string()
        .required()
        .valid('SUCCESS', 'PARTIAL', 'FAILED'),
    testResults: joi
        .array()
        .required()
        .min(0),
    executionTime: joi
        .number()
        .required()
        .min(0)
}).unknown(true); // Allow extra fields from Evaluator Service

module.exports = {
    submissionValidationSchema,
    getSubmissionSchema,
    getUserSubmissionsSchema,
    evaluationResultSchema
};
