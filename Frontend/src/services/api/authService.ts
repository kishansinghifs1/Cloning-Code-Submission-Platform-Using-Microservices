// Authentication API service

import { userServiceApi } from './axiosConfig';
import { RegisterData, LoginData, TokenResponse, PasswordChangeData } from '../../types/user.types';

/**
 * Register a new user
 */
export async function register(userData: RegisterData): Promise<TokenResponse> {
    const response = await userServiceApi.post<TokenResponse>('/auth/register', userData);
    return response.data;
}

/**
 * Login user with email and password
 */
export async function login(loginData: LoginData): Promise<TokenResponse> {
    const response = await userServiceApi.post<TokenResponse>('/auth/login', loginData);
    return response.data;
}

/**
 * Logout user (client-side token cleanup)
 */
export async function logout(): Promise<void> {
    await userServiceApi.post('/auth/logout');
}

/**
 * Refresh access token using refresh token
 */
export async function refreshToken(refresh_token: string): Promise<{ access_token: string }> {
    const response = await userServiceApi.post('/auth/refresh', { refresh_token });
    return response.data;
}

/**
 * Change user password
 */
export async function changePassword(passwordData: PasswordChangeData): Promise<{ success: boolean; message: string }> {
    const response = await userServiceApi.post('/auth/change-password', passwordData);
    return response.data;
}
