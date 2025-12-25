// Problem related types matching backend schema

export interface TestCase {
    input: string;
    output: string;
}

export interface CodeStub {
    language: string;
    startSnippet: string;
    userSnippet: string;
    endSnippet: string;
}

export interface ProblemData {
    _id: string;
    title: string;
    description: string;
    difficulty: 'easy' | 'medium' | 'hard';
    testCases: TestCase[];
    codeStubs: CodeStub[];
    editorial?: string;
    createdAt?: string;
    updatedAt?: string;
    // Legacy fields for backward compatibility
    url?: string;
}