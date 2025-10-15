/**
 * Analytics Component
 * Shows learning analytics and progress charts
 */

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
    useProgressSummary,
    useProgressAnalytics,
} from '../../hooks/useProgress';
import LoadingSpinner from '../../components/LoadingSpinner';
import ErrorMessage from '../../components/ErrorMessage';
import EmptyState from '../../components/EmptyState';
import Chart from '../../components/Chart';
import StreakCalendar from '../../components/StreakCalendar';
import ProgressBar from '../../components/ProgressBar';
import {
    TrendingUp,
    Target,
    Clock,
    BookOpen,
    Award,
    Calendar,
    BarChart3,
} from 'lucide-react';

const Analytics: React.FC = () => {
    const { user } = useAuth();
    const {
        data: progressSummary,
        isLoading: summaryLoading,
        error: summaryError,
    } = useProgressSummary();
    const {
        data: analytics,
        isLoading: analyticsLoading,
        error: analyticsError,
    } = useProgressAnalytics();

    if (!user) return null;

    // Show loading state
    if (summaryLoading || analyticsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading analytics..." />
            </div>
        );
    }

    // Show error state
    if (summaryError || analyticsError) {
        return (
            <div className="space-y-6">
                <ErrorMessage
                    title="Error loading analytics"
                    message="There was a problem loading your analytics data. Please try again."
                />
            </div>
        );
    }

    // Prepare chart data
    const courseProgressData =
        progressSummary?.map(course => ({
            name:
                course.course_title.length > 20
                    ? course.course_title.substring(0, 20) + '...'
                    : course.course_title,
            progress: course.overall_progress,
            completed: course.completed_content,
            total: course.total_content,
        })) || [];

    const difficultyData =
        progressSummary?.reduce((acc, course) => {
            // This would need to be enhanced with actual difficulty data
            const difficulty = 'Beginner'; // Placeholder
            if (!acc[difficulty]) {
                acc[difficulty] = { completed: 0, total: 0 };
            }
            acc[difficulty].completed += course.completed_content;
            acc[difficulty].total += course.total_content;
            return acc;
        }, {} as Record<string, { completed: number; total: number }>) || {};

    const difficultyChartData = Object.entries(difficultyData).map(
        ([difficulty, data]) => ({
            name: difficulty,
            value:
                data.total > 0
                    ? Math.round((data.completed / data.total) * 100)
                    : 0,
        }),
    );

    // Mock learning activity data (in real app, this would come from analytics)
    const learningActivity = [
        { date: '2024-01-01', minutes: 45, courses: ['React Basics'] },
        { date: '2024-01-02', minutes: 30, courses: ['React Basics'] },
        {
            date: '2024-01-03',
            minutes: 60,
            courses: ['React Basics', 'TypeScript'],
        },
        { date: '2024-01-05', minutes: 25, courses: ['TypeScript'] },
        {
            date: '2024-01-07',
            minutes: 90,
            courses: ['React Basics', 'TypeScript'],
        },
        { date: '2024-01-08', minutes: 40, courses: ['React Basics'] },
        { date: '2024-01-10', minutes: 55, courses: ['TypeScript'] },
        { date: '2024-01-12', minutes: 35, courses: ['React Basics'] },
        {
            date: '2024-01-15',
            minutes: 70,
            courses: ['React Basics', 'TypeScript'],
        },
        { date: '2024-01-16', minutes: 20, courses: ['TypeScript'] },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-6 text-white">
                <h1 className="text-2xl font-bold mb-2">Learning Analytics</h1>
                <p className="text-indigo-100">
                    Track your learning progress and achievements
                </p>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <BookOpen className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Courses Enrolled
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analytics?.total_courses_enrolled || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <Target className="h-6 w-6 text-green-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Content Completed
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analytics?.total_content_completed || 0}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-lg">
                            <Clock className="h-6 w-6 text-purple-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Learning Time
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analytics?.total_learning_time || 0}h
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center">
                        <div className="p-2 bg-yellow-100 rounded-lg">
                            <Award className="h-6 w-6 text-yellow-600" />
                        </div>
                        <div className="ml-4">
                            <p className="text-sm font-medium text-gray-600">
                                Completion Rate
                            </p>
                            <p className="text-2xl font-bold text-gray-900">
                                {analytics?.completion_rate || 0}%
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Course Progress Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Course Progress
                    </h3>
                    {courseProgressData.length > 0 ? (
                        <Chart
                            type="bar"
                            data={courseProgressData}
                            xKey="name"
                            yKeys={[
                                {
                                    key: 'progress',
                                    color: '#3B82F6',
                                    name: 'Progress %',
                                },
                            ]}
                            height={300}
                        />
                    ) : (
                        <EmptyState
                            icon={BarChart3}
                            title="No progress data"
                            description="Start learning to see your progress here"
                        />
                    )}
                </div>

                {/* Difficulty Distribution */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Progress by Difficulty
                    </h3>
                    {difficultyChartData.length > 0 ? (
                        <Chart
                            type="pie"
                            data={difficultyChartData}
                            dataKey="value"
                            nameKey="name"
                            colors={[
                                '#3B82F6',
                                '#10B981',
                                '#F59E0B',
                                '#EF4444',
                            ]}
                            height={300}
                        />
                    ) : (
                        <EmptyState
                            icon={Target}
                            title="No difficulty data"
                            description="Complete some content to see difficulty breakdown"
                        />
                    )}
                </div>
            </div>

            {/* Learning Activity Calendar */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Learning Activity
                </h3>
                <StreakCalendar activities={learningActivity} />
            </div>

            {/* Detailed Course Progress */}
            {progressSummary && progressSummary.length > 0 && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Detailed Course Progress
                    </h3>
                    <div className="space-y-4">
                        {progressSummary.map(course => (
                            <div
                                key={course.course_id}
                                className="border rounded-lg p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-gray-900">
                                        {course.course_title}
                                    </h4>
                                    <span className="text-sm text-gray-500">
                                        {course.completed_content} /{' '}
                                        {course.total_content} completed
                                    </span>
                                </div>
                                <ProgressBar
                                    progress={course.overall_progress}
                                    size="md"
                                    showPercentage={true}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default Analytics;
