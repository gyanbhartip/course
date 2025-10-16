/**
 * Dashboard Component
 * Main dashboard showing user's enrolled courses and recent activity
 * Updated to use real API data
 */

import type React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useMyEnrollments } from '../hooks/useEnrollments';
import { useNotes } from '../hooks/useNotes';
import { useDashboardStats } from '../hooks/useDashboard';
import { useProgressSummary } from '../hooks/useProgress';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import EmptyState from '../components/EmptyState';
import ResumeCard from '../components/ResumeCard';
import {
    BookOpen,
    Clock,
    TrendingUp,
    Play,
    FileText,
    Calendar,
} from 'lucide-react';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    // Fetch real data from API
    const {
        data: enrollments,
        isLoading: enrollmentsLoading,
        error: enrollmentsError,
    } = useMyEnrollments();
    const {
        data: notes,
        isLoading: notesLoading,
        error: notesError,
    } = useNotes({ size: 3 });
    const {
        data: dashboardStats,
        isLoading: statsLoading,
        error: statsError,
    } = useDashboardStats();
    const {
        data: progressSummary,
        isLoading: progressLoading,
        error: progressError,
    } = useProgressSummary();

    if (!user) return null;

    // Show loading state
    if (enrollmentsLoading || notesLoading || statsLoading || progressLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading dashboard..." />
            </div>
        );
    }

    // Show error state
    if (enrollmentsError || notesError || statsError || progressError) {
        return (
            <div className="space-y-6">
                <ErrorMessage
                    title="Error loading dashboard"
                    message="There was a problem loading your dashboard data. Please try again."
                />
            </div>
        );
    }

    // Get enrolled courses and recent notes
    const enrolledCourses =
        enrollments?.map(enrollment => enrollment.course) || [];
    const recentNotes = notes || [];

    // Calculate stats from API data or use dashboard stats
    const totalCourses =
        dashboardStats?.enrolled_courses || enrolledCourses.length;
    const totalNotes = dashboardStats?.notes_count || recentNotes.length;
    const totalDuration = enrolledCourses.reduce(
        (sum, course) => sum + (course.duration || 0),
        0,
    );

    return (
        <div className="space-y-6">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-700 dark:to-purple-700 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">
                    Welcome back, {user.name}!
                </h1>
                <p className="text-indigo-100">
                    Continue your learning journey with your subscribed courses
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Subscribed Courses
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {totalCourses}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                            <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Duration
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {totalDuration}m
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                            <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                Total Notes
                            </p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                {totalNotes}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Continue Learning Section */}
            {progressSummary && progressSummary.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Continue Learning
                        </h2>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Pick up where you left off
                        </p>
                    </div>
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {progressSummary
                                .filter(
                                    course =>
                                        course.overall_progress > 0 &&
                                        course.overall_progress < 100,
                                )
                                .slice(0, 3)
                                .map(course => {
                                    // Find the content with the highest progress that's not completed
                                    const currentContent =
                                        course.content_progress
                                            .filter(
                                                content =>
                                                    !content.completed &&
                                                    content.progress_percentage >
                                                        0,
                                            )
                                            .sort(
                                                (a, b) =>
                                                    b.progress_percentage -
                                                    a.progress_percentage,
                                            )[0];

                                    if (!currentContent) return null;

                                    return (
                                        <ResumeCard
                                            key={course.course_id}
                                            course={{
                                                id: course.course_id,
                                                title: course.course_title,
                                                description: '',
                                                instructor: '',
                                                difficulty: 'beginner',
                                                category: '',
                                                thumbnail_url: '',
                                                duration: 0,
                                                status: 'published',
                                                created_at: '',
                                                updated_at: '',
                                                content: [],
                                            }}
                                            progress={currentContent}
                                            lastActivity={
                                                currentContent.updated_at
                                            }
                                        />
                                    );
                                })}
                        </div>
                        {progressSummary.filter(
                            course =>
                                course.overall_progress > 0 &&
                                course.overall_progress < 100,
                        ).length === 0 && (
                            <EmptyState
                                icon={Play}
                                title="No courses in progress"
                                description="Start a new course to see your progress here"
                                action={{
                                    label: 'Browse Courses',
                                    onClick: () => navigate('/courses'),
                                }}
                            />
                        )}
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* My Courses Section */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                My Courses
                            </h2>
                            <Link
                                to="/courses"
                                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                                View all
                            </Link>
                        </div>
                    </div>
                    <div className="p-6">
                        {enrolledCourses.length > 0 ? (
                            <div className="space-y-4">
                                {enrolledCourses.slice(0, 3).map(course => (
                                    <div
                                        key={course.id}
                                        className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            {course.thumbnail_url ? (
                                                <img
                                                    src={course.thumbnail_url}
                                                    alt={course.title}
                                                    className="h-12 w-12 rounded-lg object-cover"
                                                />
                                            ) : (
                                                <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                    <BookOpen className="h-6 w-6 text-gray-500" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <Link
                                                to={`/course/${course.id}`}
                                                className="text-sm font-medium text-gray-900 hover:text-indigo-600">
                                                {course.title}
                                            </Link>
                                            <p className="text-sm text-gray-500">
                                                {course.instructor}
                                            </p>
                                            <div className="flex items-center mt-1">
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                    {course.difficulty}
                                                </span>
                                                {course.duration && (
                                                    <span className="ml-2 text-xs text-gray-500">
                                                        {course.duration} min
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <Link
                                                to={`/course/${course.id}`}
                                                className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200">
                                                <Play className="h-3 w-3 mr-1" />
                                                Start
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={BookOpen}
                                title="No courses yet"
                                description="Enroll in courses to start learning"
                                action={{
                                    label: 'Browse Courses',
                                    onClick: () => navigate('/courses'),
                                }}
                            />
                        )}
                    </div>
                </div>

                {/* Recent Notes Section */}
                <div className="bg-white rounded-lg shadow">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">
                                Recent Notes
                            </h2>
                            <Link
                                to="/notes"
                                className="text-indigo-600 hover:text-indigo-500 text-sm font-medium">
                                View all
                            </Link>
                        </div>
                    </div>
                    <div className="p-6">
                        {recentNotes.length > 0 ? (
                            <div className="space-y-4">
                                {recentNotes.map(note => (
                                    <div
                                        key={note.id}
                                        className="border-l-4 border-indigo-200 pl-4">
                                        <h4 className="text-sm font-medium text-gray-900">
                                            {note.title}
                                        </h4>
                                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                            {note.content}
                                        </p>
                                        <div className="flex items-center mt-2 text-xs text-gray-500">
                                            <Calendar className="h-3 w-3 mr-1" />
                                            {new Date(
                                                note.created_at,
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={FileText}
                                title="No notes yet"
                                description="Start taking notes while learning"
                                action={{
                                    label: 'View Notes',
                                    onClick: () => navigate('/notes'),
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Quick Actions
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                        to="/courses"
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() =>
                            console.log('Navigating to /courses from Dashboard')
                        }>
                        <BookOpen className="h-5 w-5 text-indigo-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                            Browse Courses
                        </span>
                    </Link>

                    <Link
                        to="/notes"
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                        onClick={() =>
                            console.log('Navigating to /notes from Dashboard')
                        }>
                        <FileText className="h-5 w-5 text-green-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                            View Notes
                        </span>
                    </Link>

                    <Link
                        to="/courses"
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <TrendingUp className="h-5 w-5 text-purple-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                            Continue Learning
                        </span>
                    </Link>

                    {user.role === 'admin' && (
                        <Link
                            to="/admin"
                            className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                            <TrendingUp className="h-5 w-5 text-orange-600 mr-3" />
                            <span className="text-sm font-medium text-gray-900">
                                Admin Panel
                            </span>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
