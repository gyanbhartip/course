/**
 * Note service
 * Handles note-related API operations
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type {
    Note,
    NoteCreate,
    NoteUpdate,
    PaginationParams,
} from '../src/types';

/**
 * Get user's notes with optional filters
 */
export const getNotes = async (
    params?: PaginationParams & {
        course_id?: string;
        search?: string;
    },
): Promise<Array<Note>> => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.size) searchParams.append('size', params.size.toString());
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.course_id) searchParams.append('course_id', params.course_id);
    if (params?.search) searchParams.append('search', params.search);

    const queryString = searchParams.toString();
    const url = queryString ? `/notes?${queryString}` : '/notes';

    return apiGet<Array<Note>>(url);
};

/**
 * Get note by ID
 */
export const getNote = async (noteId: string): Promise<Note> => {
    return apiGet<Note>(`/notes/${noteId}`);
};

/**
 * Create new note
 */
export const createNote = async (noteData: NoteCreate): Promise<Note> => {
    return apiPost<Note>('/notes', noteData);
};

/**
 * Update note
 */
export const updateNote = async (
    noteId: string,
    noteData: NoteUpdate,
): Promise<Note> => {
    return apiPut<Note>(`/notes/${noteId}`, noteData);
};

/**
 * Delete note
 */
export const deleteNote = async (noteId: string): Promise<void> => {
    return apiDelete<void>(`/notes/${noteId}`);
};

/**
 * Get notes for a specific course
 */
export const getCourseNotes = async (
    courseId: string,
): Promise<Array<Note>> => {
    return apiGet<Array<Note>>(`/notes/course/${courseId}`);
};
