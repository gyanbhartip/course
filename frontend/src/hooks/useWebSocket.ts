/**
 * WebSocket hook for real-time features
 * Manages WebSocket connection and message subscriptions
 */

import { useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../src/contexts/AuthContext';
import wsService, {
    type WebSocketConnectionState,
} from '../services/websocket.service';
import type {
    WebSocketMessage,
    NotificationMessage,
    ProgressUpdateMessage,
} from '../src/types';

export interface UseWebSocketOptions {
    onNotification?: (message: NotificationMessage) => void;
    onProgressUpdate?: (message: ProgressUpdateMessage) => void;
    onConnectionChange?: (state: WebSocketConnectionState) => void;
    onError?: (error: Error | Event) => void;
    autoConnect?: boolean;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
    const { user, isAuthenticated } = useAuth();
    const {
        onNotification,
        onProgressUpdate,
        onConnectionChange,
        onError,
        autoConnect = true,
    } = options;

    const callbacksRef = useRef(options);

    // Update callbacks ref when options change
    useEffect(() => {
        callbacksRef.current = options;
    }, [options]);

    // Connect to WebSocket when user is authenticated
    useEffect(() => {
        if (autoConnect && isAuthenticated && user) {
            const token = localStorage.getItem('access_token');
            if (token) {
                wsService.connect(token);
            }
        } else if (!isAuthenticated) {
            wsService.disconnect();
        }

        return () => {
            // Don't disconnect on unmount, let the service manage connections
        };
    }, [isAuthenticated, user, autoConnect]);

    // Set up event listeners
    useEffect(() => {
        const handleNotification = (message: NotificationMessage) => {
            callbacksRef.current.onNotification?.(message);
        };

        const handleProgressUpdate = (message: ProgressUpdateMessage) => {
            callbacksRef.current.onProgressUpdate?.(message);
        };

        const handleConnectionChange = (state: WebSocketConnectionState) => {
            callbacksRef.current.onConnectionChange?.(state);
        };

        const handleError = (error: Error | Event) => {
            callbacksRef.current.onError?.(error);
        };

        // Add event listeners
        wsService.on('notification', handleNotification);
        wsService.on('progressUpdate', handleProgressUpdate);
        wsService.on('stateChange', handleConnectionChange);
        wsService.on('error', handleError);

        // Cleanup event listeners
        return () => {
            wsService.off('notification', handleNotification);
            wsService.off('progressUpdate', handleProgressUpdate);
            wsService.off('stateChange', handleConnectionChange);
            wsService.off('error', handleError);
        };
    }, []);

    // WebSocket service methods
    const connect = useCallback((token: string) => {
        wsService.connect(token);
    }, []);

    const disconnect = useCallback(() => {
        wsService.disconnect();
    }, []);

    const send = useCallback((message: Record<string, unknown>) => {
        wsService.send(message);
    }, []);

    const subscribeToCourse = useCallback((courseId: string) => {
        wsService.subscribeToCourse(courseId);
    }, []);

    const unsubscribeFromCourse = useCallback((courseId: string) => {
        wsService.unsubscribeFromCourse(courseId);
    }, []);

    const ping = useCallback(() => {
        wsService.ping();
    }, []);

    return {
        // Connection state
        state: wsService.getState(),
        isConnected: wsService.isConnected(),

        // Methods
        connect,
        disconnect,
        send,
        subscribeToCourse,
        unsubscribeFromCourse,
        ping,
    };
};
