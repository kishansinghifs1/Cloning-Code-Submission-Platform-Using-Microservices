// Authentication Context Provider

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, RegisterData } from '../types/user.types';
import * as authService from '../services/api/authService';
import * as userService from '../services/api/userService';
import { setTokens, clearTokens, getUserData, setUserData, isAuthenticated as checkAuth } from '../utils/tokenManager';
import { parseApiError } from '../utils/errorHandler';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize auth state from localStorage
    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const authenticated = checkAuth();

                if (authenticated) {
                    // Try to get user data from localStorage first
                    const cachedUser = getUserData();

                    if (cachedUser) {
                        setUser(cachedUser);
                        setIsAuthenticated(true);
                    } else {
                        // Fetch fresh user data if not in cache
                        await refreshUserData();
                    }
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                clearTokens();
            } finally {
                setIsLoading(false);
            }
        };

        initializeAuth();
    }, []);

    const refreshUserData = async () => {
        try {
            const userData = await userService.getCurrentUser();
            setUser(userData);
            setUserData(userData);
            setIsAuthenticated(true);
        } catch (error) {
            console.error('Failed to fetch user data:', error);
            clearTokens();
            setUser(null);
            setIsAuthenticated(false);
            throw error;
        }
    };

    const login = async (email: string, password: string) => {
        try {
            const tokenResponse = await authService.login({ email, password });

            // Store tokens
            setTokens(tokenResponse.access_token, tokenResponse.refresh_token);

            // Fetch and store user data
            await refreshUserData();
        } catch (error) {
            const apiError = parseApiError(error);
            throw new Error(apiError.message);
        }
    };

    const register = async (data: RegisterData) => {
        try {
            const tokenResponse = await authService.register(data);

            // Store tokens
            setTokens(tokenResponse.access_token, tokenResponse.refresh_token);

            // Fetch and store user data
            await refreshUserData();
        } catch (error) {
            const apiError = parseApiError(error);
            throw new Error(apiError.message);
        }
    };

    const logout = () => {
        try {
            authService.logout().catch(() => {
                // Ignore errors on logout API call
            });
        } finally {
            clearTokens();
            setUser(null);
            setIsAuthenticated(false);
        }
    };

    const value: AuthContextType = {
        user,
        isAuthenticated,
        isLoading,
        login,
        register,
        logout,
        refreshUserData,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
