/**
 * TypeScript interfaces for the Course Management App
 * Defines the data structures used throughout the application
 */

// User interface for authentication and user management
export interface User {
    id: string;
    email: string;
    name: string;
    role: 'user' | 'admin';
    subscribedCourses: string[]; // Array of course IDs
    createdAt: Date;
}

// Course interface for course management
export interface Course {
    id: string;
    title: string;
    description: string;
    instructor: string;
    thumbnail: string;
    content: CourseContent[];
    duration: number; // in minutes
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    category: string;
    createdAt: Date;
    updatedAt: Date;
}

// Course content can be either video or presentation
export interface CourseContent {
    id: string;
    type: 'video' | 'presentation';
    title: string;
    description: string;
    url: string; // URL to the video or presentation file
    duration?: number; // Duration in minutes (for videos)
    order: number; // Order within the course
}

// Note interface for user notes
export interface Note {
    id: string;
    userId: string;
    courseId: string;
    contentId?: string; // Optional: specific content within a course
    title: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
}

// Authentication context type
export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// Course viewer state
export interface CourseViewerState {
    currentCourse: Course | null;
    currentContentIndex: number;
    isPlaying: boolean;
    progress: number; // 0-100
}

// Admin upload form data
export interface CourseUploadData {
    title: string;
    description: string;
    instructor: string;
    category: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    thumbnail: File | null;
    contentFiles: File[];
}
