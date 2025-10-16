/**
 * Invitation management hooks
 * React Query hooks for invitation management operations
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getAllInvitations,
    getInvitationById,
    getInvitationByToken,
    createInvitation,
    revokeInvitation,
    registerWithInvitation,
} from '../services/invitation.service';
import type { InvitationCreate, InvitationRegister, UserRole } from '../types';

/**
 * Hook to get all invitations with pagination and filtering
 */
export const useInvitations = (
    page: number = 1,
    pageSize: number = 20,
    search?: string,
) => {
    return useQuery({
        queryKey: ['invitations', page, pageSize, search],
        queryFn: () => getAllInvitations(page, pageSize, search),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to get invitation by ID
 */
export const useInvitation = (invitationId: string) => {
    return useQuery({
        queryKey: ['invitation', invitationId],
        queryFn: () => getInvitationById(invitationId),
        enabled: !!invitationId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to get invitation by token (public)
 */
export const useInvitationByToken = (token: string) => {
    return useQuery({
        queryKey: ['invitation-token', token],
        queryFn: () => getInvitationByToken(token),
        enabled: !!token,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to create a new invitation
 */
export const useCreateInvitation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createInvitation,
        onSuccess: () => {
            // Invalidate and refetch invitations list
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
        },
    });
};

/**
 * Hook to revoke invitation
 */
export const useRevokeInvitation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: revokeInvitation,
        onSuccess: (_, invitationId) => {
            // Invalidate and refetch invitations list and specific invitation
            queryClient.invalidateQueries({ queryKey: ['invitations'] });
            queryClient.invalidateQueries({
                queryKey: ['invitation', invitationId],
            });
        },
    });
};

/**
 * Hook to register with invitation
 */
export const useRegisterWithInvitation = () => {
    return useMutation({
        mutationFn: ({
            token,
            registrationData,
        }: {
            token: string;
            registrationData: InvitationRegister;
        }) => registerWithInvitation(token, registrationData),
    });
};
