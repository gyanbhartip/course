/**
 * Custom hooks for dashboard data fetching
 * Uses React Query for caching and state management
 */

import { useQuery } from '@tanstack/react-query';
import {
    getDashboardStats,
    getProgressAnalytics,
    getCoursePerformance,
    getContentEngagement,
    getCourseProgress,
} from '../services/dashboard.service';
import type { DashboardStats, CourseProgressSummary } from '../src/types';

// Query keys for consistent caching
export const dashboardKeys = {
    all: ['dashboard'] as const,
    stats: () => [...dashboardKeys.all, 'stats'] as const,
    progress: () => [...dashboardKeys.all, 'progress'] as const,
    performance: () => [...dashboardKeys.all, 'performance'] as const,
    engagement: () => [...dashboardKeys.all, 'engagement'] as const,
    courseProgress: (courseId: string) =>
        [...dashboardKeys.all, 'course-progress', courseId] as const,
};

/**
 * Hook to fetch dashboard statistics
 */
export const useDashboardStats = () => {
    return useQuery({
        queryKey: dashboardKeys.stats(),
        queryFn: getDashboardStats,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Hook to fetch progress analytics
 */
export const useProgressAnalytics = () => {
    return useQuery({
        queryKey: dashboardKeys.progress(),
        queryFn: getProgressAnalytics,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Hook to fetch course performance analytics
 */
export const useCoursePerformance = () => {
    return useQuery({
        queryKey: dashboardKeys.performance(),
        queryFn: getCoursePerformance,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Hook to fetch content engagement analytics
 */
export const useContentEngagement = () => {
    return useQuery({
        queryKey: dashboardKeys.engagement(),
        queryFn: getContentEngagement,
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Hook to fetch course progress summary
 */
export const useCourseProgress = (courseId: string) => {
    return useQuery({
        queryKey: dashboardKeys.courseProgress(courseId),
        queryFn: () => getCourseProgress(courseId),
        enabled: !!courseId,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};
