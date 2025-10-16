/**
 * Progress tracking service
 * Handles course progress tracking and analytics
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type {
    Progress,
    ProgressCreate,
    ProgressUpdate,
    CourseProgressSummary,
    ProgressAnalytics,
} from '../types';

/**
 * Create or update progress for a course content
 */
export const createProgress = async (
    progressData: ProgressCreate,
): Promise<Progress> => {
    return apiPost<Progress>('/progress', progressData);
};

/**
 * Update existing progress
 */
export const updateProgress = async (
    progressId: string,
    progressData: ProgressUpdate,
): Promise<Progress> => {
    return apiPut<Progress>(`/progress/${progressId}`, progressData);
};

/**
 * Get progress summary for a specific course
 */
export const getCourseProgress = async (
    courseId: string,
): Promise<CourseProgressSummary> => {
    return apiGet<CourseProgressSummary>(`/progress/course/${courseId}`);
};

/**
 * Get progress for a specific content item
 */
export const getContentProgress = async (
    contentId: string,
): Promise<Progress> => {
    return apiGet<Progress>(`/progress/content/${contentId}`);
};

/**
 * Get progress summary for all enrolled courses
 */
export const getMyProgressSummary = async (): Promise<
    Array<CourseProgressSummary>
> => {
    return apiGet<Array<CourseProgressSummary>>('/progress/my/summary');
};

/**
 * Delete progress record
 */
export const deleteProgress = async (progressId: string): Promise<void> => {
    return apiDelete<void>(`/progress/${progressId}`);
};

/**
 * Get progress analytics for dashboard
 */
export const getProgressAnalytics = async (): Promise<ProgressAnalytics> => {
    return apiGet<ProgressAnalytics>('/dashboard/analytics/progress');
};
