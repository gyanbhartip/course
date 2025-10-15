/**
 * TypeScript interfaces for the Course Management App
 * Defines the data structures used throughout the application
 * Updated to match backend Pydantic schemas
 */

// ===== CORE TYPES =====

// UUID type for consistent ID handling
export type UUID = string;

// User role enum
export type UserRole = 'user' | 'admin';

// Course difficulty levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Course status
export type CourseStatus = 'draft' | 'published' | 'archived';

// Content types
export type ContentType = 'video' | 'presentation' | 'document' | 'quiz';

// ===== USER TYPES =====

// User interface for authentication and user management
export interface User {
    id: UUID;
    email: string;
    name: string;
    role: UserRole;
    profile_picture_url?: string;
    is_active: boolean;
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
}

// User creation data
export interface UserCreate {
    email: string;
    name: string;
    password: string;
}

// User login data
export interface UserLogin {
    email: string;
    password: string;
}

// User update data
export interface UserUpdate {
    name?: string;
    profile_picture_url?: string;
}

// ===== AUTHENTICATION TYPES =====

// Token response from login
export interface Token {
    access_token: string;
    refresh_token: string;
    token_type: string;
}

// Authentication context type
export interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

// ===== COURSE TYPES =====

// Course interface for course management
export interface Course {
    id: UUID;
    title: string;
    description?: string;
    instructor: string;
    difficulty: DifficultyLevel;
    category?: string;
    thumbnail_url?: string;
    duration?: number; // in minutes
    status: CourseStatus;
    created_by: UUID;
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
}

// Course creation data
export interface CourseCreate {
    title: string;
    description?: string;
    instructor: string;
    difficulty: DifficultyLevel;
    category?: string;
    thumbnail_url?: string;
    duration?: number;
}

// Course update data
export interface CourseUpdate {
    title?: string;
    description?: string;
    instructor?: string;
    thumbnail_url?: string;
    duration?: number;
    difficulty?: DifficultyLevel;
    category?: string;
    status?: CourseStatus;
}

// Course list response with pagination
export interface CourseListResponse {
    courses: Array<Course>;
    total: number;
    page: number;
    size: number;
    pages: number;
}

// ===== ENROLLMENT TYPES =====

// Enrollment interface
export interface Enrollment {
    id: UUID;
    user_id: UUID;
    course_id: UUID;
    enrolled_at: string; // ISO date string
    last_accessed_at?: string; // ISO date string
}

// Enrollment with course details
export interface EnrollmentWithCourse extends Enrollment {
    course: Course;
}

// ===== NOTE TYPES =====

// Note interface for user notes
export interface Note {
    id: UUID;
    user_id: UUID;
    course_id: UUID;
    content_id?: UUID; // Optional: specific content within a course
    title: string;
    content: string;
    created_at: string; // ISO date string
    updated_at: string; // ISO date string
}

// Note creation data
export interface NoteCreate {
    title: string;
    content: string;
    course_id: UUID;
    content_id?: UUID;
}

// Note update data
export interface NoteUpdate {
    title?: string;
    content?: string;
}

// Note with course details
export interface NoteWithCourse extends Note {
    course: Course;
}

// ===== DASHBOARD TYPES =====

// Dashboard statistics
export interface DashboardStats {
    enrolled_courses: number;
    completed_courses: number;
    total_learning_time: number; // in minutes
    notes_count: number;
    current_streak: LearningStreak;
    recent_activity: Array<RecentActivity>;
}

// Learning streak information
export interface LearningStreak {
    current_streak: number;
    longest_streak: number;
    last_activity?: string; // ISO date string
}

// Recent activity item
export interface RecentActivity {
    type: string;
    description: string;
    course_title?: string;
    timestamp: string; // ISO date string
}

// ===== SEARCH TYPES =====

// Search filters
export interface SearchFilters {
    category?: string;
    difficulty?: string;
    status?: string;
    instructor?: string;
    min_duration?: number;
    max_duration?: number;
    min_rating?: number;
    tags?: Array<string>;
    content_type?: string;
    course_id?: UUID;
}

