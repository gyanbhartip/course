/**
 * Main App Component
 * Sets up routing and authentication for the Course Management App
 */

import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Register from './components/Register';
import InviteRegister from './components/InviteRegister';
import ProfileCompletion from './components/ProfileCompletion';
import Dashboard from './components/Dashboard';
import CourseList from './components/CourseList';
import CourseViewer from './components/CourseViewer';
import NotesList from './components/NotesList';
import AdminPanel from './components/AdminPanel';
import Analytics from './components/Analytics';

// Protected Route component
const ProtectedRoute: React.FC<{
    children: React.ReactNode;
    adminOnly?: boolean;
}> = ({ children, adminOnly = false }) => {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (import.meta.env.NODE_ENV === 'development') {
        // Debug logging for authentication state changes
        React.useEffect(() => {
            console.log('ProtectedRoute - Auth state changed:', {
                isAuthenticated,
                isLoading,
                userRole: user?.role,
                adminOnly,
            });
        }, [isAuthenticated, isLoading, user?.role, adminOnly]);
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        console.log(
            'ProtectedRoute - User not authenticated, redirecting to login',
        );
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user?.role !== 'admin') {
        console.log(
            'ProtectedRoute - User not admin, redirecting to dashboard',
        );
        return <Navigate to="/dashboard" replace />;
    }

    return <Layout>{children}</Layout>;
};

// Main App Routes
const AppRoutes: React.FC = () => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    return (
        <Routes>
            {/* Public Routes */}
            <Route
                path="/login"
                element={
                    isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <Login />
                    )
                }
            />

            <Route
                path="/register"
                element={
                    isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <Register />
                    )
                }
            />

            <Route
                path="/register/invite/:token"
                element={
                    isAuthenticated ? (
                        <Navigate to="/dashboard" replace />
                    ) : (
                        <InviteRegister />
                    )
                }
            />

            <Route
                path="/profile/complete"
                element={
                    isAuthenticated ? (
                        <ProfileCompletion />
                    ) : (
                        <Navigate to="/login" replace />
                    )
                }
            />

            {/* Protected Routes */}
            <Route
                path="/dashboard"
                element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/courses"
                element={
                    <ProtectedRoute>
                        <CourseList />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/course/:courseId"
                element={
                    <ProtectedRoute>
                        <CourseViewer />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/notes"
                element={
                    <ProtectedRoute>
                        <NotesList />
                    </ProtectedRoute>
                }
            />

            <Route
                path="/analytics"
                element={
                    <ProtectedRoute>
                        <Analytics />
                    </ProtectedRoute>
                }
            />

            {/* Admin Only Routes */}
            <Route
                path="/admin"
                element={
                    <ProtectedRoute adminOnly>
                        <AdminPanel />
                    </ProtectedRoute>
                }
            />

            {/* Default redirect */}
            <Route
                path="/"
                element={
                    <Navigate
                        to={isAuthenticated ? '/dashboard' : '/login'}
                        replace
                    />
                }
            />

            {/* 404 fallback */}
            <Route
                path="*"
                element={
                    <Navigate
                        to={isAuthenticated ? '/dashboard' : '/login'}
                        replace
                    />
                }
            />
        </Routes>
    );
};

// Main App Component
function App() {
    return (
        <ThemeProvider>
            <Router>
                <AppRoutes />
            </Router>
        </ThemeProvider>
    );
}

export default App;
