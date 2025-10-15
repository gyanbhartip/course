/**
 * Empty State Component
 * Displays empty state messages with icons and optional actions
 */

import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description?: string;
    action?: {
        label: string;
        onClick: () => void;
    };
    className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
    icon: Icon,
    title,
    description,
    action,
    className = '',
}) => {
    return (
        <div className={`text-center py-12 ${className}`}>
            <div className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500">
                <Icon className="h-full w-full" />
            </div>
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
                {title}
            </h3>
            {description && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {description}
                </p>
            )}
            {action && (
                <div className="mt-6">
                    <button
                        type="button"
                        onClick={action.onClick}
                        className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        {action.label}
                    </button>
                </div>
            )}
        </div>
    );
};

export default EmptyState;
