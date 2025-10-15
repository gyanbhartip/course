/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 * Updated to use real API with JWT token management
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { login as loginAPI, getCurrentUser } from '../../services/auth.service';
import {
    setTokens,
    clearTokens,
    isAuthenticated as checkAuth,
} from '../../services/api';
import type { User, AuthContextType, UserLogin, Token } from '../types';

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the application
interface AuthProviderProps {
    children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();

    // Query to get current user if authenticated
    const {
        data: currentUser,
        isLoading: userLoading,
        error,
    } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: getCurrentUser,
        enabled: checkAuth(),
        retry: false,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Update user state when current user data changes
    useEffect(() => {
        if (currentUser && Object.keys(currentUser).length > 0) {
            setUser(currentUser);
        } else if (error) {
            // If there's an error getting current user, clear auth state
            setUser(null);
            clearTokens();
        }
        setIsLoading(false);
    }, [currentUser, error]);

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async (credentials: UserLogin): Promise<Token> => {
            return loginAPI(credentials);
        },
        onSuccess: (tokens: Token) => {
            // Store tokens
            setTokens(tokens);
            // Invalidate and refetch current user
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        },
        onError: () => {
            // Clear any existing tokens on login failure
            clearTokens();
        },
    });

    // Login function
    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            await loginMutation.mutateAsync({ email, password });
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        clearTokens();
        // Clear all cached data
        queryClient.clear();
    };

    // Check if user is authenticated
    const isAuthenticated = user !== null && checkAuth();

    const value: AuthContextType = {
        user,
        login,
        logout,
        isAuthenticated,
        isLoading: isLoading || userLoading || loginMutation.isPending,
    };

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
