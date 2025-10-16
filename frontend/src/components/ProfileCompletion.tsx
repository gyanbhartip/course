/**
 * ProfileCompletion Component
 * Optional profile completion screen for additional user preferences
 */

import { Save, User, X } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

const ProfileCompletion = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [profileData, setProfileData] = useState({
        name: user?.name || '',
        bio: '',
        interests: '',
        learningGoals: '',
    });
    const [profilePicture, setProfilePicture] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleInputChange = (field: string, value: string) => {
        setProfileData(prev => ({ ...prev, [field]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setProfilePicture(file);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Here you would typically upload the profile picture and update user data
            // For now, we'll just simulate the process
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Navigate to dashboard after completion
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to complete profile:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSkip = () => {
        navigate('/dashboard');
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-2xl w-full space-y-8 p-8">
                <div className="text-center">
                    <div className="mx-auto h-16 w-16 bg-indigo-600 rounded-full flex items-center justify-center">
                        <User className="h-8 w-8 text-white" />
                    </div>
                    <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-gray-100">
                        Complete Your Profile
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Help us personalize your learning experience
                    </p>
                </div>

                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-6">
                        {/* Profile Picture */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Profile Picture
                            </label>
                            <div className="flex items-center space-x-4">
                                <div className="flex-shrink-0">
                                    {profilePicture ? (
                                        <img
                                            src={URL.createObjectURL(
                                                profilePicture,
                                            )}
                                            alt="Profile preview"
                                            className="h-20 w-20 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                                        />
                                    ) : (
                                        <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                            <User className="h-8 w-8 text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <input
                                        id="profilePicture"
                                        name="profilePicture"
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-gray-700 dark:file:text-gray-300"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Optional: Upload a profile picture to
                                        personalize your account
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Full Name
                            </label>
                            <Input
                                value={profileData.name}
                                onChange={e =>
                                    handleInputChange('name', e.target.value)
                                }
                                placeholder="Your full name"
                                required
                            />
                        </div>

                        {/* Bio */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Bio (Optional)
                            </label>
                            <textarea
                                value={profileData.bio}
                                onChange={e =>
                                    handleInputChange('bio', e.target.value)
                                }
                                placeholder="Tell us a bit about yourself..."
                                rows={3}
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>

                        {/* Interests */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Interests (Optional)
                            </label>
                            <Input
                                value={profileData.interests}
                                onChange={e =>
                                    handleInputChange(
                                        'interests',
                                        e.target.value,
                                    )
                                }
                                placeholder="e.g., Web Development, Data Science, Design"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Comma-separated list of your interests
                            </p>
                        </div>

                        {/* Learning Goals */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Learning Goals (Optional)
                            </label>
                            <textarea
                                value={profileData.learningGoals}
                                onChange={e =>
                                    handleInputChange(
                                        'learningGoals',
                                        e.target.value,
                                    )
                                }
                                placeholder="What do you hope to achieve through this platform?"
                                rows={3}
                                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            />
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleSkip}
                            className="flex-1">
                            <X className="h-4 w-4 mr-2" />
                            Skip for Now
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700">
                            {isLoading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                                    Completing...
                                </div>
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Complete Profile
                                </>
                            )}
                        </Button>
                    </div>

                    {/* Note */}
                    <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <strong>Note:</strong> You can always update your
                            profile later in your account settings.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileCompletion;
