/**
 * Custom hooks for enrollment-related data fetching
 * Uses React Query for caching and state management
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    getMyEnrollments,
    enrollInCourse,
    unenrollFromCourse,
    checkEnrollmentStatus,
} from '../services/enrollment.service';

// Query keys for consistent caching
export const enrollmentKeys = {
    all: ['enrollments'] as const,
    my: () => [...enrollmentKeys.all, 'my'] as const,
    status: (courseId: string) =>
        [...enrollmentKeys.all, 'status', courseId] as const,
};

/**
 * Hook to fetch user's enrollments
 */
export const useMyEnrollments = () => {
    return useQuery({
        queryKey: enrollmentKeys.my(),
        queryFn: getMyEnrollments,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to check enrollment status for a course
 */
export const useEnrollmentStatus = (courseId: string) => {
    return useQuery({
        queryKey: enrollmentKeys.status(courseId),
        queryFn: () => checkEnrollmentStatus(courseId),
        enabled: !!courseId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to enroll in a course
 */
export const useEnrollInCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: enrollInCourse,
        onSuccess: (_, courseId) => {
            // Invalidate enrollments list
            queryClient.invalidateQueries({ queryKey: enrollmentKeys.my() });
            // Update enrollment status for this course
            queryClient.setQueryData(enrollmentKeys.status(courseId), {
                enrolled: true,
            });
            // Invalidate courses list to update enrollment counts
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
    });
};

/**
 * Hook to unenroll from a course
 */
export const useUnenrollFromCourse = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: unenrollFromCourse,
        onSuccess: (_, courseId) => {
            // Invalidate enrollments list
            queryClient.invalidateQueries({ queryKey: enrollmentKeys.my() });
            // Update enrollment status for this course
            queryClient.setQueryData(enrollmentKeys.status(courseId), {
                enrolled: false,
            });
            // Invalidate courses list to update enrollment counts
            queryClient.invalidateQueries({ queryKey: ['courses'] });
        },
    });
};
