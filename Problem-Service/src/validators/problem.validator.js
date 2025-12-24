const { z } = require('zod');

const createProblemSchema = z.object({
    title: z.string().min(3).trim(),
    description: z.string().min(1).trim(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    testCases: z.array(z.object({
        input: z.string().trim(),
        output: z.string().trim()
    })).min(1),
    codeStubs: z.array(z.object({
        language: z.string().trim().toLowerCase(),
        startSnippet: z.string().trim(),
        userSnippet: z.string().trim().optional(),
        endSnippet: z.string().trim()
    })).min(1),
    editorial: z.string().trim().optional()
});

const updateProblemSchema = z.object({
    title: z.string().min(3).trim().optional(),
    description: z.string().min(1).trim().optional(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    testCases: z.array(z.object({
        input: z.string().trim(),
        output: z.string().trim()
    })).min(1).optional(),
    codeStubs: z.array(z.object({
        language: z.string().trim().toLowerCase(),
        startSnippet: z.string().trim(),
        userSnippet: z.string().trim().optional(),
        endSnippet: z.string().trim()
    })).min(1).optional(),
    editorial: z.string().trim().optional()
});

module.exports = {
    createProblemSchema,
    updateProblemSchema
};
