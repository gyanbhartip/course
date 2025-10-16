/**
 * UserManagement Component
 * Admin interface for managing users
 */

import { Plus, Search, UserCheck, UserX } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import {
    useActivateUser,
    useCreateUser,
    useDeactivateUser,
    useUpdateUserRole,
    useUsers,
} from '../hooks/useUsers';
import type { User, UserRole } from '../types';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';
import { Button } from './ui/button';
import { Input } from './ui/input';

type CreateUserFormData = {
    name: string;
    email: string;
    password: string;
    role: UserRole;
};

const UserManagement = () => {
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | undefined>();
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [createFormData, setCreateFormData] = useState<CreateUserFormData>({
        name: '',
        email: '',
        password: '',
        role: 'user',
    });

    // Fetch users
    const {
        data: usersData,
        isLoading: usersLoading,
        error: usersError,
    } = useUsers(page, pageSize, search || undefined, roleFilter);

    // Mutations
    const createUserMutation = useCreateUser();
    const updateRoleMutation = useUpdateUserRole();
    const deactivateUserMutation = useDeactivateUser();
    const activateUserMutation = useActivateUser();

    // Handle create user
    const handleCreateUser = async (e: FormEvent) => {
        e.preventDefault();
        try {
            await createUserMutation.mutateAsync(createFormData);
            setShowCreateForm(false);
            setCreateFormData({
                name: '',
                email: '',
                password: '',
                role: 'user',
            });
        } catch (error) {
            console.error('Failed to create user:', error);
        }
    };

    // Handle role update
    const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
        try {
            await updateRoleMutation.mutateAsync({ userId, role: newRole });
        } catch (error) {
            console.error('Failed to update user role:', error);
        }
    };

    // Handle user deactivation
    const handleDeactivateUser = async (userId: string) => {
        try {
            await deactivateUserMutation.mutateAsync(userId);
        } catch (error) {
            console.error('Failed to deactivate user:', error);
        }
    };

    // Handle user activation
    const handleActivateUser = async (userId: string) => {
        try {
            await activateUserMutation.mutateAsync(userId);
        } catch (error) {
            console.error('Failed to activate user:', error);
        }
    };

    if (usersLoading) {
        return <LoadingSpinner />;
    }

    if (usersError) {
        return <ErrorMessage message="Failed to load users" />;
    }

    const users = usersData?.users || [];
    const total = usersData?.total || 0;
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        User Management
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Manage users, roles, and permissions
                    </p>
                </div>
                <Button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Create User
                </Button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search users..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </div>
                <div className="flex gap-2">
                    <select
                        value={roleFilter || ''}
                        onChange={e =>
                            setRoleFilter(
                                (e.target.value as UserRole) || undefined,
                            )
                        }
                        className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                        <option value="">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            {/* Create User Form */}
            {showCreateForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                        Create New User
                    </h3>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Name
                                </label>
                                <Input
                                    value={createFormData.name}
                                    onChange={e =>
                                        setCreateFormData(prev => ({
                                            ...prev,
                                            name: e.target.value,
                                        }))
                                    }
                                    placeholder="Full name"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Email
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
                                    placeholder="Email address"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Password
                                </label>
                                <Input
                                    type="password"
                                    value={createFormData.password}
                                    onChange={e =>
                                        setCreateFormData(prev => ({
                                            ...prev,
                                            password: e.target.value,
                                        }))
                                    }
                                    placeholder="Password"
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
                                disabled={createUserMutation.isPending}
                                className="bg-indigo-600 hover:bg-indigo-700">
                                {createUserMutation.isPending
                                    ? 'Creating...'
                                    : 'Create User'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Created
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map((user: User) => (
                                <tr
                                    key={user.id}
                                    className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10">
                                                <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center">
                                                    <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">
                                                        {user.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {user.name}
                                                </div>
                                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                                    {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <select
                                                value={user.role}
                                                onChange={e =>
                                                    handleRoleUpdate(
                                                        user.id,
                                                        e.target
                                                            .value as UserRole,
                                                    )
                                                }
                                                disabled={
                                                    updateRoleMutation.isPending
                                                }
                                                className="text-sm border-0 bg-transparent text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 rounded">
                                                <option value="user">
                                                    User
                                                </option>
                                                <option value="admin">
                                                    Admin
                                                </option>
                                            </select>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                                user.is_active
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                            }`}>
                                            {user.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(
                                            user.created_at,
                                        ).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            {user.is_active ? (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleDeactivateUser(
                                                            user.id,
                                                        )
                                                    }
                                                    disabled={
                                                        deactivateUserMutation.isPending
                                                    }
                                                    className="text-red-600 hover:text-red-700">
                                                    <UserX className="h-4 w-4 mr-1" />
                                                    Deactivate
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() =>
                                                        handleActivateUser(
                                                            user.id,
                                                        )
                                                    }
                                                    disabled={
                                                        activateUserMutation.isPending
                                                    }
                                                    className="text-green-600 hover:text-green-700">
                                                    <UserCheck className="h-4 w-4 mr-1" />
                                                    Activate
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
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
        </div>
    );
};

export default UserManagement;
