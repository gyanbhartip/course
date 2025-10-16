/**
 * ProgressBar Component
 * Reusable progress bar with percentage display and color coding
 */

type ProgressBarProps = {
    progress: number; // 0-100
    size?: 'sm' | 'md' | 'lg';
    showPercentage?: boolean;
    animated?: boolean;
    className?: string;
    label?: string;
};

const ProgressBar = ({
    progress,
    size = 'md',
    showPercentage = true,
    animated = true,
    className = '',
    label,
}: ProgressBarProps) => {
    // Clamp progress between 0 and 100
    const clampedProgress = Math.max(0, Math.min(100, progress));

    // Size classes
    const sizeClasses = {
        sm: 'h-2',
        md: 'h-3',
        lg: 'h-4',
    };

    // Color classes based on progress
    const getColorClass = (progress: number) => {
        if (progress < 25) return 'bg-red-500';
        if (progress < 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                        {label}
                    </span>
                    {showPercentage && (
                        <span className="text-sm text-gray-500">
                            {Math.round(clampedProgress)}%
                        </span>
                    )}
                </div>
            )}
            <div
                className={`w-full bg-gray-200 rounded-full overflow-hidden ${sizeClasses[size]}`}>
                <div
                    className={`${getColorClass(clampedProgress)} ${
                        sizeClasses[size]
                    } transition-all duration-300 ease-out ${
                        animated ? 'animate-pulse' : ''
                    }`}
                    style={{ width: `${clampedProgress}%` }}
                />
            </div>
            {!label && showPercentage && (
                <div className="flex justify-end mt-1">
                    <span className="text-xs text-gray-500">
                        {Math.round(clampedProgress)}%
                    </span>
                </div>
            )}
        </div>
    );
};

export default ProgressBar;
