// Submission API service

import { submissionServiceApi } from './axiosConfig';
import {
    Submission,
    CreateSubmissionData,
    SubmissionResponse,
    SubmissionsListResponse
} from '../../types/submission.types';

/**
 * Create a new code submission
 */
export async function createSubmission(data: CreateSubmissionData): Promise<Submission> {
    const response = await submissionServiceApi.post<SubmissionResponse>('/submissions', data);
    return response.data.data;
}

/**
 * Get submission by ID
 */
export async function getSubmission(submissionId: string): Promise<Submission> {
    const response = await submissionServiceApi.get<SubmissionResponse>(`/submissions/${submissionId}`);
    return response.data.data;
}

/**
 * Get user's submissions with pagination
 */
export async function getUserSubmissions(
    userId: string,
    limit: number = 10,
    offset: number = 0
): Promise<{ data: Submission[]; total: number }> {
    const response = await submissionServiceApi.get<SubmissionsListResponse>('/submissions', {
        params: { userId, limit, offset }
    });

    return {
        data: response.data.data,
        total: response.data.total
    };
}
