/**
 * AdminPanel Component
 * Admin interface for uploading and managing courses
 * Updated to use real API with file upload functionality
 */

import {
    BookOpen,
    Clock,
    FileText,
    Image,
    Plus,
    Save,
    Tag,
    Trash2,
    Upload,
    User,
    X,
    Users,
    Mail,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    useCreateCourse,
    useDeleteCourse,
    useMyCourses,
} from '../hooks/useCourses';
import { uploadThumbnail } from '../services/upload.service';
import type { CourseCreate } from '../types';
import EmptyState from './EmptyState';
import ErrorMessage from './ErrorMessage';
import LoadingSpinner from './LoadingSpinner';

interface CourseUploadData {
    title: string;
    description: string;
    instructor: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    thumbnail: File | null;
    contentFiles: File[];
}

const AdminPanel: React.FC = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<
        'courses' | 'users' | 'invitations'
    >('courses');
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [uploadData, setUploadData] = useState<CourseUploadData>({
        title: '',
        description: '',
        instructor: '',
        category: '',
        difficulty: 'beginner',
        thumbnail: null,
        contentFiles: [],
    });
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);

    // Fetch admin's courses and mutations
    const {
        data: courses,
        isLoading: coursesLoading,
        error: coursesError,
    } = useMyCourses();
    const createCourseMutation = useCreateCourse();
    const deleteCourseMutation = useDeleteCourse();

    // Check if user is admin
    if (!user || user.role !== 'admin') {
        return (
            <div className="text-center py-12">
                <h3 className="text-lg font-medium text-gray-900">
                    Access Denied
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    You need admin privileges to access this page.
                </p>
            </div>
        );
    }

    // Show loading state
    if (coursesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading admin panel..." />
            </div>
        );
    }

    // Show error state
    if (coursesError) {
        return (
            <div className="space-y-6">
                <ErrorMessage
                    title="Error loading courses"
                    message="There was a problem loading the courses. Please try again."
                />
            </div>
        );
    }

    // Handle form input changes
    const handleInputChange = (
        field: keyof CourseUploadData,
        value: string | File | File[],
    ) => {
        setUploadData(prev => ({
            ...prev,
            [field]: value,
        }));
    };

    // Handle file uploads
    const handleFileUpload = (
        type: 'thumbnail' | 'content',
        files: FileList | null,
    ) => {
        if (!files) return;

        if (type === 'thumbnail') {
            setUploadData(prev => ({
                ...prev,
                thumbnail: files[0],
            }));
        } else {
            setUploadData(prev => ({
                ...prev,
                contentFiles: Array.from(files),
            }));
        }
    };

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsUploading(true);
        setUploadProgress(0);

        try {
            let thumbnailUrl = '';

            // Upload thumbnail if provided
            if (uploadData.thumbnail) {
                setUploadProgress(20);
                const thumbnailResponse = await uploadThumbnail(
                    uploadData.thumbnail,
                    progressEvent => {
                        const progress = Math.round(
                            (progressEvent.loaded * 100) / progressEvent.total,
                        );
                        setUploadProgress(20 + progress * 0.3); // 20-50% for thumbnail
                    },
                );
                thumbnailUrl = thumbnailResponse.url;
            }

            // Note: Content files will be uploaded separately after course creation
            // This is a simplified version that only handles thumbnail upload

            setUploadProgress(90);

            // Create course data
            const courseData: CourseCreate = {
                title: uploadData.title,
                description: uploadData.description,
                instructor: uploadData.instructor,
                category: uploadData.category,
                difficulty: uploadData.difficulty,
                thumbnail_url: thumbnailUrl,
                duration: 0, // Will be calculated by backend
            };

            // Create course via API
            await createCourseMutation.mutateAsync(courseData);

            setUploadProgress(100);

            // Reset form
            setUploadData({
                title: '',
                description: '',
                instructor: '',
                category: '',
                difficulty: 'beginner',
                thumbnail: null,
                contentFiles: [],
            });
            setShowUploadForm(false);

            // Show success message
            alert('Course uploaded successfully!');
        } catch (error) {
            console.error('Failed to upload course:', error);
            alert('Failed to upload course. Please try again.');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    // Handle course deletion
    const handleDeleteCourse = async (courseId: string) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                await deleteCourseMutation.mutateAsync(courseId);
                alert('Course deleted successfully!');
            } catch (error) {
                console.error('Failed to delete course:', error);
                alert('Failed to delete course. Please try again.');
            }
        }
    };

    const getDifficultyColor = (difficulty: string) => {
        switch (difficulty) {
            case 'beginner':
                return 'bg-green-100 text-green-800';
            case 'intermediate':
                return 'bg-yellow-100 text-yellow-800';
            case 'advanced':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Admin Panel
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage courses, users, and platform content
                    </p>
                </div>
                {activeTab === 'courses' && (
                    <button
                        type="button"
                        onClick={() => setShowUploadForm(true)}
                        className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                        <Plus className="h-4 w-4 mr-2" />
                        Upload New Course
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        type="button"
                        onClick={() => setActiveTab('courses')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'courses'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}>
                        <BookOpen className="h-4 w-4 inline mr-2" />
                        Courses
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('users')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'users'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}>
                        <Users className="h-4 w-4 inline mr-2" />
                        Users
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('invitations')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'invitations'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}>
                        <Mail className="h-4 w-4 inline mr-2" />
                        Invitations
                    </button>
                </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'courses' && (
                <div className="space-y-6">
                    {/* Upload Form Modal */}
                    {showUploadForm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            Upload New Course
                                        </h2>
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowUploadForm(false)
                                            }
                                            className="text-gray-400 hover:text-gray-600">
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>

                                    <form
                                        onSubmit={handleSubmit}
                                        className="space-y-6">
                                        {/* Basic Information */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label
                                                    htmlFor="course-title"
                                                    className="block text-sm font-medium text-gray-700 mb-1">
                                                    Course Title *
                                                </label>
                                                <input
                                                    id="course-title"
                                                    type="text"
                                                    required
                                                    value={uploadData.title}
                                                    onChange={e =>
                                                        handleInputChange(
                                                            'title',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Enter course title"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="instructor"
                                                    className="block text-sm font-medium text-gray-700 mb-1">
                                                    Instructor *
                                                </label>
                                                <input
                                                    id="instructor"
                                                    type="text"
                                                    required
                                                    value={
                                                        uploadData.instructor
                                                    }
                                                    onChange={e =>
                                                        handleInputChange(
                                                            'instructor',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="Enter instructor name"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label
                                                htmlFor="description"
                                                className="block text-sm font-medium text-gray-700 mb-1">
                                                Description *
                                            </label>
                                            <textarea
                                                id="description"
                                                required
                                                rows={3}
                                                value={uploadData.description}
                                                onChange={e =>
                                                    handleInputChange(
                                                        'description',
                                                        e.target.value,
                                                    )
                                                }
                                                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Enter course description"
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <label
                                                    htmlFor="category"
                                                    className="block text-sm font-medium text-gray-700 mb-1">
                                                    Category *
                                                </label>
                                                <input
                                                    id="category"
                                                    type="text"
                                                    required
                                                    value={uploadData.category}
                                                    onChange={e =>
                                                        handleInputChange(
                                                            'category',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                    placeholder="e.g., Web Development"
                                                />
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="difficulty"
                                                    className="block text-sm font-medium text-gray-700 mb-1">
                                                    Difficulty *
                                                </label>
                                                <select
                                                    id="difficulty"
                                                    required
                                                    value={
                                                        uploadData.difficulty
                                                    }
                                                    onChange={e =>
                                                        handleInputChange(
                                                            'difficulty',
                                                            e.target.value,
                                                        )
                                                    }
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500">
                                                    <option value="beginner">
                                                        Beginner
                                                    </option>
                                                    <option value="intermediate">
                                                        Intermediate
                                                    </option>
                                                    <option value="advanced">
                                                        Advanced
                                                    </option>
                                                </select>
                                            </div>
                                        </div>

                                        {/* File Uploads */}
                                        <div className="space-y-4">
                                            <div>
                                                <label
                                                    htmlFor="thumbnail"
                                                    className="block text-sm font-medium text-gray-700 mb-1">
                                                    Course Thumbnail *
                                                </label>
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                    <Image className="mx-auto h-12 w-12 text-gray-400" />
                                                    <div className="mt-2">
                                                        <label className="cursor-pointer">
                                                            <span className="text-sm text-indigo-600 hover:text-indigo-500">
                                                                Click to upload
                                                                thumbnail
                                                            </span>
                                                            <input
                                                                id="thumbnail"
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={e =>
                                                                    handleFileUpload(
                                                                        'thumbnail',
                                                                        e.target
                                                                            .files,
                                                                    )
                                                                }
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <p className="text-xs text-gray-500">
                                                            PNG, JPG up to 10MB
                                                        </p>
                                                    </div>
                                                    {uploadData.thumbnail && (
                                                        <p className="mt-2 text-sm text-gray-600">
                                                            Selected:{' '}
                                                            {
                                                                uploadData
                                                                    .thumbnail
                                                                    .name
                                                            }
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div>
                                                <label
                                                    htmlFor="content-files"
                                                    className="block text-sm font-medium text-gray-700 mb-1">
                                                    Course Content Files *
                                                </label>
                                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                    <div className="mt-2">
                                                        <label className="cursor-pointer">
                                                            <span className="text-sm text-indigo-600 hover:text-indigo-500">
                                                                Click to upload
                                                                content files
                                                            </span>
                                                            <input
                                                                id="content-files"
                                                                type="file"
                                                                multiple
                                                                accept="video/*,.ppt,.pptx,.pdf"
                                                                onChange={e =>
                                                                    handleFileUpload(
                                                                        'content',
                                                                        e.target
                                                                            .files,
                                                                    )
                                                                }
                                                                className="hidden"
                                                            />
                                                        </label>
                                                        <p className="text-xs text-gray-500">
                                                            Videos, PDFs,
                                                            PowerPoint files
                                                        </p>
                                                    </div>
                                                    {uploadData.contentFiles
                                                        .length > 0 && (
                                                        <div className="mt-2">
                                                            <p className="text-sm text-gray-600">
                                                                Selected{' '}
                                                                {
                                                                    uploadData
                                                                        .contentFiles
                                                                        .length
                                                                }{' '}
                                                                file(s):
                                                            </p>
                                                            <ul className="text-xs text-gray-500 mt-1">
                                                                {uploadData.contentFiles.map(
                                                                    (
                                                                        file,
                                                                        index,
                                                                    ) => (
                                                                        <li
                                                                            key={`${file.name}-${index}`}>
                                                                            {
                                                                                file.name
                                                                            }
                                                                        </li>
                                                                    ),
                                                                )}
                                                            </ul>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Upload Progress */}
                                        {isUploading && (
                                            <div className="pt-4 border-t border-gray-200">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-gray-700">
                                                        Uploading...
                                                    </span>
                                                    <span className="text-sm text-gray-500">
                                                        {Math.round(
                                                            uploadProgress,
                                                        )}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-2">
                                                    <div
                                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                                        style={{
                                                            width: `${uploadProgress}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {/* Form Actions */}
                                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setShowUploadForm(false)
                                                }
                                                disabled={isUploading}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={
                                                    isUploading ||
                                                    createCourseMutation.isPending
                                                }
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                                                {isUploading ||
                                                createCourseMutation.isPending ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-2" />
                                                        Upload Course
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Courses List */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Existing Courses
                            </h2>
                        </div>
                        <div className="p-6">
                            {courses && courses.length > 0 ? (
                                <div className="space-y-4">
                                    {courses.map(course => (
                                        <div
                                            key={course.id}
                                            className="border border-gray-200 rounded-lg p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center space-x-3 mb-2">
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            {course.title}
                                                        </h3>
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                                                                course.difficulty,
                                                            )}`}>
                                                            {course.difficulty}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 mb-2">
                                                        {course.description}
                                                    </p>
                                                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                                                        <span className="flex items-center">
                                                            <User className="h-4 w-4 mr-1" />
                                                            {course.instructor}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Tag className="h-4 w-4 mr-1" />
                                                            {course.category}
                                                        </span>
                                                        <span className="flex items-center">
                                                            <Clock className="h-4 w-4 mr-1" />
                                                            {course.duration ||
                                                                0}{' '}
                                                            min
                                                        </span>
                                                        <span className="flex items-center">
                                                            <FileText className="h-4 w-4 mr-1" />
                                                            Course materials
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2 ml-4">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleDeleteCourse(
                                                                course.id,
                                                            )
                                                        }
                                                        disabled={
                                                            deleteCourseMutation.isPending
                                                        }
                                                        className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                        title="Delete course">
                                                        {deleteCourseMutation.isPending ? (
                                                            <LoadingSpinner size="sm" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <EmptyState
                                    icon={BookOpen}
                                    title="No courses yet"
                                    description="Upload your first course to get started"
                                    action={{
                                        label: 'Upload Course',
                                        onClick: () => setShowUploadForm(true),
                                    }}
                                />
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        User Management
                    </h2>
                    <p className="text-gray-500">
                        User management functionality coming soon.
                    </p>
                </div>
            )}

            {/* Invitations Tab */}
            {activeTab === 'invitations' && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        Invitation Management
                    </h2>
                    <p className="text-gray-500">
                        Invitation management functionality coming soon.
                    </p>
                </div>
            )}
        </div>
    );
};

export default AdminPanel;
