/**
 * User management service
 * Handles user management operations for admin users
 */

import { apiGet, apiPost, apiPatch, apiDelete } from './api';
import type {
    User,
    UserCreateByAdmin,
    UserRoleUpdate,
    UserListResponse,
} from '../types';

/**
 * Get all users with pagination and filtering
 */
export const getAllUsers = async (
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    role?: 'user' | 'admin',
): Promise<UserListResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
    });

    if (search) params.append('search', search);
    if (role) params.append('role', role);

    return apiGet<UserListResponse>(`/users?${params.toString()}`);
};

/**
 * Get user by ID
 */
export const getUserById = async (userId: string): Promise<User> => {
    return apiGet<User>(`/users/${userId}`);
};

/**
 * Create a new user (admin only)
 */
export const createUser = async (
    userData: UserCreateByAdmin,
): Promise<User> => {
    return apiPost<User>('/users', userData);
};

/**
 * Update user role
 */
export const updateUserRole = async (
    userId: string,
    role: 'user' | 'admin',
): Promise<User> => {
    return apiPatch<User>(`/users/${userId}/role`, { role });
};

/**
 * Deactivate user
 */
export const deactivateUser = async (userId: string): Promise<User> => {
    return apiPatch<User>(`/users/${userId}/deactivate`, {});
};

/**
 * Activate user
 */
export const activateUser = async (userId: string): Promise<User> => {
    return apiPatch<User>(`/users/${userId}/activate`, {});
};
