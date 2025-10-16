/**
 * Authentication service
 * Handles user authentication, registration, and token management
 */

import { apiPost, apiGet } from './api';
import type { User, UserCreate, UserLogin, Token } from '../types';

/**
 * User registration
 */
export const register = async (userData: UserCreate): Promise<User> => {
    return apiPost<User>('/auth/register', userData);
};

/**
 * User login
 */
export const login = async (credentials: UserLogin): Promise<Token> => {
    return apiPost<Token>('/auth/login', credentials);
};

/**
 * Get current user information
 */
export const getCurrentUser = async (): Promise<User> => {
    return apiGet<User>('/auth/me');
};

/**
 * Refresh access token
 */
export const refreshToken = async (refreshToken: string): Promise<Token> => {
    return apiPost<Token>('/auth/refresh', { refresh_token: refreshToken });
};

/**
 * Logout user (client-side only - tokens are cleared by interceptor)
 */
export const logout = (): void => {
    // Tokens are cleared by the API interceptor
    // Additional cleanup can be done here if needed
};
