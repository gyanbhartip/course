/**
 * CourseViewer Component
 * Displays course content including videos and presentations
 */

import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockCourses } from '../data/mockData';
import {
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    ChevronLeft,
    ChevronRight,
    BookOpen,
    FileText,
    Clock,
    CheckCircle,
    Circle,
    Plus,
    Save,
} from 'lucide-react';

const CourseViewer: React.FC = () => {
    const { courseId } = useParams<{ courseId: string }>();
    const { user } = useAuth();
    const [currentContentIndex, setCurrentContentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [showNoteForm, setShowNoteForm] = useState(false);
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [notes, setNotes] = useState<
        Array<{ id: string; title: string; content: string; createdAt: Date }>
    >([]);

    const videoRef = useRef<HTMLVideoElement>(null);

    // Find the course
    const course = mockCourses.find(c => c.id === courseId);

    if (!course) {
        return (
            <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                    Course not found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                    The course you're looking for doesn't exist.
                </p>
                <Link
                    to="/courses"
                    className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200">
                    Back to Courses
                </Link>
            </div>
        );
    }

    const currentContent = course.content[currentContentIndex];

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
        if (currentContentIndex < course.content.length - 1) {
            setCurrentContentIndex(currentContentIndex + 1);
            setIsPlaying(false);
        }
    };

    // Note handling
    const handleSaveNote = () => {
        if (noteTitle.trim() && noteContent.trim()) {
            const newNote = {
                id: Date.now().toString(),
                title: noteTitle,
                content: noteContent,
                createdAt: new Date(),
            };
            setNotes([...notes, newNote]);
            setNoteTitle('');
            setNoteContent('');
            setShowNoteForm(false);
        }
    };

    // Load notes from localStorage on component mount
    useEffect(() => {
        const savedNotes = localStorage.getItem(
            `notes_${courseId}_${user?.id}`,
        );
        if (savedNotes) {
            setNotes(JSON.parse(savedNotes));
        }
    }, [courseId, user?.id]);

    // Save notes to localStorage whenever notes change
    useEffect(() => {
        localStorage.setItem(
            `notes_${courseId}_${user?.id}`,
            JSON.stringify(notes),
        );
    }, [notes, courseId, user?.id]);

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
                                {course.duration} min
                            </span>
                            <span className="flex items-center">
                                <BookOpen className="h-4 w-4 mr-1" />
                                {course.content.length} lessons
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
                            {currentContent.type === 'video' ? (
                                <div className="relative">
                                    <video
                                        ref={videoRef}
                                        className="w-full h-64 sm:h-80 lg:h-96"
                                        src={currentContent.url}
                                        onPlay={() => setIsPlaying(true)}
                                        onPause={() => setIsPlaying(false)}
                                        onEnded={() => setIsPlaying(false)}
                                    />

                                    {/* Video Controls Overlay */}
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={togglePlayPause}
                                                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                                    {isPlaying ? (
                                                        <Pause className="h-5 w-5 text-white" />
                                                    ) : (
                                                        <Play className="h-5 w-5 text-white" />
                                                    )}
                                                </button>
                                                <button
                                                    onClick={toggleMute}
                                                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                                    {isMuted ? (
                                                        <VolumeX className="h-5 w-5 text-white" />
                                                    ) : (
                                                        <Volume2 className="h-5 w-5 text-white" />
                                                    )}
                                                </button>
                                            </div>
                                            <button
                                                onClick={toggleFullscreen}
                                                className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors">
                                                <Maximize className="h-5 w-5 text-white" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center bg-gray-100">
                                    <div className="text-center">
                                        <FileText className="mx-auto h-16 w-16 text-gray-400" />
                                        <h3 className="mt-2 text-lg font-medium text-gray-900">
                                            Presentation
                                        </h3>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {currentContent.title}
                                        </p>
                                        <button className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                            <FileText className="h-4 w-4 mr-2" />
                                            Open Presentation
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
                                        {currentContent.title}
                                    </h2>
                                    <p className="mt-1 text-sm text-gray-500">
                                        Lesson {currentContentIndex + 1} of{' '}
                                        {course.content.length}
                                    </p>
                                    <p className="mt-2 text-gray-600">
                                        {currentContent.description}
                                    </p>
                                </div>
                                <button
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
                                                onClick={() => {
                                                    setShowNoteForm(false);
                                                    setNoteTitle('');
                                                    setNoteContent('');
                                                }}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                                Cancel
                                            </button>
                                            <button
                                                onClick={handleSaveNote}
                                                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                                <Save className="h-4 w-4 mr-1" />
                                                Save Note
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Navigation */}
                            <div className="mt-6 flex items-center justify-between">
                                <button
                                    onClick={goToPrevious}
                                    disabled={currentContentIndex === 0}
                                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <ChevronLeft className="h-4 w-4 mr-1" />
                                    Previous
                                </button>

                                <span className="text-sm text-gray-500">
                                    {currentContentIndex + 1} /{' '}
                                    {course.content.length}
                                </span>

                                <button
                                    onClick={goToNext}
                                    disabled={
                                        currentContentIndex ===
                                        course.content.length - 1
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
                            <div className="space-y-2">
                                {course.content.map((content, index) => (
                                    <button
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
                                            {index === currentContentIndex ? (
                                                <CheckCircle className="h-5 w-5 text-indigo-600 mr-3" />
                                            ) : (
                                                <Circle className="h-5 w-5 text-gray-400 mr-3" />
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">
                                                    {content.title}
                                                </p>
                                                <p className="text-xs text-gray-500">
                                                    {content.type === 'video'
                                                        ? 'Video'
                                                        : 'Presentation'}
                                                    {content.duration &&
                                                        ` • ${content.duration} min`}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                            </div>
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
                            {notes.length > 0 ? (
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
                                                    note.createdAt,
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
