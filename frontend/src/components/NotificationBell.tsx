/**
 * NotificationBell Component
 * Bell icon with unread count badge and dropdown menu
 */

import type React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, CheckCheck } from 'lucide-react';
import { useNotifications } from '../../src/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

const NotificationBell: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        clearNotification,
    } = useNotifications();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const getLevelIcon = (level: string) => {
        switch (level) {
            case 'success':
                return '✅';
            case 'error':
                return '❌';
            case 'warning':
                return '⚠️';
            default:
                return 'ℹ️';
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Icon */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full">
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    {/* Header */}
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Notifications
                            </h3>
                            <div className="flex items-center space-x-2">
                                {unreadCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={markAllAsRead}
                                        className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center">
                                        <CheckCheck className="h-4 w-4 mr-1" />
                                        Mark all read
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setIsOpen(false)}
                                    className="text-gray-400 hover:text-gray-600">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Notifications List */}
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                                <p>No notifications yet</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-200">
                                {notifications
                                    .slice(0, 10)
                                    .map((notification: any) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 hover:bg-gray-50 ${
                                                !notification.read
                                                    ? 'bg-blue-50'
                                                    : ''
                                            }`}>
                                            <div className="flex items-start space-x-3">
                                                <span className="text-lg">
                                                    {getLevelIcon(
                                                        notification.level,
                                                    )}
                                                </span>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between">
                                                        <p
                                                            className={`text-sm font-medium ${
                                                                !notification.read
                                                                    ? 'text-gray-900'
                                                                    : 'text-gray-700'
                                                            }`}>
                                                            {notification.title}
                                                        </p>
                                                        {!notification.read && (
                                                            <div className="h-2 w-2 bg-blue-500 rounded-full" />
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <div className="flex items-center justify-between mt-2">
                                                        <p className="text-xs text-gray-400">
                                                            {formatDistanceToNow(
                                                                new Date(
                                                                    notification.timestamp,
                                                                ),
                                                                {
                                                                    addSuffix:
                                                                        true,
                                                                },
                                                            )}
                                                        </p>
                                                        <div className="flex items-center space-x-2">
                                                            {!notification.read && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        markAsRead(
                                                                            notification.id,
                                                                        )
                                                                    }
                                                                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center">
                                                                    <Check className="h-3 w-3 mr-1" />
                                                                    Mark read
                                                                </button>
                                                            )}
                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    clearNotification(
                                                                        notification.id,
                                                                    )
                                                                }
                                                                className="text-xs text-gray-400 hover:text-gray-600">
                                                                <X className="h-3 w-3" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    {notifications.length > 10 && (
                        <div className="p-4 border-t border-gray-200">
                            <button
                                type="button"
                                className="w-full text-sm text-indigo-600 hover:text-indigo-800">
                                View all notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
