/**
 * NotesList Component
 * Displays all user notes with search and filter functionality
 * Updated to use real API data with full CRUD operations
 */

import {
    BookOpen,
    Calendar,
    Edit,
    FileText,
    Filter,
    Search,
    Trash2,
} from 'lucide-react';
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import EmptyState from '../components/EmptyState';
import ErrorMessage from '../components/ErrorMessage';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../contexts/AuthContext';
import { useCourses } from '../hooks/useCourses';
import { useDeleteNote, useNotes, useUpdateNote } from '../hooks/useNotes';
import type { Note } from '../types';

const NotesList: React.FC = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    // Fetch notes and courses from API
    const {
        data: notes,
        isLoading: notesLoading,
        error: notesError,
    } = useNotes({
        search: searchTerm || undefined,
        course_id: selectedCourse === 'all' ? undefined : selectedCourse,
    });
    const { data: coursesData } = useCourses();
    const updateNoteMutation = useUpdateNote();
    const deleteNoteMutation = useDeleteNote();

    const courses = coursesData?.courses || [];
    const filteredNotes = notes || [];

    // Get course name by ID
    const getCourseName = (courseId: string) => {
        const course = courses.find(c => c.id === courseId);
        return course ? course.title : 'Unknown Course';
    };

    // Handle note deletion
    const handleDeleteNote = async (noteId: string) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            try {
                await deleteNoteMutation.mutateAsync(noteId);
            } catch (error) {
                console.error('Failed to delete note:', error);
            }
        }
    };

    // Handle note editing
    const handleEditNote = (note: Note) => {
        setEditingNote(note);
        setEditTitle(note.title);
        setEditContent(note.content);
    };

    // Save edited note
    const handleSaveEdit = async () => {
        if (editingNote && editTitle.trim() && editContent.trim()) {
            try {
                await updateNoteMutation.mutateAsync({
                    noteId: editingNote.id,
                    noteData: {
                        title: editTitle,
                        content: editContent,
                    },
                });
                setEditingNote(null);
                setEditTitle('');
                setEditContent('');
            } catch (error) {
                console.error('Failed to update note:', error);
            }
        }
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingNote(null);
        setEditTitle('');
        setEditContent('');
    };

    if (!user) return null;

    // Show loading state
    if (notesLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" text="Loading notes..." />
            </div>
        );
    }

    // Show error state
    if (notesError) {
        return (
            <div className="space-y-6">
                <ErrorMessage
                    title="Error loading notes"
                    message="There was a problem loading your notes. Please try again."
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        My Notes
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {filteredNotes.length} note
                        {filteredNotes.length !== 1 ? 's' : ''} across{' '}
                        {new Set(filteredNotes.map(n => n.course_id)).size}{' '}
                        course
                        {new Set(filteredNotes.map(n => n.course_id)).size !== 1
                            ? 's'
                            : ''}
                    </p>
                </div>
            </div>

            {/* Search and Filter */}
            <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Search */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                            placeholder="Search notes..."
                        />
                    </div>

                    {/* Course Filter */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Filter className="h-5 w-5 text-gray-400" />
                        </div>
                        <select
                            value={selectedCourse}
                            onChange={e => setSelectedCourse(e.target.value)}
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm appearance-none">
                            <option value="all">All Courses</option>
                            {courses.map(course => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Notes List */}
            {filteredNotes.length > 0 ? (
                <div className="space-y-4">
                    {filteredNotes.map(note => (
                        <div
                            key={note.id}
                            className="bg-white rounded-lg shadow p-6">
                            {editingNote?.id === note.id ? (
                                /* Edit Mode */
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Note Title
                                        </label>
                                        <input
                                            type="text"
                                            value={editTitle}
                                            onChange={e =>
                                                setEditTitle(e.target.value)
                                            }
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">
                                            Note Content
                                        </label>
                                        <textarea
                                            value={editContent}
                                            onChange={e =>
                                                setEditContent(e.target.value)
                                            }
                                            rows={4}
                                            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                        />
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <button
                                            onClick={handleCancelEdit}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSaveEdit}
                                            disabled={
                                                updateNoteMutation.isPending
                                            }
                                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                                            {updateNoteMutation.isPending ? (
                                                <LoadingSpinner size="sm" />
                                            ) : (
                                                'Save Changes'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <div>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                                {note.title}
                                            </h3>
                                            <p className="text-gray-600 mb-4 whitespace-pre-wrap">
                                                {note.content}
                                            </p>
                                            <div className="flex items-center text-sm text-gray-500">
                                                <BookOpen className="h-4 w-4 mr-1" />
                                                <Link
                                                    to={`/course/${note.course_id}`}
                                                    className="hover:text-indigo-600">
                                                    {getCourseName(
                                                        note.course_id,
                                                    )}
                                                </Link>
                                                <Calendar className="h-4 w-4 ml-4 mr-1" />
                                                <span>
                                                    Created{' '}
                                                    {new Date(
                                                        note.created_at,
                                                    ).toLocaleDateString()}
                                                    {note.updated_at &&
                                                        note.updated_at !==
                                                            note.created_at && (
                                                            <span>
                                                                {' '}
                                                                • Updated{' '}
                                                                {new Date(
                                                                    note.updated_at,
                                                                ).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2 ml-4">
                                            <button
                                                onClick={() =>
                                                    handleEditNote(note)
                                                }
                                                className="p-2 text-gray-400 hover:text-indigo-600 transition-colors"
                                                title="Edit note">
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() =>
                                                    handleDeleteNote(note.id)
                                                }
                                                disabled={
                                                    deleteNoteMutation.isPending
                                                }
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                                                title="Delete note">
                                                {deleteNoteMutation.isPending ? (
                                                    <LoadingSpinner size="sm" />
                                                ) : (
                                                    <Trash2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <EmptyState
                    icon={FileText}
                    title={
                        searchTerm || selectedCourse !== 'all'
                            ? 'No notes found'
                            : 'No notes yet'
                    }
                    description={
                        searchTerm || selectedCourse !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'Start taking notes while learning to see them here'
                    }
                    action={
                        searchTerm || selectedCourse !== 'all'
                            ? {
                                  label: 'Clear Filters',
                                  onClick: () => {
                                      setSearchTerm('');
                                      setSelectedCourse('all');
                                  },
                              }
                            : {
                                  label: 'Start Learning',
                                  onClick: () =>
                                      (window.location.href = '/courses'),
                              }
                    }
                />
            )}
        </div>
    );
};

export default NotesList;
