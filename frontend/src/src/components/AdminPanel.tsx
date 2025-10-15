/**
 * AdminPanel Component
 * Admin interface for uploading and managing courses
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { mockCourses } from '../data/mockData';
import {
    Upload,
    Plus,
    Edit,
    Trash2,
    Save,
    X,
    BookOpen,
    FileText,
    Video,
    Image,
    Clock,
    User,
    Tag,
} from 'lucide-react';

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
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState<string | null>(null);
    const [uploadData, setUploadData] = useState<CourseUploadData>({
        title: '',
        description: '',
        instructor: '',
        category: '',
        difficulty: 'beginner',
        thumbnail: null,
        contentFiles: [],
    });

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

    // Handle form input changes
    const handleInputChange = (field: keyof CourseUploadData, value: any) => {
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
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // In a real app, this would upload to a server
        console.log('Uploading course:', uploadData);

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

        // Show success message (in a real app, you'd use a toast notification)
        alert('Course uploaded successfully!');
    };

    // Handle course deletion
    const handleDeleteCourse = (courseId: string) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            // In a real app, this would make an API call to delete the course
            console.log('Deleting course:', courseId);
            alert('Course deleted successfully!');
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
                        Manage courses and content for the platform
                    </p>
                </div>
                <button
                    onClick={() => setShowUploadForm(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload New Course
                </button>
            </div>

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
                                    onClick={() => setShowUploadForm(false)}
                                    className="text-gray-400 hover:text-gray-600">
                                    <X className="h-6 w-6" />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Basic Information */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Course Title *
                                        </label>
                                        <input
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Instructor *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            value={uploadData.instructor}
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
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Description *
                                    </label>
                                    <textarea
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Category *
                                        </label>
                                        <input
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Difficulty *
                                        </label>
                                        <select
                                            required
                                            value={uploadData.difficulty}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
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
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={e =>
                                                            handleFileUpload(
                                                                'thumbnail',
                                                                e.target.files,
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
                                                    {uploadData.thumbnail.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Course Content Files *
                                        </label>
                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                            <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                            <div className="mt-2">
                                                <label className="cursor-pointer">
                                                    <span className="text-sm text-indigo-600 hover:text-indigo-500">
                                                        Click to upload content
                                                        files
                                                    </span>
                                                    <input
                                                        type="file"
                                                        multiple
                                                        accept="video/*,.ppt,.pptx,.pdf"
                                                        onChange={e =>
                                                            handleFileUpload(
                                                                'content',
                                                                e.target.files,
                                                            )
                                                        }
                                                        className="hidden"
                                                    />
                                                </label>
                                                <p className="text-xs text-gray-500">
                                                    Videos, PDFs, PowerPoint
                                                    files
                                                </p>
                                            </div>
                                            {uploadData.contentFiles.length >
                                                0 && (
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
                                                            (file, index) => (
                                                                <li key={index}>
                                                                    {file.name}
                                                                </li>
                                                            ),
                                                        )}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Form Actions */}
                                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={() => setShowUploadForm(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                        <Save className="h-4 w-4 mr-2" />
                                        Upload Course
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
                    {mockCourses.length > 0 ? (
                        <div className="space-y-4">
                            {mockCourses.map(course => (
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
                                                    {course.duration} min
                                                </span>
                                                <span className="flex items-center">
                                                    {course.content.some(
                                                        c => c.type === 'video',
                                                    ) && (
                                                        <Video className="h-4 w-4 mr-1" />
                                                    )}
                                                    {course.content.some(
                                                        c =>
                                                            c.type ===
                                                            'presentation',
                                                    ) && (
                                                        <FileText className="h-4 w-4 mr-1" />
                                                    )}
                                                    {course.content.length}{' '}
                                                    content
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() =>
                                                    setEditingCourse(course.id)
                                                }
                                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                title="Edit course">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteCourse(
                                                        course.id,
                                                    )
                                                }
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Delete course">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900">
                                No courses yet
                            </h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Upload your first course to get started
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminPanel;
