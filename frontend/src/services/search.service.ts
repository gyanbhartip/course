/**
 * Search service
 * Handles search operations for courses and content
 */

import { apiGet } from './api';
import type {
    SearchRequest,
    SearchResponse,
    CourseSearchResult,
    SearchFilters,
} from '../src/types';

/**
 * Combined search (courses and content)
 */
export const searchAll = async (request: SearchRequest): Promise<any> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', request.query);
    searchParams.append('page', request.page.toString());
    searchParams.append('size', request.size.toString());

    if (request.filters) {
        Object.entries(request.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, v.toString()));
                } else {
                    searchParams.append(key, value.toString());
                }
            }
        });
    }

    if (request.sort) {
        searchParams.append('sort', request.sort);
    }

    return apiGet<any>(`/search?${searchParams.toString()}`);
};

/**
 * Search courses only
 */
export const searchCourses = async (
    request: SearchRequest,
): Promise<SearchResponse<CourseSearchResult>> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', request.query);
    searchParams.append('page', request.page.toString());
    searchParams.append('size', request.size.toString());

    if (request.filters) {
        Object.entries(request.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, v.toString()));
                } else {
                    searchParams.append(key, value.toString());
                }
            }
        });
    }

    if (request.sort) {
        searchParams.append('sort', request.sort);
    }

    return apiGet<SearchResponse<CourseSearchResult>>(
        `/search/courses?${searchParams.toString()}`,
    );
};

/**
 * Search content only
 */
export const searchContent = async (
    request: SearchRequest,
): Promise<SearchResponse<any>> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', request.query);
    searchParams.append('page', request.page.toString());
    searchParams.append('size', request.size.toString());

    if (request.filters) {
        Object.entries(request.filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    value.forEach(v => searchParams.append(key, v.toString()));
                } else {
                    searchParams.append(key, value.toString());
                }
            }
        });
    }

    if (request.sort) {
        searchParams.append('sort', request.sort);
    }

    return apiGet<SearchResponse<any>>(
        `/search/content?${searchParams.toString()}`,
    );
};

/**
 * Get search suggestions
 */
export const getSearchSuggestions = async (
    query: string,
): Promise<Array<string>> => {
    const searchParams = new URLSearchParams();
    searchParams.append('q', query);

    return apiGet<Array<string>>(
        `/search/suggestions?${searchParams.toString()}`,
    );
};

/**
 * Get popular searches
 */
export const getPopularSearches = async (
    limit: number = 10,
): Promise<Array<string>> => {
    const searchParams = new URLSearchParams();
    searchParams.append('limit', limit.toString());

    return apiGet<Array<string>>(`/search/popular?${searchParams.toString()}`);
};

/**
 * Get search analytics
 */
export const getSearchAnalytics = async (
    period: string = '7d',
): Promise<any> => {
    const searchParams = new URLSearchParams();
    searchParams.append('period', period);

    return apiGet<any>(`/search/analytics?${searchParams.toString()}`);
};
