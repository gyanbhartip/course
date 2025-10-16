/**
 * Authentication Context
 * Provides authentication state and methods throughout the application
 * Updated to use real API with JWT token management
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    createContext,
    useContext,
    useEffect,
    useState,
    type PropsWithChildren,
} from 'react';
import {
    isAuthenticated as checkAuth,
    clearTokens,
    setTokens,
} from '../services/api';
import {
    getCurrentUser,
    login as loginAPI,
    register as registerAPI,
} from '../services/auth.service';
import type { AuthContextType, Token, User, UserLogin } from '../types';

// Create the authentication context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// AuthProvider component to wrap the application
export const AuthProvider = ({ children }: PropsWithChildren) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const queryClient = useQueryClient();

    // Track authentication state more reliably
    const [hasValidToken, setHasValidToken] = useState(() => checkAuth());

    // Update token validity when tokens change
    useEffect(() => {
        const updateTokenValidity = () => {
            setHasValidToken(checkAuth());
        };

        // Listen for storage changes (when tokens are updated/cleared)
        window.addEventListener('storage', updateTokenValidity);

        // Also check on mount
        updateTokenValidity();

        return () => {
            window.removeEventListener('storage', updateTokenValidity);
        };
    }, []);

    // Query to get current user if authenticated
    const {
        data: currentUser,
        isLoading: userLoading,
        error,
    } = useQuery({
        queryKey: ['auth', 'me'],
        queryFn: getCurrentUser,
        enabled: hasValidToken,
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

    // Listen for auth logout events from API interceptor
    useEffect(() => {
        const handleAuthLogout = () => {
            console.log('Auth logout event received, clearing user state');
            setUser(null);
            clearTokens();
            setHasValidToken(false);
            queryClient.clear();
        };

        window.addEventListener('auth:logout', handleAuthLogout);
        return () => {
            window.removeEventListener('auth:logout', handleAuthLogout);
        };
    }, [queryClient]);

    // Login mutation
    const loginMutation = useMutation({
        mutationFn: async (credentials: UserLogin): Promise<Token> => {
            return loginAPI(credentials);
        },
        onSuccess: async (tokens: Token) => {
            // Store tokens
            setTokens(tokens);
            setHasValidToken(true);
            // Get current user immediately after login
            try {
                const user = await getCurrentUser();
                setUser(user);
            } catch (error) {
                console.error('Failed to get current user after login:', error);
            }
            // Invalidate and refetch current user
            queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
        },
        onError: () => {
            // Clear any existing tokens on login failure
            clearTokens();
        },
    });

    // Register mutation
    const registerMutation = useMutation({
        mutationFn: async (userData: {
            name: string;
            email: string;
            password: string;
        }): Promise<{ user: User; password: string }> => {
            const user = await registerAPI(userData);
            return { user, password: userData.password };
        },
        onSuccess: async ({ user, password }) => {
            // After successful registration, automatically log the user in
            try {
                // Login with the same credentials to get tokens
                const tokens = await loginAPI({
                    email: user.email,
                    password: password,
                });
                // Store tokens
                setTokens(tokens);
                setHasValidToken(true);
                // Set user and invalidate queries
                setUser(user);
                queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            } catch (loginError) {
                console.error(
                    'Auto-login after registration failed:',
                    loginError,
                );
                // If auto-login fails, still set the user but without tokens
                setUser(user);
                queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            }
        },
        onError: () => {
            // Clear any existing tokens on registration failure
            clearTokens();
        },
    });

    // Invitation registration mutation
    const invitationRegisterMutation = useMutation({
        mutationFn: async (data: {
            token: string;
            name: string;
            password: string;
        }): Promise<{ user: User; password: string }> => {
            const user = await registerWithInvitation(data.token, {
                name: data.name,
                password: data.password,
            });
            return { user, password: data.password };
        },
        onSuccess: async ({ user, password }) => {
            // After successful registration, automatically log the user in
            try {
                // Login with the same credentials to get tokens
                const tokens = await loginAPI({
                    email: user.email,
                    password: password,
                });
                // Store tokens
                setTokens(tokens);
                setHasValidToken(true);
                // Set user and invalidate queries
                setUser(user);
                queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            } catch (loginError) {
                console.error(
                    'Auto-login after invitation registration failed:',
                    loginError,
                );
                // If auto-login fails, still set the user but without tokens
                setUser(user);
                queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
            }
        },
        onError: () => {
            // Clear any existing tokens on registration failure
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

    // Register function
    const register = async (
        name: string,
        email: string,
        password: string,
    ): Promise<boolean> => {
        try {
            await registerMutation.mutateAsync({ name, email, password });
            return true;
        } catch (error) {
            console.error('Registration error:', error);
            return false;
        }
    };

    // Invitation registration function
    const registerWithInvitation = async (
        token: string,
        name: string,
        password: string,
    ): Promise<boolean> => {
        try {
            await invitationRegisterMutation.mutateAsync({
                token,
                name,
                password,
            });
            return true;
        } catch (error) {
            console.error('Invitation registration error:', error);
            return false;
        }
    };

    // Logout function
    const logout = () => {
        setUser(null);
        clearTokens();
        setHasValidToken(false);
        // Clear all cached data
        queryClient.clear();
    };

    // Check if user is authenticated
    const isAuthenticated = user !== null && hasValidToken;

    const value: AuthContextType = {
        user,
        login,
        register,
        registerWithInvitation,
        logout,
        isAuthenticated,
        isLoading:
            isLoading ||
            userLoading ||
            loginMutation.isPending ||
            registerMutation.isPending ||
            invitationRegisterMutation.isPending,
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
