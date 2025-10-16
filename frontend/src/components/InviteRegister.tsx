/**
 * InviteRegister Component
 * Registration form for invitation-based signup
 */

import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { useInvitationByToken } from '../hooks/useInvitations';
import LoadingSpinner from './LoadingSpinner';

const InviteRegister = () => {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const { isAuthenticated, registerWithInvitation, isLoading } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');

    // Fetch invitation details
    const {
        data: invitation,
        isLoading: invitationLoading,
        error: invitationError,
    } = useInvitationByToken(token || '');

    // Redirect if already authenticated
    useEffect(() => {
        if (isAuthenticated) {
            navigate('/dashboard');
        }
    }, [isAuthenticated, navigate]);

    // Password strength calculation
    const calculatePasswordStrength = (password: string): number => {
        let strength = 0;
        if (password.length >= 8) strength += 1;
        if (/[a-z]/.test(password)) strength += 1;
        if (/[A-Z]/.test(password)) strength += 1;
        if (/[0-9]/.test(password)) strength += 1;
        if (/[^A-Za-z0-9]/.test(password)) strength += 1;
        return strength;
    };

    const passwordStrength = calculatePasswordStrength(formData.password);
    const getStrengthColor = (strength: number): string => {
        if (strength <= 2) return 'bg-red-500';
        if (strength <= 3) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getStrengthText = (strength: number): string => {
        if (strength <= 2) return 'Weak';
        if (strength <= 3) return 'Medium';
        return 'Strong';
    };

    // Handle form submission
    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!formData.name || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (passwordStrength < 3) {
            setError('Password is too weak. Please use a stronger password.');
            return;
        }

        if (!token) {
            setError('Invalid invitation link');
            return;
        }

        const success = await registerWithInvitation(
            token,
            formData.name,
            formData.password,
        );
        if (success) {
            // Registration successful, redirect to dashboard
            navigate('/dashboard');
        } else {
            setError('Registration failed. Please try again.');
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    // Show loading state
    if (invitationLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading invitation..." />
            </div>
        );
    }

    // Show error state
    if (invitationError || !invitation) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
                <div className="max-w-md w-full space-y-8 p-8 text-center">
                    <div className="mx-auto h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
                        <Mail className="h-8 w-8 text-red-600" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                            Invalid Invitation
                        </h2>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            This invitation link is invalid or has expired.
                        </p>
                    </div>
                    <div className="space-y-4">
                        <Link
                            to="/login"
                            className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            Go to Login
                        </Link>
                        <Link
                            to="/register"
                            className="block w-full text-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                            Create Account
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Complete Your Registration
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        You've been invited to join our platform
                    </p>
                </div>

                {/* Invitation Details */}
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md">
                    <div className="flex items-center">
                        <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mr-2" />
                        <div>
                            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                                Invitation for: {invitation.email}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-300">
                                Role: {invitation.role}
                            </p>
                        </div>
                    </div>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        {/* Name Input */}
                        <div>
                            <label
                                htmlFor="name"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Full Name
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="name"
                                    name="name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={formData.name}
                                    onChange={e =>
                                        handleInputChange(
                                            'name',
                                            e.target.value,
                                        )
                                    }
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Enter your full name"
                                />
                            </div>
                        </div>

                        {/* Password Input */}
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Password
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? 'text' : 'password'}
                                    autoComplete="new-password"
                                    required
                                    value={formData.password}
                                    onChange={e =>
                                        handleInputChange(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Create a password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() =>
                                        setShowPassword(!showPassword)
                                    }>
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>

                            {/* Password Strength Indicator */}
                            {formData.password && (
                                <div className="mt-2">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all duration-300 ${getStrengthColor(
                                                    passwordStrength,
                                                )}`}
                                                style={{
                                                    width: `${
                                                        (passwordStrength / 5) *
                                                        100
                                                    }%`,
                                                }}
                                            />
                                        </div>
                                        <span
                                            className={`text-xs font-medium ${
                                                passwordStrength <= 2
                                                    ? 'text-red-600'
                                                    : passwordStrength <= 3
                                                    ? 'text-yellow-600'
                                                    : 'text-green-600'
                                            }`}>
                                            {getStrengthText(passwordStrength)}
                                        </span>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Password Input */}
                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Confirm Password
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type={
                                        showConfirmPassword
                                            ? 'text'
                                            : 'password'
                                    }
                                    autoComplete="new-password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={e =>
                                        handleInputChange(
                                            'confirmPassword',
                                            e.target.value,
                                        )
                                    }
                                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Confirm your password"
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    onClick={() =>
                                        setShowConfirmPassword(
                                            !showConfirmPassword,
                                        )
                                    }>
                                    {showConfirmPassword ? (
                                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    ) : (
                                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Submit Button */}
                    <div>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full text-white bg-indigo-600 hover:bg-indigo-700">
                            {isLoading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Creating account...
                                </div>
                            ) : (
                                'Complete Registration'
                            )}
                        </Button>
                    </div>

                    {/* Login Link */}
                    <div className="text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Already have an account?{' '}
                            <Link
                                to="/login"
                                className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default InviteRegister;
