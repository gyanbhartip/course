/**
 * Custom hooks for search functionality
 * Uses React Query for caching and state management
 */

import { useQuery } from '@tanstack/react-query';
import {
    searchAll,
    searchCourses,
    searchContent,
    getSearchSuggestions,
    getPopularSearches,
    getSearchAnalytics,
} from '../services/search.service';
import type {
    SearchRequest,
    SearchResponse,
    CourseSearchResult,
} from '../src/types';

// Query keys for consistent caching
export const searchKeys = {
    all: ['search'] as const,
    allResults: (request: SearchRequest) =>
        [...searchKeys.all, 'all', request] as const,
    courses: (request: SearchRequest) =>
        [...searchKeys.all, 'courses', request] as const,
    content: (request: SearchRequest) =>
        [...searchKeys.all, 'content', request] as const,
    suggestions: (query: string) =>
        [...searchKeys.all, 'suggestions', query] as const,
    popular: (limit: number) => [...searchKeys.all, 'popular', limit] as const,
    analytics: (period: string) =>
        [...searchKeys.all, 'analytics', period] as const,
};

/**
 * Hook to perform combined search (courses and content)
 */
export const useSearchAll = (request: SearchRequest) => {
    return useQuery({
        queryKey: searchKeys.allResults(request),
        queryFn: () => searchAll(request),
        enabled: !!request.query.trim(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to search courses only
 */
export const useSearchCourses = (request: SearchRequest) => {
    return useQuery({
        queryKey: searchKeys.courses(request),
        queryFn: () => searchCourses(request),
        enabled: !!request.query.trim(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to search content only
 */
export const useSearchContent = (request: SearchRequest) => {
    return useQuery({
        queryKey: searchKeys.content(request),
        queryFn: () => searchContent(request),
        enabled: !!request.query.trim(),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
};

/**
 * Hook to get search suggestions
 */
export const useSearchSuggestions = (query: string) => {
    return useQuery({
        queryKey: searchKeys.suggestions(query),
        queryFn: () => getSearchSuggestions(query),
        enabled: query.length >= 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });
};

/**
 * Hook to get popular searches
 */
export const usePopularSearches = (limit: number = 10) => {
    return useQuery({
        queryKey: searchKeys.popular(limit),
        queryFn: () => getPopularSearches(limit),
        staleTime: 10 * 60 * 1000, // 10 minutes
    });
};

/**
 * Hook to get search analytics
 */
export const useSearchAnalytics = (period: string = '7d') => {
    return useQuery({
        queryKey: searchKeys.analytics(period),
        queryFn: () => getSearchAnalytics(period),
        staleTime: 30 * 60 * 1000, // 30 minutes
    });
};
