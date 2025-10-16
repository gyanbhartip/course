/**
 * InvitationManagement Component
 * Admin interface for managing invitations
 */

import {
    Check,
    Clock,
    Copy,
    Mail,
    Plus,
    Search,
    Trash2,
    UserCheck,
} from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
    useCreateInvitation,
    useInvitations,
    useRevokeInvitation,
} from '../hooks/useInvitations';
import type { Invitation, UserRole } from '../types';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface CreateInvitationFormData {
    email: string;
    role: UserRole;
}

const InvitationManagement = () => {
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState('');
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createFormData, setCreateFormData] =
        useState<CreateInvitationFormData>({
            email: '',
            role: 'user',
        });
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    // Fetch invitations
    const {
        data: invitationsData,
        isLoading: invitationsLoading,
        error: invitationsError,
    } = useInvitations(page, pageSize, search || undefined);

    // Mutations
    const createInvitationMutation = useCreateInvitation();
    const revokeInvitationMutation = useRevokeInvitation();

    // Handle create invitation
    const handleCreateInvitation = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await createInvitationMutation.mutateAsync(createFormData);
            setShowCreateForm(false);
            setCreateFormData({
                email: '',
                role: 'user',
            });
        } catch (error) {
            console.error('Failed to create invitation:', error);
        }
    };

    // Handle revoke invitation
    const handleRevokeInvitation = async (invitationId: string) => {
        try {
            await revokeInvitationMutation.mutateAsync(invitationId);
        } catch (error) {
            console.error('Failed to revoke invitation:', error);
        }
    };

    // Handle copy token
    const handleCopyToken = async (token: string) => {
        try {
            await navigator.clipboard.writeText(token);
            setCopiedToken(token);
            setTimeout(() => setCopiedToken(null), 2000);
        } catch (error) {
            console.error('Failed to copy token:', error);
        }
    };

    // Get invitation status
    const getInvitationStatus = (invitation: Invitation) => {
        const now = new Date();
        const expiresAt = new Date(invitation.expires_at);
        const usedAt = invitation.used_at ? new Date(invitation.used_at) : null;

        if (usedAt) {
            return {
                status: 'used',
                color: 'bg-gray-100 text-gray-800',
                icon: UserCheck,
            };
        }
        if (now > expiresAt) {
            return {
                status: 'expired',
                color: 'bg-red-100 text-red-800',
                icon: Clock,
            };
        }
        return {
            status: 'pending',
            color: 'bg-yellow-100 text-yellow-800',
            icon: Mail,
        };
    };

    if (invitationsLoading) {
        return <LoadingSpinner />;
    }

    if (invitationsError) {
        return <ErrorMessage message="Failed to load invitations" />;
    }

    const invitations = invitationsData?.invitations || [];
    const total = invitationsData?.total || 0;
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        Invitation Management
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Send invitations to new users and manage pending
                        invitations
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Send Invitation
                </Button>
            </div>

            {/* Search */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search invitations..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
            </div>

            {/* Create Invitation Form */}
            {showCreateForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Send New Invitation
                    </h3>
                    <form
                        onSubmit={handleCreateInvitation}
                        className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email Address
                                </label>
                                <Input
                                    type="email"
                                    value={createFormData.email}
                                    onChange={e =>
                                        setCreateFormData(prev => ({
                                            ...prev,
                                            email: e.target.value,
                                        }))
                                    }
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Role
                                </label>
                                <select
                                    value={createFormData.role}
                                    onChange={e =>
                                        setCreateFormData(prev => ({
                                            ...prev,
                                            role: e.target.value as UserRole,
                                        }))
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                                    <option value="user">User</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowCreateForm(false)}>
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={createInvitationMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700">
                                {createInvitationMutation.isPending
                                    ? 'Sending...'
                                    : 'Send Invitation'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Invitations Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Expires
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Token
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {invitations.map((invitation: Invitation) => {
                                const statusInfo =
                                    getInvitationStatus(invitation);
                                const StatusIcon = statusInfo.icon;

                                return (
                                    <tr
                                        key={invitation.id}
                                        className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                {invitation.email}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                    invitation.role === 'admin'
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                }`}>
                                                {invitation.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                                                <StatusIcon className="h-3 w-3 mr-1" />
                                                {statusInfo.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {new Date(
                                                invitation.expires_at,
                                            ).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono">
                                                    {invitation.token.substring(
                                                        0,
                                                        8,
                                                    )}
                                                    ...
                                                </code>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        handleCopyToken(
                                                            invitation.token,
                                                        )
                                                    }
                                                    className="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                                    {copiedToken ===
                                                    invitation.token ? (
                                                        <Check className="h-4 w-4 text-green-600" />
                                                    ) : (
                                                        <Copy className="h-4 w-4" />
                                                    )}
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end gap-2">
                                                {statusInfo.status ===
                                                    'pending' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            handleRevokeInvitation(
                                                                invitation.id,
                                                            )
                                                        }
                                                        disabled={
                                                            revokeInvitationMutation.isPending
                                                        }
                                                        className="text-red-600 hover:text-red-700">
                                                        <Trash2 className="h-4 w-4 mr-1" />
                                                        Revoke
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                        <div className="flex-1 flex justify-between sm:hidden">
                            <Button
                                onClick={() => setPage(page - 1)}
                                disabled={page === 1}
                                variant="outline">
                                Previous
                            </Button>
                            <Button
                                onClick={() => setPage(page + 1)}
                                disabled={page === totalPages}
                                variant="outline">
                                Next
                            </Button>
                        </div>
                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                            <div>
                                <p className="text-sm text-gray-700 dark:text-gray-300">
                                    Showing{' '}
                                    <span className="font-medium">
                                        {(page - 1) * pageSize + 1}
                                    </span>{' '}
                                    to{' '}
                                    <span className="font-medium">
                                        {Math.min(page * pageSize, total)}
                                    </span>{' '}
                                    of{' '}
                                    <span className="font-medium">{total}</span>{' '}
                                    results
                                </p>
                            </div>
                            <div>
                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                    <Button
                                        onClick={() => setPage(page - 1)}
                                        disabled={page === 1}
                                        variant="outline"
                                        size="sm">
                                        Previous
                                    </Button>
                                    <Button
                                        onClick={() => setPage(page + 1)}
                                        disabled={page === totalPages}
                                        variant="outline"
                                        size="sm">
                                        Next
                                    </Button>
                                </nav>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Empty State */}
            {invitations.length === 0 && (
                <div className="text-center py-12">
                    <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                        No invitations found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                        Get started by sending your first invitation.
                    </p>
                    <Button
                        onClick={() => setShowCreateForm(true)}
                        className="bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Send Invitation
                    </Button>
                </div>
            )}
        </div>
    );
};

export default InvitationManagement;
