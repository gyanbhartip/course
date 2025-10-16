/**
 * React Query hooks for progress tracking
 * Provides data fetching and mutations for course progress
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    createProgress,
    updateProgress,
    getCourseProgress,
    getContentProgress,
    getMyProgressSummary,
    deleteProgress,
    getProgressAnalytics,
} from '../services/progress.service';
import type { ProgressUpdate } from '../types';

// Query keys for consistent caching
export const progressKeys = {
    all: ['progress'] as const,
    course: (courseId: string) =>
        [...progressKeys.all, 'course', courseId] as const,
    content: (contentId: string) =>
        [...progressKeys.all, 'content', contentId] as const,
    summary: () => [...progressKeys.all, 'summary'] as const,
    analytics: () => [...progressKeys.all, 'analytics'] as const,
};

/**
 * Hook to fetch course progress summary
 */
export const useCourseProgress = (courseId: string) => {
    return useQuery({
        queryKey: progressKeys.course(courseId),
        queryFn: () => getCourseProgress(courseId),
        enabled: !!courseId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to fetch content progress
 */
export const useContentProgress = (contentId: string) => {
    return useQuery({
        queryKey: progressKeys.content(contentId),
        queryFn: () => getContentProgress(contentId),
        enabled: !!contentId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to fetch user's progress summary for all courses
 */
export const useProgressSummary = () => {
    return useQuery({
        queryKey: progressKeys.summary(),
        queryFn: getMyProgressSummary,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to fetch progress analytics
 */
export const useProgressAnalytics = () => {
    return useQuery({
        queryKey: progressKeys.analytics(),
        queryFn: getProgressAnalytics,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Hook to create or update progress
 */
export const useCreateProgress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createProgress,
        onSuccess: data => {
            // Update course progress cache
            queryClient.invalidateQueries({
                queryKey: progressKeys.course(data.course_id),
            });
            // Update content progress cache
            queryClient.invalidateQueries({
                queryKey: progressKeys.content(data.content_id),
            });
            // Update summary cache
            queryClient.invalidateQueries({
                queryKey: progressKeys.summary(),
            });
            // Update analytics cache
            queryClient.invalidateQueries({
                queryKey: progressKeys.analytics(),
            });
        },
    });
};

/**
 * Hook to update existing progress
 */
export const useUpdateProgress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            progressId,
            progressData,
        }: {
            progressId: string;
            progressData: ProgressUpdate;
        }) => updateProgress(progressId, progressData),
        onSuccess: data => {
            // Update course progress cache
            queryClient.invalidateQueries({
                queryKey: progressKeys.course(data.course_id),
            });
            // Update content progress cache
            queryClient.invalidateQueries({
                queryKey: progressKeys.content(data.content_id),
            });
            // Update summary cache
            queryClient.invalidateQueries({
                queryKey: progressKeys.summary(),
            });
            // Update analytics cache
            queryClient.invalidateQueries({
                queryKey: progressKeys.analytics(),
            });
        },
    });
};

/**
 * Hook to delete progress
 */
export const useDeleteProgress = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteProgress,
        onSuccess: (_, progressId) => {
            // Invalidate all progress-related queries
            queryClient.invalidateQueries({
                queryKey: progressKeys.all,
            });
        },
    });
};
