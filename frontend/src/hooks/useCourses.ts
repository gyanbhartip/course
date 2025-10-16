/**
 * Custom hooks for course-related data fetching
 * Uses React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getCourses,
    getCourse,
    createCourse,
    updateCourse,
    deleteCourse,
    getMyCourses,
} from '../services/course.service';
import type { CourseUpdate, PaginationParams } from '../types';

// Query keys for consistent caching
export const courseKeys = {
    all: ['courses'] as const,
    lists: () => [...courseKeys.all, 'list'] as const,
    list: (params?: PaginationParams) =>
        [...courseKeys.lists(), params] as const,
    details: () => [...courseKeys.all, 'detail'] as const,
    detail: (id: string) => [...courseKeys.details(), id] as const,
    my: () => [...courseKeys.all, 'my'] as const,
};

/**
 * Hook to fetch courses list with pagination and filters
 */
export const useCourses = (
    params?: PaginationParams & {
        difficulty?: string;
        category?: string;
    },
) => {
    return useQuery({
        queryKey: courseKeys.list(params),
        queryFn: () => getCourses(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Hook to fetch a single course by ID
 */
export const useCourse = (courseId: string) => {
    return useQuery({
        queryKey: courseKeys.detail(courseId),
        queryFn: () => getCourse(courseId),
        enabled: !!courseId,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to fetch courses created by current user
 */
export const useMyCourses = () => {
    return useQuery({
        queryKey: courseKeys.my(),
        queryFn: getMyCourses,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to create a new course
 */
export const useCreateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createCourse,
        onSuccess: () => {
            // Invalidate and refetch courses list
            queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
            queryClient.invalidateQueries({ queryKey: courseKeys.my() });
        },
    });
};

/**
 * Hook to update a course
 */
export const useUpdateCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            courseId,
            courseData,
        }: {
            courseId: string;
            courseData: CourseUpdate;
        }) => updateCourse(courseId, courseData),
        onSuccess: (data, variables) => {
            // Update the specific course in cache
            queryClient.setQueryData(
                courseKeys.detail(variables.courseId),
                data,
            );
            // Invalidate lists to refetch
            queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
            queryClient.invalidateQueries({ queryKey: courseKeys.my() });
        },
    });
};

/**
 * Hook to delete a course
 */
export const useDeleteCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteCourse,
        onSuccess: (_, courseId) => {
            // Remove the course from cache
            queryClient.removeQueries({
                queryKey: courseKeys.detail(courseId),
            });
            // Invalidate lists to refetch
            queryClient.invalidateQueries({ queryKey: courseKeys.lists() });
            queryClient.invalidateQueries({ queryKey: courseKeys.my() });
        },
    });
};
