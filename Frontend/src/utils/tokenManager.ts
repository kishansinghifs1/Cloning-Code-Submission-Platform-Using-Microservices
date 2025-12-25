// Token management utilities for JWT authentication

const TOKEN_KEYS = {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_DATA: 'user_data'
} as const;

/**
 * Decode JWT token without verification (for extracting payload)
 */
function decodeToken(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch (error) {
        console.error('Failed to decode token:', error);
        return null;
    }
}

/**
 * Check if a JWT token is expired
 */
export function isTokenExpired(token: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) {
        return true;
    }

    // Check if token expires in next 5 minutes
    const expirationTime = decoded.exp * 1000;
    const currentTime = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    return expirationTime - currentTime < bufferTime;
}

/**
 * Get access token from localStorage
 */
export function getAccessToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.ACCESS_TOKEN);
}

/**
 * Get refresh token from localStorage
 */
export function getRefreshToken(): string | null {
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
}

/**
 * Get stored user data
 */
export function getUserData(): any {
    const data = localStorage.getItem(TOKEN_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
}

/**
 * Store tokens in localStorage
 */
export function setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
    localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
}

/**
 * Store user data in localStorage
 */
export function setUserData(userData: any): void {
    localStorage.setItem(TOKEN_KEYS.USER_DATA, JSON.stringify(userData));
}

/**
 * Clear all tokens and user data from localStorage
 */
export function clearTokens(): void {
    localStorage.removeItem(TOKEN_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.REFRESH_TOKEN);
    localStorage.removeItem(TOKEN_KEYS.USER_DATA);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
    const token = getAccessToken();
    return token !== null && !isTokenExpired(token);
}
