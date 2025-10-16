/**
 * Dashboard service
 * Handles dashboard and analytics data
 */

import { apiGet } from './api';
import type {
    DashboardStats,
    CourseProgressSummary,
    UserProgressAnalytics,
    CourseAnalytics,
    ContentEngagement,
} from '../types';

/**
 * Get user dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    return apiGet<DashboardStats>('/dashboard/stats');
};

/**
 * Get user progress analytics
 */
export const getProgressAnalytics =
    async (): Promise<UserProgressAnalytics> => {
        return apiGet<UserProgressAnalytics>('/dashboard/analytics/progress');
    };

/**
 * Get course performance analytics
 */
export const getCoursePerformance = async (
    courseId: string,
): Promise<CourseAnalytics> => {
    return apiGet<CourseAnalytics>(`/dashboard/analytics/course/${courseId}`);
};

/**
 * Get content engagement analytics
 * Note: Content engagement data is included in the progress analytics endpoint
 */
export const getContentEngagement = async (): Promise<
    Array<ContentEngagement>
> => {
    // Content engagement is part of the progress analytics response
    const progressAnalytics = await getProgressAnalytics();
    return progressAnalytics.content_engagement;
};

/**
 * Get course progress summary
 */
export const getCourseProgress = async (
    courseId: string,
): Promise<CourseProgressSummary> => {
    return apiGet<CourseProgressSummary>(`/progress/course/${courseId}`);
};
