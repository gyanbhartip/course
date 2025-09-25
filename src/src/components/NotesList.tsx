/**
 * NotesList Component
 * Displays all user notes with search and filter functionality
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { mockCourses } from '../data/mockData';
import {
    Search,
    Filter,
    Plus,
    Edit,
    Trash2,
    Calendar,
    BookOpen,
    FileText,
    X,
} from 'lucide-react';

interface Note {
    id: string;
    title: string;
    content: string;
    courseId: string;
    contentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const NotesList: React.FC = () => {
    const { user } = useAuth();
    const [notes, setNotes] = useState<Note[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCourse, setSelectedCourse] = useState<string>('all');
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editTitle, setEditTitle] = useState('');
    const [editContent, setEditContent] = useState('');

    // Load notes from localStorage
    useEffect(() => {
        if (user) {
            const allNotes: Note[] = [];
            mockCourses.forEach(course => {
                const courseNotes = localStorage.getItem(
                    `notes_${course.id}_${user.id}`,
                );
                if (courseNotes) {
                    const parsedNotes = JSON.parse(courseNotes).map(
                        (note: any) => ({
                            ...note,
                            courseId: course.id,
                            createdAt: new Date(note.createdAt),
                            updatedAt: new Date(note.updatedAt),
                        }),
                    );
                    allNotes.push(...parsedNotes);
                }
            });
            setNotes(allNotes);
        }
    }, [user]);

    // Filter notes based on search and course selection
    const filteredNotes = notes.filter(note => {
        const matchesSearch =
            note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            note.content.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCourse =
            selectedCourse === 'all' || note.courseId === selectedCourse;
        return matchesSearch && matchesCourse;
    });

    // Get course name by ID
    const getCourseName = (courseId: string) => {
        const course = mockCourses.find(c => c.id === courseId);
        return course ? course.title : 'Unknown Course';
    };

    // Handle note deletion
    const handleDeleteNote = (noteId: string, courseId: string) => {
        if (window.confirm('Are you sure you want to delete this note?')) {
            const courseNotes = localStorage.getItem(
                `notes_${courseId}_${user?.id}`,
            );
            if (courseNotes) {
                const parsedNotes = JSON.parse(courseNotes);
                const updatedNotes = parsedNotes.filter(
                    (note: any) => note.id !== noteId,
                );
                localStorage.setItem(
                    `notes_${courseId}_${user?.id}`,
                    JSON.stringify(updatedNotes),
                );

                // Update local state
                setNotes(notes.filter(note => note.id !== noteId));
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
    const handleSaveEdit = () => {
        if (editingNote && editTitle.trim() && editContent.trim()) {
            const courseNotes = localStorage.getItem(
                `notes_${editingNote.courseId}_${user?.id}`,
            );
            if (courseNotes) {
                const parsedNotes = JSON.parse(courseNotes);
                const updatedNotes = parsedNotes.map((note: any) =>
                    note.id === editingNote.id
                        ? {
                              ...note,
                              title: editTitle,
                              content: editContent,
                              updatedAt: new Date(),
                          }
                        : note,
                );
                localStorage.setItem(
                    `notes_${editingNote.courseId}_${user?.id}`,
                    JSON.stringify(updatedNotes),
                );

                // Update local state
                setNotes(
                    notes.map(note =>
                        note.id === editingNote.id
                            ? {
                                  ...note,
                                  title: editTitle,
                                  content: editContent,
                                  updatedAt: new Date(),
                              }
                            : note,
                    ),
                );
            }

            setEditingNote(null);
            setEditTitle('');
            setEditContent('');
        }
    };

    // Cancel editing
    const handleCancelEdit = () => {
        setEditingNote(null);
        setEditTitle('');
        setEditContent('');
    };

    if (!user) return null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        My Notes
                    </h1>
                    <p className="mt-1 text-sm text-gray-500">
                        {notes.length} note{notes.length !== 1 ? 's' : ''}{' '}
                        across {new Set(notes.map(n => n.courseId)).size} course
                        {new Set(notes.map(n => n.courseId)).size !== 1
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
                            {mockCourses.map(course => (
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
                                            className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                                            Save Changes
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
                                                    to={`/course/${note.courseId}`}
                                                    className="hover:text-indigo-600">
                                                    {getCourseName(
                                                        note.courseId,
                                                    )}
                                                </Link>
                                                <Calendar className="h-4 w-4 ml-4 mr-1" />
                                                <span>
                                                    Created{' '}
                                                    {new Date(
                                                        note.createdAt,
                                                    ).toLocaleDateString()}
                                                    {note.updatedAt.getTime() !==
                                                        note.createdAt.getTime() && (
                                                        <span>
                                                            {' '}
                                                            • Updated{' '}
                                                            {new Date(
                                                                note.updatedAt,
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
                                                    handleDeleteNote(
                                                        note.id,
                                                        note.courseId,
                                                    )
                                                }
                                                className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                                title="Delete note">
                                                <Trash2 className="h-4 w-4" />
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
                <div className="text-center py-12">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">
                        {searchTerm || selectedCourse !== 'all'
                            ? 'No notes found'
                            : 'No notes yet'}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                        {searchTerm || selectedCourse !== 'all'
                            ? 'Try adjusting your search or filter criteria'
                            : 'Start taking notes while learning to see them here'}
                    </p>
                    {searchTerm || selectedCourse !== 'all' ? (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setSelectedCourse('all');
                            }}
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200">
                            <X className="h-4 w-4 mr-1" />
                            Clear Filters
                        </button>
                    ) : (
                        <Link
                            to="/courses"
                            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200">
                            <Plus className="h-4 w-4 mr-1" />
                            Start Learning
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotesList;
