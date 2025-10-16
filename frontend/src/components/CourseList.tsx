/**
 * CourseList Component
 * Displays all published courses with enrollment status and filters
 * Updated to use real API data
 */

import { BookOpen, Clock, Filter, Play, Plus, Star, User } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../hooks/useCourses';
import {
    useEnrollInCourse,
    useEnrollmentStatus,
    useUnenrollFromCourse,
} from '../hooks/useEnrollments';
import type { Course } from '../types';

const CourseList = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState<
        'all' | 'beginner' | 'intermediate' | 'advanced'
    >('all');
    const [category, setCategory] = useState<string>('all');
    const [page, setPage] = useState(1);

    // Fetch courses from API
    const {
        data: coursesData,
        isLoading,
        error,
        refetch,
    } = useCourses({
        page,
        size: 12,
        difficulty: filter === 'all' ? undefined : filter,
        category: category === 'all' ? undefined : category,
    });

    const courses = coursesData?.courses || [];
    const totalPages = coursesData?.pages || 0;

    if (!user) return null;

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading courses..." />
            </div>
        );
    }

    // Show error state
    if (error) {
        return (
            <div className="space-y-6">
                <ErrorMessage
                    title="Error loading courses"
                    message="There was a problem loading the courses. Please try again."
                />
                <button
                    type="button"
                    onClick={() => refetch()}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
                    Retry
                </button>
            </div>
        );
    }

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

    // Course card component with enrollment functionality
    const CourseCard: React.FC<{ course: Course }> = ({ course }) => {
        const { data: enrollmentStatus } = useEnrollmentStatus(course.id);
        const enrollMutation = useEnrollInCourse();
        const unenrollMutation = useUnenrollFromCourse();

        const isEnrolled = enrollmentStatus?.enrolled || false;
        const isEnrolling =
            enrollMutation.isPending || unenrollMutation.isPending;

        const handleEnrollment = async () => {
            if (isEnrolled) {
                await unenrollMutation.mutateAsync(course.id);
            } else {
                await enrollMutation.mutateAsync(course.id);
            }
        };

        return (
            <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                {/* Course Thumbnail */}
                <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center relative">
                    {course.thumbnail_url ? (
                        <img
                            src={course.thumbnail_url}
                            alt={course.title}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <BookOpen className="h-16 w-16 text-white opacity-80" />
                    )}
                    {isEnrolled && (
                        <div className="absolute top-2 right-2 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                            Enrolled
                        </div>
                    )}
                </div>

                {/* Course Content */}
                <div className="p-6">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                            {course.title}
                        </h3>
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getDifficultyColor(
                                course.difficulty,
                            )}`}>
                            {course.difficulty}
                        </span>
                    </div>

                    <p className="text-sm text-gray-600 mb-4 line-clamp-3">
                        {course.description || 'No description available'}
                    </p>

                    {/* Course Meta */}
                    <div className="flex items-center text-sm text-gray-500 mb-4">
                        <User className="h-4 w-4 mr-1" />
                        <span className="mr-4">{course.instructor}</span>
                        {course.duration && (
                            <>
                                <Clock className="h-4 w-4 mr-1" />
                                <span>{course.duration} min</span>
                            </>
                        )}
                    </div>

                    {/* Course Stats */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center">
                            <span className="text-sm text-gray-500">
                                Category:
                            </span>
                            <span className="ml-1 text-sm font-medium text-gray-900">
                                {course.category || 'General'}
                            </span>
                        </div>
                        <div className="flex items-center">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="ml-1 text-sm text-gray-500">
                                4.8
                            </span>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex space-x-2">
                        {isEnrolled ? (
                            <Link
                                to={`/course/${course.id}`}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                <Play className="h-4 w-4 mr-2" />
                                Continue
                            </Link>
                        ) : (
                            <button
                                type="button"
                                onClick={handleEnrollment}
                                disabled={isEnrolling}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50">
                                {isEnrolling ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Enroll
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        All Courses
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {coursesData?.total || 0} course
                        {coursesData?.total !== 1 ? 's' : ''} available
                    </p>
                </div>

                {/* Filters */}
                <div className="mt-4 sm:mt-0 flex space-x-4">
                    <div className="relative">
                        <select
                            value={filter}
                            onChange={e =>
                                setFilter(
                                    e.target.value as
                                        | 'all'
                                        | 'beginner'
                                        | 'intermediate'
                                        | 'advanced',
                                )
                            }
                            className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                            <option value="all">All Levels</option>
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                        </select>
                        <Filter className="absolute right-2 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                </div>
            </div>

            {/* Courses Grid */}
            {courses.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {courses.map(course => (
                            <CourseCard key={course.id} course={course} />
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-8">
                            <div className="text-sm text-gray-700">
                                Showing page {page} of {totalPages}
                            </div>
                            <div className="flex space-x-2">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage(Math.max(1, page - 1))
                                    }
                                    disabled={page === 1}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Previous
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setPage(Math.min(totalPages, page + 1))
                                    }
                                    disabled={page === totalPages}
                                    className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </>
            ) : (
                <EmptyState
                    icon={BookOpen}
                    title="No courses found"
                    description="No courses match your current filters. Try adjusting your search criteria."
                    action={{
                        label: 'Clear Filters',
                        onClick: () => {
                            setFilter('all');
                            setCategory('all');
                            setPage(1);
                        },
                    }}
                />
            )}
        </div>
    );
};

export default CourseList;
