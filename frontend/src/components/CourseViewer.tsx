/**
 * CourseViewer Component
 * Displays course content including videos and presentations
 * Updated to use real API data with enrollment checking
 */

import {
    BookOpen,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Circle,
    Clock,
    FileText,
    Lock,
    Plus,
    Save,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import ProgressBar from '../components/ProgressBar';
import VideoPlayer from '../components/VideoPlayer';
import { useAuth } from '../contexts/AuthContext';
import { useCourse } from '../hooks/useCourse';
import {
    useEnrollInCourse,
    useEnrollmentStatus,
} from '../hooks/useEnrollments';
import { useCourseNotes, useCreateNote } from '../hooks/useNotes';
import { useCourseProgress } from '../hooks/useProgress';

const CourseViewer = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { user } = useAuth();
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');

    const videoRef = useRef<HTMLVideoElement>(null);

    // Fetch course data and enrollment status
    const {
        data: course,
        isLoading: courseLoading,
        error: courseError,
    } = useCourse(courseId || '');
    const { data: enrollmentStatus, isLoading: enrollmentLoading } =
        useEnrollmentStatus(courseId || '');
    const { data: notes, isLoading: notesLoading } = useCourseNotes(
        courseId || '',
    );
    const enrollMutation = useEnrollInCourse();
    const createNoteMutation = useCreateNote();
    const { data: courseProgress } = useCourseProgress(courseId || '');

    const isEnrolled = enrollmentStatus?.enrolled || false;
    const isLoading = courseLoading || enrollmentLoading || notesLoading;

    // Show loading state
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading course..." />
            </div>
        );
    }

    // Show error state
    if (courseError || !course) {
        return (
            <div className="space-y-6">
                <ErrorMessage
                    title="Course not found"
                    message="The course you're looking for doesn't exist or there was an error loading it."
                />
                <Link
                    to="/courses"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200">
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Courses
                </Link>
            </div>
        );
    }

    // Check if user is enrolled
    if (!isEnrolled) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="text-center">
                        <Lock className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                            Course Access Required
                        </h3>
                        <p className="mt-1 text-sm text-gray-500">
                            You need to enroll in this course to access its
                            content.
                        </p>
                        <div className="mt-6 flex justify-center space-x-4">
                            <button
                                type="button"
                                onClick={() => enrollMutation.mutate(courseId!)}
                                disabled={enrollMutation.isPending}
                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                                {enrollMutation.isPending ? (
                                    <LoadingSpinner size="sm" />
                                ) : (
                                    <>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Enroll Now
                                    </>
                                )}
                            </button>
                            <Link
                                to="/courses"
                                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Back to Courses
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Get current content (assuming course has content array)
    const currentContent = course.content?.[currentContentIndex];

    // Handle video controls
    const togglePlayPause = () => {
        if (videoRef.current) {
            if (isPlaying) {
                videoRef.current.pause();
            } else {
                videoRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            videoRef.current.muted = !isMuted;
            setIsMuted(!isMuted);
        }
    };

    const toggleFullscreen = () => {
        if (videoRef.current) {
            if (videoRef.current.requestFullscreen) {
                videoRef.current.requestFullscreen();
            }
        }
    };

    // Navigation functions
    const goToPrevious = () => {
        if (currentContentIndex > 0) {
            setCurrentContentIndex(currentContentIndex - 1);
            setIsPlaying(false);
        }
    };

    const goToNext = () => {
        if (currentContentIndex < (course.content?.length || 0) - 1) {
            setCurrentContentIndex(currentContentIndex + 1);
            setIsPlaying(false);
        }
    };

    // Note handling with API
    const handleSaveNote = async () => {
        if (noteTitle.trim() && noteContent.trim() && courseId) {
            try {
                await createNoteMutation.mutateAsync({
                    title: noteTitle,
                    content: noteContent,
                    course_id: courseId,
                });
                setNoteTitle('');
                setNoteContent('');
                setShowNoteForm(false);
            } catch (error) {
                console.error('Failed to save note:', error);
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Course Header */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            {course.title}
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            by {course.instructor}
                        </p>
                        <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                                <Clock className="h-4 w-4 mr-1" />
                                {course.duration || 0} min
                            </span>
                            <span className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                {course.content?.length || 0} lessons
                            </span>
                        </div>
                    </div>
                    <Link
                        to="/courses"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Back to Courses
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {/* Content Player */}
                        <div className="relative bg-black">
                            {!currentContent ? (
                                <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center bg-gray-100">
                                    <div className="text-center">
                                        <BookOpen className="mx-auto h-16 w-16 text-gray-400" />
                                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                                            No Content Available
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            This course doesn't have any content
                                            yet.
                                        </p>
                                    </div>
                                </div>
                            ) : currentContent.type === 'video' ? (
                                <VideoPlayer
                                    contentId={currentContent.id}
                                    courseId={courseId || ''}
                                    manifest={{
                                        content_id: currentContent.id,
                                        title: currentContent.title,
                                        duration: currentContent.duration || 0,
                                        qualities: [
                                            {
                                                name: '720p',
                                                url: currentContent.url,
                                                height: 720,
                                                bitrate: '2000k',
                                            },
                                        ],
                                    }}
                                    onProgressUpdate={(progress, position) => {
                                        // Progress is automatically saved by the VideoPlayer
                                        console.log(
                                            `Progress: ${progress}%, Position: ${position}s`,
                                        );
                                    }}
                                    className="h-64 sm:h-80 lg:h-96"
                                />
                            ) : (
                                <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center bg-gray-100">
                                    <div className="text-center">
                                        <FileText className="mx-auto h-16 w-16 text-gray-400" />
                                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                                            {currentContent.type ===
                                            'presentation'
                                                ? 'Presentation'
                                                : 'Content'}
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {currentContent.title}
                                        </p>
                                        <button
                                            type="button"
                                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Open Content
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Content Info */}
                        <div className="p-6">
                            <div className="flex items-start justify-between">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {currentContent?.title || 'No Content'}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Lesson {currentContentIndex + 1} of{' '}
                                        {course.content?.length || 0}
                                    </p>
                                    <p className="mt-2 text-gray-600">
                                        {currentContent?.description ||
                                            'No description available.'}
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowNoteForm(!showNoteForm)
                                    }
                                    className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Note
                                </button>
                            </div>

                            {/* Note Form */}
                            {showNoteForm && (
                                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Note Title
                                            </label>
                                            <input
                                                type="text"
                                                value={noteTitle}
                                                onChange={e =>
                                                    setNoteTitle(e.target.value)
                                                }
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Enter note title"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">
                                                Note Content
                                            </label>
                                            <textarea
                                                value={noteContent}
                                                onChange={e =>
                                                    setNoteContent(
                                                        e.target.value,
                                                    )
                                                }
                                                rows={3}
                                                className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                                placeholder="Enter your notes here..."
                                            />
                                        </div>
                                        <div className="flex justify-end space-x-2">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowNoteForm(false);
                                                    setNoteTitle('');
                                                    setNoteContent('');
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                                Cancel
                                            </button>
                                            <button
                                                type="button"
                                                onClick={handleSaveNote}
                                                disabled={
                                                    createNoteMutation.isPending
                                                }
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                                                {createNoteMutation.isPending ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <>
                                                        <Save className="h-4 w-4 mr-1" />
                                                        Save Note
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="mt-6 flex items-center justify-between">
                                <button
                                    type="button"
                                    onClick={goToPrevious}
                                    disabled={currentContentIndex === 0}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </button>

                                <span className="text-sm text-gray-500">
                                    {currentContentIndex + 1} /{' '}
                                    {course.content?.length || 0}
                                </span>

                                <button
                                    type="button"
                                    onClick={goToNext}
                                    disabled={
                                        currentContentIndex ===
                                        (course.content?.length || 0) - 1
                                    }
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    Next
                                    <ChevronRight className="h-4 w-4 ml-1" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Course Content List */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                Course Content
                            </h3>
                        </div>
                        <div className="p-4">
                            {course.content && course.content.length > 0 ? (
                                <div className="space-y-2">
                                    {course.content.map((content, index) => (
                                        <button
                                            type="button"
                                            key={content.id}
                                            onClick={() =>
                                                setCurrentContentIndex(index)
                                            }
                                            className={`w-full text-left p-3 rounded-lg transition-colors ${
                                                index === currentContentIndex
                                                    ? 'bg-indigo-50 border border-indigo-200'
                                                    : 'hover:bg-gray-50'
                                            }`}>
                                            <div className="flex items-center">
                                                {index ===
                                                currentContentIndex ? (
                                                    <CheckCircle className="h-5 w-5 text-indigo-600 mr-3" />
                                                ) : (
                                                    <Circle className="h-5 w-5 text-gray-400 mr-3" />
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">
                                                        {content.title}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {content.type ===
                                                        'video'
                                                            ? 'Video'
                                                            : content.type ===
                                                              'presentation'
                                                            ? 'Presentation'
                                                            : 'Content'}
                                                        {content.duration &&
                                                            ` • ${content.duration} min`}
                                                    </p>
                                                    {courseProgress && (
                                                        <div className="mt-2">
                                                            {(() => {
                                                                const progress =
                                                                    courseProgress.content_progress.find(
                                                                        p =>
                                                                            p.content_id ===
                                                                            content.id,
                                                                    );
                                                                if (
                                                                    progress &&
                                                                    progress.progress_percentage >
                                                                        0
                                                                ) {
                                                                    return (
                                                                        <ProgressBar
                                                                            progress={
                                                                                progress.progress_percentage
                                                                            }
                                                                            size="sm"
                                                                            showPercentage={
                                                                                false
                                                                            }
                                                                        />
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No content available for this course.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="bg-white rounded-lg shadow">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="text-lg font-medium text-gray-900">
                                My Notes
                            </h3>
                        </div>
                        <div className="p-4">
                            {notes && notes.length > 0 ? (
                                <div className="space-y-3">
                                    {notes.map(note => (
                                        <div
                                            key={note.id}
                                            className="border-l-4 border-indigo-200 pl-3">
                                            <h4 className="text-sm font-medium text-gray-900">
                                                {note.title}
                                            </h4>
                                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                                {note.content}
                                            </p>
                                            <p className="text-xs text-gray-400 mt-1">
                                                {new Date(
                                                    note.created_at,
                                                ).toLocaleDateString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 text-center py-4">
                                    No notes yet. Add your first note above!
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CourseViewer;
