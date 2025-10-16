/**
 * Course service
 * Handles course-related API operations
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api';
import type {
    Course,
    CourseCreate,
    CourseUpdate,
    CourseListResponse,
    PaginationParams,
} from '../types';

/**
 * Get list of published courses with pagination and filters
 */
export const getCourses = async (
    params?: PaginationParams & {
        difficulty?: string;
        category?: string;
    },
): Promise<CourseListResponse> => {
    const searchParams = new URLSearchParams();

    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.size) searchParams.append('size', params.size.toString());
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.difficulty)
        searchParams.append('difficulty', params.difficulty);
    if (params?.category) searchParams.append('category', params.category);

    const queryString = searchParams.toString();
    const url = queryString ? `/courses?${queryString}` : '/courses';

    return apiGet<CourseListResponse>(url);
};

/**
 * Get course by ID
 */
export const getCourse = async (courseId: string): Promise<Course> => {
    return apiGet<Course>(`/courses/${courseId}`);
};

/**
 * Create new course (admin only)
 */
export const createCourse = async (
    courseData: CourseCreate,
): Promise<Course> => {
    return apiPost<Course>('/courses', courseData);
};

/**
 * Update course (admin only)
 */
export const updateCourse = async (
    courseId: string,
    courseData: CourseUpdate,
): Promise<Course> => {
    return apiPut<Course>(`/courses/${courseId}`, courseData);
};

/**
 * Delete course (admin only)
 */
export const deleteCourse = async (courseId: string): Promise<void> => {
    return apiDelete<void>(`/courses/${courseId}`);
};

/**
 * Get courses created by current user
 */
export const getMyCourses = async (): Promise<Array<Course>> => {
    return apiGet<Array<Course>>('/courses/my/courses');
};
