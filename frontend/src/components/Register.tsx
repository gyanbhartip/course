/**
 * Register Component
 * Handles user registration with extended fields and password confirmation
 */

import { Input } from '@/components/ui/input';
import { Eye, EyeOff, Lock, Mail, User, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';

const Register = () => {
    const { register, isLoading } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [profilePicture, setProfilePicture] = useState<File | null>(null);

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

    // Check if password is too long for bcrypt (72 bytes limit)
    const isPasswordTooLong = (password: string): boolean => {
        return new TextEncoder().encode(password).length > 72;
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
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (
            !formData.name ||
            !formData.email ||
            !formData.password ||
            !formData.confirmPassword
        ) {
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

        if (isPasswordTooLong(formData.password)) {
            setError(
                'Password is too long. Please use a password with 72 characters or less.',
            );
            return;
        }

        const success = await register(
            formData.name,
            formData.email,
            formData.password,
        );
        if (!success) {
            setError('Registration failed. Email may already be in use.');
        }
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-md w-full space-y-8 p-8">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-indigo-600 rounded-full flex items-center justify-center">
                        <UserPlus className="h-6 w-6 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Create your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Join our learning platform and start your journey
                    </p>
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

                        {/* Email Input */}
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email Address
                            </label>
                            <div className="mt-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-gray-400" />
                                </div>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={formData.email}
                                    onChange={e =>
                                        handleInputChange(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    placeholder="Enter your email"
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
                                    {/* Password Length Warning */}
                                    {isPasswordTooLong(formData.password) && (
                                        <div className="mt-1 text-xs text-red-600">
                                            Password is too long (max 72
                                            characters)
                                        </div>
                                    )}
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

                        {/* Profile Picture Upload (Optional) */}
                        <div>
                            <label
                                htmlFor="profilePicture"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Profile Picture (Optional)
                            </label>
                            <div className="mt-1 flex items-center space-x-4">
                                <div className="flex-1">
                                    <input
                                        id="profilePicture"
                                        name="profilePicture"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                                    />
                                </div>
                                {profilePicture && (
                                    <div className="flex-shrink-0">
                                        <img
                                            src={URL.createObjectURL(
                                                profilePicture,
                                            )}
                                            alt="Profile preview"
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    </div>
                                )}
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
                                'Create Account'
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

                    {/* Profile Completion Note */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Note:</strong> You can complete your profile
                            later with additional preferences and settings.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Register;
