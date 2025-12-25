// Problem API service

import { problemServiceApi } from './axiosConfig';
import { ProblemData } from '../../types/problem.types';

interface ProblemResponse {
    success: boolean;
    message: string;
    data: ProblemData;
    error?: any;
}

interface ProblemsListResponse {
    success: boolean;
    message: string;
    data: ProblemData[];
    error?: any;
}

/**
 * Get all problems
 */
export async function getAllProblems(): Promise<ProblemData[]> {
    const response = await problemServiceApi.get<ProblemsListResponse>('/problems');
    return response.data.data;
}

/**
 * Get single problem by ID
 */
export async function getProblem(problemId: string): Promise<ProblemData> {
    const response = await problemServiceApi.get<ProblemResponse>(`/problems/${problemId}`);
    return response.data.data;
}

/**
 * Create new problem (Admin only)
 */
export async function createProblem(problemData: Partial<ProblemData>): Promise<ProblemData> {
    const response = await problemServiceApi.post<ProblemResponse>('/problems', problemData);
    return response.data.data;
}

/**
 * Update problem (Admin only)
 */
export async function updateProblem(problemId: string, problemData: Partial<ProblemData>): Promise<ProblemData> {
    const response = await problemServiceApi.put<ProblemResponse>(`/problems/${problemId}`, problemData);
    return response.data.data;
}

/**
 * Delete problem (Admin only)
 */
export async function deleteProblem(problemId: string): Promise<void> {
    await problemServiceApi.delete(`/problems/${problemId}`);
}
