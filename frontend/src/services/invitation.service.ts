/**
 * Invitation service
 * Handles invitation management operations for admin users
 */

import { apiGet, apiPost, apiDelete } from './api';
import type {
    Invitation,
    InvitationCreate,
    InvitationListResponse,
    InvitationRegister,
    User,
} from '../types';

/**
 * Get all invitations with pagination and filtering
 */
export const getAllInvitations = async (
    page: number = 1,
    pageSize: number = 20,
    search?: string,
): Promise<InvitationListResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        page_size: pageSize.toString(),
    });

    if (search) params.append('search', search);

    return apiGet<InvitationListResponse>(`/invitations?${params.toString()}`);
};

/**
 * Get invitation by ID
 */
export const getInvitationById = async (
    invitationId: string,
): Promise<Invitation> => {
    return apiGet<Invitation>(`/invitations/${invitationId}`);
};

/**
 * Get invitation by token (public endpoint)
 */
export const getInvitationByToken = async (
    token: string,
): Promise<Invitation> => {
    return apiGet<Invitation>(`/invitations/token/${token}`);
};

/**
 * Create a new invitation (admin only)
 */
export const createInvitation = async (
    invitationData: InvitationCreate,
): Promise<Invitation> => {
    return apiPost<Invitation>('/invitations', invitationData);
};

/**
 * Revoke an invitation (admin only)
 */
export const revokeInvitation = async (invitationId: string): Promise<void> => {
    return apiDelete<void>(`/invitations/${invitationId}`);
};

/**
 * Register with invitation (public endpoint)
 */
export const registerWithInvitation = async (
    token: string,
    registrationData: InvitationRegister,
): Promise<User> => {
    return apiPost<User>(`/invitations/register/${token}`, registrationData);
};
