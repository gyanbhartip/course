/**
 * CourseList Component
 * Displays all subscribed courses in a grid layout
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSubscribedCourses } from '../data/mockData';
import { BookOpen, Clock, User, Play, Star, Filter } from 'lucide-react';

const CourseList: React.FC = () => {
    const { user } = useAuth();
    const [filter, setFilter] = useState<
        'all' | 'beginner' | 'intermediate' | 'advanced'
    >('all');

    if (!user) return null;

    const subscribedCourses = getSubscribedCourses(user.id);

    // Filter courses based on difficulty
    const filteredCourses =
        filter === 'all'
            ? subscribedCourses
            : subscribedCourses.filter(course => course.difficulty === filter);

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
                        My Courses
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {subscribedCourses.length} subscribed course
                        {subscribedCourses.length !== 1 ? 's' : ''}
                    </p>
                </div>

                {/* Filter Dropdown */}
                <div className="mt-4 sm:mt-0">
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
            {filteredCourses.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map(course => (
                        <div
                            key={course.id}
                            className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            {/* Course Thumbnail */}
                            <div className="h-48 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                                <BookOpen className="h-16 w-16 text-white opacity-80" />
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
                                    {course.description}
                                </p>

                                {/* Course Meta */}
                                <div className="flex items-center text-sm text-gray-500 mb-4">
                                    <User className="h-4 w-4 mr-1" />
                                    <span className="mr-4">
                                        {course.instructor}
                                    </span>
                                    <Clock className="h-4 w-4 mr-1" />
                                    <span>{course.duration} min</span>
                                </div>

                                {/* Course Stats */}
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center">
                                        <span className="text-sm text-gray-500">
                                            Content:
                                        </span>
                                        <span className="ml-1 text-sm font-medium text-gray-900">
                                            {course.content.length}{' '}
                                            {course.content.length === 1
                                                ? 'item'
                                                : 'items'}
                                        </span>
                                    </div>
                                    <div className="flex items-center">
                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                        <span className="ml-1 text-sm text-gray-500">
                                            4.8
                                        </span>
                                    </div>
                                </div>

                                {/* Action Button */}
                                <Link
                                    to={`/course/${course.id}`}
                                    className="w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors">
                                    <Play className="h-4 w-4 mr-2" />
                                    Start Course
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="text-center py-12">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {filter === 'all'
                            ? 'No courses yet'
                            : `No ${filter} courses`}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {filter === 'all'
                            ? 'Subscribe to courses to start learning'
                            : `Try selecting a different difficulty level`}
                    </p>
                    {filter !== 'all' && (
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200">
                            View All Courses
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CourseList;
