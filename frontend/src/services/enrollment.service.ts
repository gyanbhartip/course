/**
 * Enrollment service
 * Handles course enrollment operations
 */

import { apiGet, apiPost, apiDelete } from './api';
import type { Enrollment, EnrollmentWithCourse } from '../types';

/**
 * Enroll in a course
 */
export const enrollInCourse = async (courseId: string): Promise<Enrollment> => {
    return apiPost<Enrollment>(`/enrollments/${courseId}`);
};

/**
 * Unenroll from a course
 */
export const unenrollFromCourse = async (courseId: string): Promise<void> => {
    return apiDelete<void>(`/enrollments/${courseId}`);
};

/**
 * Get user's enrollments
 */
export const getMyEnrollments = async (): Promise<
    Array<EnrollmentWithCourse>
> => {
    return apiGet<Array<EnrollmentWithCourse>>('/enrollments/my');
};

/**
 * Check enrollment status for a course
 */
export const checkEnrollmentStatus = async (
    courseId: string,
): Promise<{ enrolled: boolean }> => {
    return apiGet<{ enrolled: boolean }>(`/enrollments/${courseId}/check`);
};
