/**
 * Custom hooks for note-related data fetching
 * Uses React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getNotes,
    getNote,
    createNote,
    updateNote,
    deleteNote,
    getCourseNotes,
} from '../services/note.service';
import type { NoteUpdate, PaginationParams } from '../types';

// Query keys for consistent caching
export const noteKeys = {
    all: ['notes'] as const,
    lists: () => [...noteKeys.all, 'list'] as const,
    list: (params?: PaginationParams) => [...noteKeys.lists(), params] as const,
    details: () => [...noteKeys.all, 'detail'] as const,
    detail: (id: string) => [...noteKeys.details(), id] as const,
    course: (courseId: string) =>
        [...noteKeys.all, 'course', courseId] as const,
};

/**
 * Hook to fetch user's notes with optional filters
 */
export const useNotes = (
    params?: PaginationParams & {
        course_id?: string;
        search?: string;
    },
) => {
    return useQuery({
        queryKey: noteKeys.list(params),
        queryFn: () => getNotes(params),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to fetch a single note by ID
 */
export const useNote = (noteId: string) => {
    return useQuery({
        queryKey: noteKeys.detail(noteId),
        queryFn: () => getNote(noteId),
        enabled: !!noteId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to fetch notes for a specific course
 */
export const useCourseNotes = (courseId: string) => {
    return useQuery({
        queryKey: noteKeys.course(courseId),
        queryFn: () => getCourseNotes(courseId),
        enabled: !!courseId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to create a new note
 */
export const useCreateNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createNote,
        onSuccess: data => {
            // Invalidate notes lists
            queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
            // Invalidate course notes if applicable
            if (data.course_id) {
                queryClient.invalidateQueries({
                    queryKey: noteKeys.course(data.course_id),
                });
            }
        },
    });
};

/**
 * Hook to update a note
 */
export const useUpdateNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            noteId,
            noteData,
        }: {
            noteId: string;
            noteData: NoteUpdate;
        }) => updateNote(noteId, noteData),
        onSuccess: (data, variables) => {
            // Update the specific note in cache
            queryClient.setQueryData(noteKeys.detail(variables.noteId), data);
            // Invalidate lists to refetch
            queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
            // Invalidate course notes if applicable
            if (data.course_id) {
                queryClient.invalidateQueries({
                    queryKey: noteKeys.course(data.course_id),
                });
            }
        },
    });
};

/**
 * Hook to delete a note
 */
export const useDeleteNote = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteNote,
        onSuccess: (_, noteId) => {
            // Remove the note from cache
            queryClient.removeQueries({ queryKey: noteKeys.detail(noteId) });
            // Invalidate lists to refetch
            queryClient.invalidateQueries({ queryKey: noteKeys.lists() });
            // Invalidate course notes
            queryClient.invalidateQueries({ queryKey: noteKeys.course('') });
        },
    });
};
