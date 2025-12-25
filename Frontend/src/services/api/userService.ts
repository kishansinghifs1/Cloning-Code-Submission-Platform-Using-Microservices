// User API service

import { userServiceApi } from './axiosConfig';
import { User, UserUpdateData } from '../../types/user.types';

/**
 * Get current authenticated user's profile
 */
export async function getCurrentUser(): Promise<User> {
    const response = await userServiceApi.get<User>('/users/me');
    return response.data;
}

/**
 * Update current user's profile
 */
export async function updateProfile(updateData: UserUpdateData): Promise<User> {
    const response = await userServiceApi.put<User>('/users/me', updateData);
    return response.data;
}

/**
 * Get all users (Admin only)
 */
export async function getAllUsers(skip: number = 0, limit: number = 10): Promise<User[]> {
    const response = await userServiceApi.get<User[]>('/users', {
        params: { skip, limit }
    });
    return response.data;
}

/**
 * Get user by ID (Admin only)
 */
export async function getUserById(userId: string): Promise<User> {
    const response = await userServiceApi.get<User>(`/users/${userId}`);
    return response.data;
}
