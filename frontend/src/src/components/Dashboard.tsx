/**
 * Dashboard Component
 * Main dashboard showing user's subscribed courses and recent activity
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSubscribedCourses, getNotesByUser } from '../data/mockData';
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

    if (!user) return null;

    // Get user's subscribed courses and recent notes
    const subscribedCourses = getSubscribedCourses(user.id);
    const userNotes = getNotesByUser(user.id);
    const recentNotes = userNotes.slice(0, 3); // Show only 3 most recent notes

    // Calculate some stats
    const totalCourses = subscribedCourses.length;
    const totalNotes = userNotes.length;
    const totalDuration = subscribedCourses.reduce(
        (sum, course) => sum + course.duration,
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
                        {subscribedCourses.length > 0 ? (
                            <div className="space-y-4">
                                {subscribedCourses.slice(0, 3).map(course => (
                                    <div
                                        key={course.id}
                                        className="flex items-center space-x-4">
                                        <div className="flex-shrink-0">
                                            <div className="h-12 w-12 bg-gray-200 rounded-lg flex items-center justify-center">
                                                <BookOpen className="h-6 w-6 text-gray-500" />
                                            </div>
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
                                                <span className="ml-2 text-xs text-gray-500">
                                                    {course.duration} min
                                                </span>
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
                            <div className="text-center py-6">
                                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    No courses yet
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Subscribe to courses to start learning
                                </p>
                            </div>
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
                                                note.createdAt,
                                            ).toLocaleDateString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6">
                                <FileText className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">
                                    No notes yet
                                </h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Start taking notes while learning
                                </p>
                            </div>
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
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <BookOpen className="h-5 w-5 text-indigo-600 mr-3" />
                        <span className="text-sm font-medium text-gray-900">
                            Browse Courses
                        </span>
                    </Link>

                    <Link
                        to="/notes"
                        className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
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
