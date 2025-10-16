/**
 * User management hooks
 * React Query hooks for user management operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllUsers,
    getUserById,
    createUser,
    updateUserRole,
    deactivateUser,
    activateUser,
} from '../services/user.service';
import type { UserCreateByAdmin, UserRole } from '../types';

/**
 * Hook to get all users with pagination and filtering
 */
export const useUsers = (
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    role?: UserRole,
) => {
    return useQuery({
        queryKey: ['users', page, pageSize, search, role],
        queryFn: () => getAllUsers(page, pageSize, search, role),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to get user by ID
 */
export const useUser = (userId: string) => {
    return useQuery({
        queryKey: ['user', userId],
        queryFn: () => getUserById(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to create a new user
 */
export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createUser,
        onSuccess: () => {
            // Invalidate and refetch users list
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });
};

/**
 * Hook to update user role
 */
export const useUpdateUserRole = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
            updateUserRole(userId, role),
        onSuccess: (_, { userId }) => {
            // Invalidate and refetch users list and specific user
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
        },
    });
};

/**
 * Hook to deactivate user
 */
export const useDeactivateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deactivateUser,
        onSuccess: (_, userId) => {
            // Invalidate and refetch users list and specific user
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
        },
    });
};

/**
 * Hook to activate user
 */
export const useActivateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: activateUser,
        onSuccess: (_, userId) => {
            // Invalidate and refetch users list and specific user
            queryClient.invalidateQueries({ queryKey: ['users'] });
            queryClient.invalidateQueries({ queryKey: ['user', userId] });
        },
    });
};
