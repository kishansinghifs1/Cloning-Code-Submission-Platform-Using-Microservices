// Axios configuration with interceptors for authentication and error handling

import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearTokens, isTokenExpired } from '../utils/tokenManager';

// Get API base URLs from environment variables
const USER_SERVICE_URL = import.meta.env.VITE_USER_SERVICE_URL || 'http://localhost:8001';
const PROBLEM_SERVICE_URL = import.meta.env.VITE_PROBLEM_SERVICE_URL || 'http://localhost:3000';
const SUBMISSION_SERVICE_URL = import.meta.env.VITE_SUBMISSION_SERVICE_URL || 'http://localhost:5000';

// Create axios instances for each service
export const userServiceApi: AxiosInstance = axios.create({
    baseURL: `${USER_SERVICE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const problemServiceApi: AxiosInstance = axios.create({
    baseURL: `${PROBLEM_SERVICE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

export const submissionServiceApi: AxiosInstance = axios.create({
    baseURL: `${SUBMISSION_SERVICE_URL}/api/v1`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });

    failedQueue = [];
};

// Request interceptor to add auth token
const requestInterceptor = async (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();

    if (token && config.headers) {
        // Check if token is expired or about to expire
        if (isTokenExpired(token)) {
            const refreshToken = getRefreshToken();

            if (refreshToken && !isRefreshing) {
                isRefreshing = true;

                try {
                    // Refresh the token
                    const response = await userServiceApi.post('/auth/refresh', {
                        refresh_token: refreshToken,
                    });

                    const newAccessToken = response.data.access_token;
                    setTokens(newAccessToken, refreshToken);
                    config.headers.Authorization = `Bearer ${newAccessToken}`;

                    processQueue(null, newAccessToken);
                    isRefreshing = false;
                } catch (error) {
                    processQueue(error, null);
                    clearTokens();
                    window.location.href = '/';
                    isRefreshing = false;
                    return Promise.reject(error);
                }
            } else if (isRefreshing) {
                // If already refreshing, wait for it to complete
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((token) => {
                        config.headers!.Authorization = `Bearer ${token}`;
                        return config;
                    })
                    .catch((err) => {
                        return Promise.reject(err);
                    });
            }
        } else {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }

    return config;
};

// Response interceptor for error handling
const responseInterceptor = (response: AxiosResponse) => {
    return response;
};

// Error interceptor
const errorInterceptor = async (error: AxiosError) => {
    const originalRequest: any = error.config;

    // If 401 and not already retried, try refreshing token
    if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
            return new Promise((resolve, reject) => {
                failedQueue.push({ resolve, reject });
            })
                .then((token) => {
                    originalRequest.headers.Authorization = `Bearer ${token}`;
                    return axios(originalRequest);
                })
                .catch((err) => {
                    return Promise.reject(err);
                });
        }

        originalRequest._retry = true;
        const refreshToken = getRefreshToken();

        if (refreshToken) {
            isRefreshing = true;

            try {
                const response = await userServiceApi.post('/auth/refresh', {
                    refresh_token: refreshToken,
                });

                const newAccessToken = response.data.access_token;
                setTokens(newAccessToken, refreshToken);

                processQueue(null, newAccessToken);

                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
                isRefreshing = false;

                return axios(originalRequest);
            } catch (err) {
                processQueue(err, null);
                clearTokens();
                window.location.href = '/';
                isRefreshing = false;
                return Promise.reject(err);
            }
        }
    }

    return Promise.reject(error);
};

// Add interceptors to all API instances
[userServiceApi, problemServiceApi, submissionServiceApi].forEach((api) => {
    api.interceptors.request.use(requestInterceptor, (error) => Promise.reject(error));
    api.interceptors.response.use(responseInterceptor, errorInterceptor);
});
