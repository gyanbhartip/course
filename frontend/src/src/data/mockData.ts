/**
 * Mock data for the Course Management App
 * Provides sample data for development and testing
 */

import type { User, Course, Note } from '../types';

// Mock users for authentication
export const mockUsers: User[] = [
    {
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
        role: 'user',
        subscribedCourses: ['1', '2'],
        createdAt: new Date('2024-01-15'),
    },
    {
        id: '2',
        email: 'admin@example.com',
        name: 'Admin User',
        role: 'admin',
        subscribedCourses: ['1', '2', '3'],
        createdAt: new Date('2024-01-01'),
    },
];

// Mock courses with content
export const mockCourses: Course[] = [
    {
        id: '1',
        title: 'React Fundamentals',
        description:
            'Learn the basics of React including components, state, and props.',
        instructor: 'Jane Smith',
        thumbnail: '/api/placeholder/400/300',
        duration: 120,
        difficulty: 'beginner',
        category: 'Web Development',
        createdAt: new Date('2024-01-10'),
        updatedAt: new Date('2024-01-15'),
        content: [
            {
                id: '1-1',
                type: 'video',
                title: 'Introduction to React',
                description: 'Overview of React and its core concepts',
                url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
                duration: 15,
                order: 1,
            },
            {
                id: '1-2',
                type: 'presentation',
                title: 'Components and JSX',
                description: 'Understanding React components and JSX syntax',
                url: '/api/placeholder/presentation/1',
                order: 2,
            },
            {
                id: '1-3',
                type: 'video',
                title: 'State and Props',
                description: 'Managing component state and passing props',
                url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4',
                duration: 20,
                order: 3,
            },
        ],
    },
    {
        id: '2',
        title: 'Advanced JavaScript',
        description:
            'Deep dive into advanced JavaScript concepts and patterns.',
        instructor: 'Mike Johnson',
        thumbnail: '/api/placeholder/400/300',
        duration: 180,
        difficulty: 'intermediate',
        category: 'Programming',
        createdAt: new Date('2024-01-12'),
        updatedAt: new Date('2024-01-18'),
        content: [
            {
                id: '2-1',
                type: 'presentation',
                title: 'Closures and Scope',
                description:
                    'Understanding JavaScript closures and lexical scope',
                url: '/api/placeholder/presentation/2',
                order: 1,
            },
            {
                id: '2-2',
                type: 'video',
                title: 'Async Programming',
                description: 'Promises, async/await, and asynchronous patterns',
                url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_5mb.mp4',
                duration: 25,
                order: 2,
            },
        ],
    },
    {
        id: '3',
        title: 'Machine Learning Basics',
        description:
            'Introduction to machine learning concepts and algorithms.',
        instructor: 'Dr. Sarah Wilson',
        thumbnail: '/api/placeholder/400/300',
        duration: 240,
        difficulty: 'advanced',
        category: 'Data Science',
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-25'),
        content: [
            {
                id: '3-1',
                type: 'presentation',
                title: 'Introduction to ML',
                description:
                    'Overview of machine learning and its applications',
                url: '/api/placeholder/presentation/3',
                order: 1,
            },
            {
                id: '3-2',
                type: 'video',
                title: 'Linear Regression',
                description: 'Understanding and implementing linear regression',
                url: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_10mb.mp4',
                duration: 30,
                order: 2,
            },
        ],
    },
];

// Mock notes for users
export const mockNotes: Note[] = [
    {
        id: '1',
        userId: '1',
        courseId: '1',
        contentId: '1-1',
        title: 'React Key Concepts',
        content:
            'React uses a virtual DOM for efficient updates. Components are reusable pieces of UI.',
        createdAt: new Date('2024-01-16'),
        updatedAt: new Date('2024-01-16'),
    },
    {
        id: '2',
        userId: '1',
        courseId: '1',
        contentId: '1-3',
        title: 'State Management Notes',
        content:
            'useState hook is used for local component state. Props are passed down from parent components.',
        createdAt: new Date('2024-01-17'),
        updatedAt: new Date('2024-01-17'),
    },
    {
        id: '3',
        userId: '1',
        courseId: '2',
        title: 'JavaScript Closures',
        content:
            'Closures allow functions to access variables from their outer scope even after the outer function returns.',
        createdAt: new Date('2024-01-18'),
        updatedAt: new Date('2024-01-18'),
    },
];

// Helper function to get user by email (for authentication)
export const getUserByEmail = (email: string): User | undefined => {
    return mockUsers.find(user => user.email === email);
};

// Helper function to get courses by user subscription
export const getSubscribedCourses = (userId: string): Course[] => {
    const user = mockUsers.find(u => u.id === userId);
    if (!user) return [];

    return mockCourses.filter(course =>
        user.subscribedCourses.includes(course.id),
    );
};

// Helper function to get notes by user and course
export const getNotesByUserAndCourse = (
    userId: string,
    courseId: string,
): Note[] => {
    return mockNotes.filter(
        note => note.userId === userId && note.courseId === courseId,
    );
};

// Helper function to get all notes by user
export const getNotesByUser = (userId: string): Note[] => {
    return mockNotes.filter(note => note.userId === userId);
};
