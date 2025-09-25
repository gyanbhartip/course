/**
 * Main App Component
 * Sets up routing and authentication for the Course Management App
 */

import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import Layout from './src/components/Layout';
import Login from './src/components/Login';
import Dashboard from './src/components/Dashboard';
import CourseList from './src/components/CourseList';
import CourseViewer from './src/components/CourseViewer';
import NotesList from './src/components/NotesList';
import AdminPanel from './src/components/AdminPanel';

// Protected Route component
const ProtectedRoute: React.FC<{
    children: React.ReactNode;
    adminOnly?: boolean;
}> = ({ children, adminOnly = false }) => {
    const { isAuthenticated, user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (adminOnly && user?.role !== 'admin') {
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
            <AuthProvider>
                <Router>
                    <AppRoutes />
                </Router>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;
