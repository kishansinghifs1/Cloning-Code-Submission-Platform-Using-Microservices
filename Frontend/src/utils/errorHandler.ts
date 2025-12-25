// Centralized error handling utility

export interface ApiError {
    message: string;
    details?: string;
    statusCode?: number;
}

/**
 * Parse API error response and extract meaningful error message
 */
export function parseApiError(error: any): ApiError {
    // Axios error with response
    if (error.response) {
        const { status, data } = error.response;

        // Handle different error response structures
        if (data) {
            // FastAPI error format (User-Service)
            if (data.detail) {
                return {
                    message: typeof data.detail === 'string' ? data.detail : 'An error occurred',
                    statusCode: status,
                    details: JSON.stringify(data.detail)
                };
            }

            // Express/Fastify error format (Problem-Service, Submission-Service)
            if (data.error || data.message) {
                return {
                    message: data.message || 'An error occurred',
                    statusCode: status,
                    details: data.error
                };
            }
        }

        // Generic HTTP error
        return {
            message: `Request failed with status ${status}`,
            statusCode: status
        };
    }

    // Axios error without response (network error, etc.)
    if (error.request) {
        return {
            message: 'Network error - please check your connection',
            statusCode: 0
        };
    }

    // Other errors
    return {
        message: error.message || 'An unexpected error occurred',
        statusCode: 500
    };
}

/**
 * Display error message to user (can be extended to use toast notifications)
 */
export function displayError(error: ApiError): void {
    console.error('API Error:', error);
    // TODO: Integrate with toast notification library
    // toast.error(error.message);
}

/**
 * Get user-friendly error message based on status code
 */
export function getErrorMessage(statusCode?: number): string {
    switch (statusCode) {
        case 400:
            return 'Invalid request. Please check your input.';
        case 401:
            return 'Authentication required. Please login.';
        case 403:
            return 'You do not have permission to perform this action.';
        case 404:
            return 'Resource not found.';
        case 409:
            return 'Conflict - resource already exists.';
        case 500:
            return 'Server error. Please try again later.';
        default:
            return 'An error occurred. Please try again.';
    }
}