// Search request
export interface SearchRequest {
    query: string;
    filters?: SearchFilters;
    sort?: string;
    page: number;
    size: number;
}

// Course search result
export interface CourseSearchResult {
    id: UUID;
    title: string;
    description: string;
    instructor: string;
    category: string;
    difficulty: string;
    status: string;
    duration: number;
    rating: number;
    enrollment_count: number;
    thumbnail_url?: string;
    created_at: string;
    updated_at: string;
    tags: Array<string>;
    score?: number;
}

// Search response
export interface SearchResponse<T = any> {
    hits: Array<T>;
    total: number;
    page: number;
    size: number;
    max_score?: number;
}

// ===== PROGRESS TYPES (Phase 2) =====

// Progress tracking
export interface Progress {
    id?: UUID;
    user_id: UUID;
    course_id: UUID;
    content_id: UUID;
    progress_percentage: number; // 0-100
    last_position?: number; // in seconds
    completed: boolean;
    updated_at?: string; // ISO date string
}

// Progress creation data
export interface ProgressCreate {
    course_id: UUID;
    content_id: UUID;
    progress_percentage: number;
    last_position?: number;
    completed?: boolean;
}

// Progress update data
export interface ProgressUpdate {
    progress_percentage?: number;
    last_position?: number;
    completed?: boolean;
}

// Course progress summary
export interface CourseProgressSummary {
    course_id: UUID;
    course_title: string;
    total_content: number;
    completed_content: number;
    overall_progress: number; // 0-100
    content_progress: Array<ContentProgressResponse>;
}

// Content progress response
export interface ContentProgressResponse {
    content_id: UUID;
    title: string;
    type: ContentType;
    progress_percentage: number;
    completed: boolean;
    last_position?: number;
    updated_at?: string;
}

// Progress analytics
export interface ProgressAnalytics {
    total_courses_enrolled: number;
    total_content_completed: number;
    total_learning_time: number;
    average_progress: number;
    completion_rate: number;
    streak_days: number;
    last_activity: string | null;
}

// Learning activity for streak calendar
export interface LearningActivity {
    date: string;
    minutes: number;
    courses: Array<string>;
}

// ===== WEBSOCKET TYPES =====

// WebSocket message base
export interface WebSocketMessage {
    type: string;
    data?: any;
    timestamp: string;
}

// Notification message
export interface NotificationMessage extends WebSocketMessage {
    type: 'notification' | 'course_notification' | 'progress_notification';
    data: {
        title: string;
        message: string;
        level: 'info' | 'success' | 'warning' | 'error';
        action_url?: string;
    };
}

// Progress update message
export interface ProgressUpdateMessage extends WebSocketMessage {
    type: 'progress_updated';
    user_id: UUID;
    course_id: UUID;
    content_id: UUID;
    progress_percentage: number;
    completed: boolean;
}

// ===== VIDEO TYPES =====

// Video quality
export interface VideoQuality {
    name: string;
    url: string;
    height: number;
    bitrate: string;
}

// Video manifest
export interface VideoManifest {
    content_id: UUID;
    title: string;
    duration: number;
    qualities: Array<VideoQuality>;
}

// ===== API RESPONSE TYPES =====

// Generic API response wrapper
export interface ApiResponse<T = any> {
    data: T;
    message?: string;
    success: boolean;
}

// Pagination parameters
export interface PaginationParams {
    page?: number;
    size?: number;
    skip?: number;
    limit?: number;
}

// Error response
export interface ApiError {
    detail: string;
    status_code: number;
    type?: string;
}

// ===== LEGACY TYPES (for backward compatibility) =====

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
    difficulty: DifficultyLevel;
    thumbnail: File | null;
    contentFiles: File[];
}

// ===== UTILITY TYPES =====

// React component props
export interface ReactNode {
    children?: React.ReactNode;
}

// Generic list response
export interface ListResponse<T> {
    items: Array<T>;
    total: number;
    page: number;
    size: number;
    pages: number;
}
