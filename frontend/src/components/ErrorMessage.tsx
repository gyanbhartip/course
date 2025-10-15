/**
 * Error Message Component
 * Displays error messages with consistent styling
 */

import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ErrorMessageProps {
    title?: string;
    message: string;
    onDismiss?: () => void;
    className?: string;
    variant?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
    title,
    message,
    onDismiss,
    className = '',
    variant = 'error',
}) => {
    const variantClasses = {
        error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200',
        warning:
            'bg-yellow-50 border-yellow-200 text-yellow-800 dark:bg-yellow-900/20 dark:border-yellow-800 dark:text-yellow-200',
        info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200',
    };

    const iconClasses = {
        error: 'text-red-600 dark:text-red-400',
        warning: 'text-yellow-600 dark:text-yellow-400',
        info: 'text-blue-600 dark:text-blue-400',
    };

    return (
        <div
            className={`rounded-md border p-4 ${variantClasses[variant]} ${className}`}>
            <div className="flex">
                <div className="flex-shrink-0">
                    <AlertCircle
                        className={`h-5 w-5 ${iconClasses[variant]}`}
                    />
                </div>
                <div className="ml-3 flex-1">
                    {title && (
                        <h3 className="text-sm font-medium mb-1">{title}</h3>
                    )}
                    <p className="text-sm">{message}</p>
                </div>
                {onDismiss && (
                    <div className="ml-auto pl-3">
                        <div className="-mx-1.5 -my-1.5">
                            <button
                                type="button"
                                onClick={onDismiss}
                                className={`inline-flex rounded-md p-1.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                                    variant === 'error'
                                        ? 'text-red-500 hover:bg-red-100 focus:ring-red-600 dark:hover:bg-red-800/30'
                                        : variant === 'warning'
                                        ? 'text-yellow-500 hover:bg-yellow-100 focus:ring-yellow-600 dark:hover:bg-yellow-800/30'
                                        : 'text-blue-500 hover:bg-blue-100 focus:ring-blue-600 dark:hover:bg-blue-800/30'
                                }`}>
                                <span className="sr-only">Dismiss</span>
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ErrorMessage;
