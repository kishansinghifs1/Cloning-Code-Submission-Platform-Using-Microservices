// User and Authentication related types

export interface User {
    _id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    isAdmin: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RegisterData {
    email: string;
    password: string;
    username: string;
    firstName?: string;
    lastName?: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

export interface AuthContextType {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: RegisterData) => Promise<void>;
    logout: () => void;
    refreshUserData: () => Promise<void>;
}

export interface PasswordChangeData {
    old_password: string;
    new_password: string;
}

export interface UserUpdateData {
    username?: string;
    firstName?: string;
    lastName?: string;
}
