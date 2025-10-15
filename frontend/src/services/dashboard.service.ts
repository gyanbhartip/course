/**
 * Dashboard service
 * Handles dashboard and analytics data
 */

import { apiGet } from './api';
import type { DashboardStats, CourseProgressSummary } from '../src/types';

/**
 * Get user dashboard statistics
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
    return apiGet<DashboardStats>('/dashboard/stats');
};

/**
 * Get user progress analytics
 */
export const getProgressAnalytics = async (): Promise<any> => {
    return apiGet<any>('/dashboard/progress');
};

/**
 * Get course performance analytics
 */
export const getCoursePerformance = async (): Promise<any> => {
    return apiGet<any>('/dashboard/courses');
};

/**
 * Get content engagement analytics
 */
export const getContentEngagement = async (): Promise<any> => {
    return apiGet<any>('/dashboard/engagement');
};

/**
 * Get course progress summary
 */
export const getCourseProgress = async (
    courseId: string,
): Promise<CourseProgressSummary> => {
    return apiGet<CourseProgressSummary>(`/progress/course/${courseId}`);
};
