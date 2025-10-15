/**
 * Axios API client configuration with interceptors
 * Handles authentication, error handling, and request/response transformation
 */

import axios, {
    type AxiosInstance,
    type AxiosRequestConfig,
    type AxiosResponse,
    AxiosError,
} from 'axios';
import type { Token, ApiError } from '../src/types';

// Get API base URL from environment variables
const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || 'http://localhost/api/v1';

// Create axios instance with default configuration
const apiClient: AxiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 seconds timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Token management utilities
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * Get stored access token
 */
export const getAccessToken = (): string | null => {
    return localStorage.getItem(TOKEN_KEY);
};

/**
 * Get stored refresh token
 */
export const getRefreshToken = (): string | null => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
};

/**
 * Store tokens in localStorage
 */
export const setTokens = (tokens: Token): void => {
    localStorage.setItem(TOKEN_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh_token);
};

/**
 * Clear stored tokens
 */
export const clearTokens = (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
    return !!getAccessToken();
};

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
    config => {
        const token = getAccessToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    },
);

// Response interceptor to handle token refresh and errors
apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        const originalRequest = error.config as AxiosRequestConfig & {
            _retry?: boolean;
        };

        // Handle 401 Unauthorized - attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            const refreshToken = getRefreshToken();
            if (refreshToken) {
                try {
                    // Attempt to refresh the token
                    const response = await axios.post(
                        `${API_BASE_URL}/auth/refresh`,
                        {
                            refresh_token: refreshToken,
                        },
                    );

                    const newTokens: Token = response.data;
                    setTokens(newTokens);

                    // Retry the original request with new token
                    if (originalRequest.headers) {
                        originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
                    }
                    return apiClient(originalRequest);
                } catch (refreshError) {
                    // Refresh failed, clear tokens and redirect to login
                    clearTokens();
                    window.location.href = '/login';
                    return Promise.reject(refreshError);
                }
            } else {
                // No refresh token, redirect to login
                clearTokens();
                window.location.href = '/login';
            }
        }

        // Handle other errors
        const apiError: ApiError = {
            detail:
                (error.response?.data as any)?.detail ||
                error.message ||
                'An error occurred',
            status_code: error.response?.status || 500,
            type: (error.response?.data as any)?.type || 'unknown_error',
        };

        return Promise.reject(apiError);
    },
);

// Utility functions for common API operations

/**
 * Generic GET request
 */
export const apiGet = async <T>(
    url: string,
    config?: AxiosRequestConfig,
): Promise<T> => {
    const response = await apiClient.get<T>(url, config);
    return response.data;
};

/**
 * Generic POST request
 */
export const apiPost = async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
): Promise<T> => {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
};

/**
 * Generic PUT request
 */
export const apiPut = async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
): Promise<T> => {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
};

/**
 * Generic PATCH request
 */
export const apiPatch = async <T>(
    url: string,
    data?: any,
    config?: AxiosRequestConfig,
): Promise<T> => {
    const response = await apiClient.patch<T>(url, data, config);
    return response.data;
};

/**
 * Generic DELETE request
 */
export const apiDelete = async <T>(
    url: string,
    config?: AxiosRequestConfig,
): Promise<T> => {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
};

/**
 * File upload with progress tracking
 */
export const apiUpload = async <T>(
    url: string,
    formData: FormData,
    onUploadProgress?: (progressEvent: any) => void,
): Promise<T> => {
    const response = await apiClient.post<T>(url, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
        onUploadProgress,
    });
    return response.data;
};

/**
 * Download file
 */
export const apiDownload = async (
    url: string,
    filename?: string,
): Promise<void> => {
    const response = await apiClient.get(url, {
        responseType: 'blob',
    });

    // Create blob link to download
    const blob = new Blob([response.data]);
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = filename || 'download';
    link.click();
    window.URL.revokeObjectURL(link.href);
};

export default apiClient;
