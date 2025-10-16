/**
 * ResumeCard Component
 * Card component for resume functionality showing course progress
 */

import type React from 'react';
import { Link } from 'react-router-dom';
import { Play, RotateCcw, Clock, BookOpen } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import ProgressBar from './ProgressBar';
import type { Course, ContentProgressResponse } from '../types';

interface ResumeCardProps {
    course: Course;
    progress: ContentProgressResponse;
    lastActivity?: string;
    className?: string;
}

const ResumeCard: React.FC<ResumeCardProps> = ({
    course,
    progress,
    lastActivity,
    className = '',
}) => {
    const formatTime = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        if (hours > 0) {
            return `${hours}:${minutes
                .toString()
                .padStart(2, '0')}:${remainingSeconds
                .toString()
                .padStart(2, '0')}`;
        }
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    const getResumeUrl = () => {
        const baseUrl = `/course/${course.id}`;
        if (progress.last_position && progress.last_position > 0) {
            return `${baseUrl}?content=${progress.content_id}&t=${Math.floor(
                progress.last_position,
            )}`;
        }
        return baseUrl;
    };

    return (
        <div
            className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow ${className}`}>
            {/* Course Thumbnail */}
            <div className="relative">
                {course.thumbnail_url ? (
                    <img
                        src={course.thumbnail_url}
                        alt={course.title}
                        className="w-full h-32 object-cover rounded-t-lg"
                    />
                ) : (
                    <div className="w-full h-32 bg-gray-200 rounded-t-lg flex items-center justify-center">
                        <BookOpen className="h-8 w-8 text-gray-400" />
                    </div>
                )}

                {/* Play Overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-200 rounded-t-lg flex items-center justify-center">
                    <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
                        <Play className="h-8 w-8 text-white" />
                    </div>
                </div>
            </div>

            {/* Course Info */}
            <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {course.title}
                </h3>

                <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {course.description}
                </p>

                {/* Progress Section */}
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            {progress.title}
                        </span>
                        <span className="text-sm text-gray-500">
                            {progress.progress_percentage}%
                        </span>
                    </div>

                    <ProgressBar
                        progress={progress.progress_percentage}
                        size="sm"
                        showPercentage={false}
                    />

                    {progress.last_position && progress.last_position > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            Last position: {formatTime(progress.last_position)}
                        </p>
                    )}
                </div>

                {/* Course Meta */}
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>{course.duration || 0} min</span>
                    </div>
                    {lastActivity && (
                        <span>
                            {formatDistanceToNow(new Date(lastActivity), {
                                addSuffix: true,
                            })}
                        </span>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                    <Link
                        to={getResumeUrl()}
                        className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center justify-center">
                        <Play className="h-4 w-4 mr-2" />
                        {progress.last_position && progress.last_position > 0
                            ? 'Resume'
                            : 'Start'}
                    </Link>

                    {progress.last_position && progress.last_position > 0 && (
                        <Link
                            to={`/course/${course.id}?content=${progress.content_id}`}
                            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-50 transition-colors flex items-center justify-center"
                            title="Start from beginning">
                            <RotateCcw className="h-4 w-4" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ResumeCard;
