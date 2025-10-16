/**
 * Loading Spinner Component
 * Reusable loading indicator with customizable size and styling
 */

import { Loader2 } from 'lucide-react';

type LoadingSpinnerProps = {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
    text?: string;
};

const LoadingSpinner = ({
    size = 'md',
    className = '',
    text,
}: LoadingSpinnerProps) => {
    const sizeClasses = {
        sm: 'h-4 w-4',
        md: 'h-6 w-6',
        lg: 'h-8 w-8',
    };

    return (
        <div className={`flex items-center justify-center ${className}`}>
            <div className="flex flex-col items-center space-y-2">
                <Loader2
                    className={`animate-spin text-indigo-600 ${sizeClasses[size]}`}
                />
                {text && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        {text}
                    </p>
                )}
            </div>
        </div>
    );
};

export default LoadingSpinner;
