/**
 * Upload service
 * Handles file upload operations for course content and thumbnails
 */

import { apiUpload } from './api';

/**
 * Upload course thumbnail
 */
export const uploadThumbnail = async (
    file: File,
    onUploadProgress?: (progressEvent: any) => void,
): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiUpload<{ url: string }>(
        '/upload/thumbnail',
        formData,
        onUploadProgress,
    );
};

/**
 * Upload course content file
 */
export const uploadContent = async (
    file: File,
    onUploadProgress?: (progressEvent: any) => void,
): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    return apiUpload<{ url: string }>(
        '/upload/content',
        formData,
        onUploadProgress,
    );
};

/**
 * Upload multiple files
 */
export const uploadMultipleFiles = async (
    files: File[],
    onUploadProgress?: (progressEvent: any) => void,
): Promise<Array<{ url: string }>> => {
    const uploadPromises = files.map(file =>
        uploadContent(file, onUploadProgress),
    );
    return Promise.all(uploadPromises);
};
