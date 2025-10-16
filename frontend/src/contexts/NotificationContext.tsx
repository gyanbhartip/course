/**
 * Notification Context
 * Manages real-time notifications via WebSocket
 */

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
    type FC,
    type ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import { useWebSocket } from '../hooks/useWebSocket';
import type { NotificationMessage } from '../types';

export type Notification = {
    id: string;
    title: string;
    message: string;
    level: 'info' | 'success' | 'warning' | 'error';
    action_url?: string;
    timestamp: string;
    read: boolean;
};

type NotificationContextType = {
    notifications: Array<Notification>;
    unreadCount: number;
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    clearNotification: (notificationId: string) => void;
    clearAllNotifications: () => void;
    addNotification: (
        notification: Omit<Notification, 'id' | 'timestamp' | 'read'>,
    ) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(
    undefined,
);

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: FC<NotificationProviderProps> = ({
    children,
}) => {
    const [notifications, setNotifications] = useState<Array<Notification>>([]);

    // Handle WebSocket notifications
    const handleNotification = useCallback((message: NotificationMessage) => {
        const notification: Notification = {
            id: `${Date.now()}-${Math.random()}`,
            title: message.data.title,
            message: message.data.message,
            level: message.data.level,
            action_url: message.data.action_url,
            timestamp: message.timestamp,
            read: false,
        };

        // Add to notifications list
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50

        // Show toast notification
        const toastOptions = {
            duration: 4000,
            position: 'top-right' as const,
        };

        switch (message.data.level) {
            case 'success':
                toast.success(message.data.message, toastOptions);
                break;
            case 'error':
                toast.error(message.data.message, toastOptions);
                break;
            case 'warning':
                toast(message.data.message, {
                    ...toastOptions,
                    icon: '⚠️',
                });
                break;
            default:
                toast(message.data.message, toastOptions);
        }
    }, []);

    // Set up WebSocket connection
    useWebSocket({
        onNotification: handleNotification,
        autoConnect: true,
    });

    // Load notifications from localStorage on mount
    useEffect(() => {
        const savedNotifications = localStorage.getItem('notifications');
        if (savedNotifications) {
            try {
                const parsed = JSON.parse(savedNotifications);
                setNotifications(parsed);
            } catch (error) {
                console.error('Failed to parse saved notifications:', error);
            }
        }
    }, []);

    // Save notifications to localStorage when they change
    useEffect(() => {
        localStorage.setItem('notifications', JSON.stringify(notifications));
    }, [notifications]);

    // Calculate unread count
    const unreadCount = notifications.filter(n => !n.read).length;

    // Mark notification as read
    const markAsRead = useCallback((notificationId: string) => {
        setNotifications(prev =>
            prev.map(notification =>
                notification.id === notificationId
                    ? { ...notification, read: true }
                    : notification,
            ),
        );
    }, []);

    // Mark all notifications as read
    const markAllAsRead = useCallback(() => {
        setNotifications(prev =>
            prev.map(notification => ({ ...notification, read: true })),
        );
    }, []);

    // Clear specific notification
    const clearNotification = useCallback((notificationId: string) => {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
    }, []);

    // Clear all notifications
    const clearAllNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    // Add manual notification (for testing or non-WebSocket notifications)
    const addNotification = useCallback(
        (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
            const newNotification: Notification = {
                ...notification,
                id: `${Date.now()}-${Math.random()}`,
                timestamp: new Date().toISOString(),
                read: false,
            };

            setNotifications(prev => [newNotification, ...prev.slice(0, 49)]);
        },
        [],
    );

    const value: NotificationContextType = {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
        clearAllNotifications,
        addNotification,
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = (): NotificationContextType => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error(
            'useNotifications must be used within a NotificationProvider',
        );
    }
    return context;
};
