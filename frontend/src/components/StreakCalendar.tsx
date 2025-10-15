/**
 * StreakCalendar Component
 * GitHub-style contribution calendar for learning activity
 */

import React, { useMemo } from 'react';
import {
    format,
    startOfYear,
    endOfYear,
    eachDayOfInterval,
    subDays,
} from 'date-fns';
import type { LearningActivity } from '../src/types';

interface StreakCalendarProps {
    activities: Array<LearningActivity>;
    className?: string;
}

const StreakCalendar: React.FC<StreakCalendarProps> = ({
    activities,
    className = '',
}) => {
    // Create activity map for quick lookup
    const activityMap = useMemo(() => {
        const map = new Map<string, LearningActivity>();
        activities.forEach(activity => {
            map.set(activity.date, activity);
        });
        return map;
    }, [activities]);

    // Generate calendar data for the current year
    const calendarData = useMemo(() => {
        const start = startOfYear(new Date());
        const end = endOfYear(new Date());
        const days = eachDayOfInterval({ start, end });

        // Group days by weeks (starting from Sunday)
        const weeks: Array<Array<{ date: Date; activity?: LearningActivity }>> =
            [];
        let currentWeek: Array<{ date: Date; activity?: LearningActivity }> =
            [];

        days.forEach((day, index) => {
            const dayOfWeek = day.getDay();
            const activity = activityMap.get(format(day, 'yyyy-MM-dd'));

            currentWeek.push({ date: day, activity });

            // Start new week on Sunday or at the end
            if (dayOfWeek === 6 || index === days.length - 1) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
        });

        return weeks;
    }, [activityMap]);

    // Calculate streak information
    const streakInfo = useMemo(() => {
        const today = new Date();
        let currentStreak = 0;
        let longestStreak = 0;
        let tempStreak = 0;

        // Check current streak (backwards from today)
        for (let i = 0; i < 365; i++) {
            const checkDate = subDays(today, i);
            const dateStr = format(checkDate, 'yyyy-MM-dd');
            const hasActivity = activityMap.has(dateStr);

            if (hasActivity) {
                if (i === 0 || currentStreak > 0) {
                    currentStreak++;
                }
            } else {
                break;
            }
        }

        // Calculate longest streak
        for (let i = 0; i < 365; i++) {
            const checkDate = subDays(today, i);
            const dateStr = format(checkDate, 'yyyy-MM-dd');
            const hasActivity = activityMap.has(dateStr);

            if (hasActivity) {
                tempStreak++;
                longestStreak = Math.max(longestStreak, tempStreak);
            } else {
                tempStreak = 0;
            }
        }

        return { currentStreak, longestStreak };
    }, [activityMap]);

    // Get intensity color based on minutes
    const getIntensityColor = (minutes: number) => {
        if (minutes === 0) return 'bg-gray-100';
        if (minutes < 15) return 'bg-green-200';
        if (minutes < 30) return 'bg-green-300';
        if (minutes < 60) return 'bg-green-400';
        return 'bg-green-500';
    };

    // Get tooltip text
    const getTooltipText = (date: Date, activity?: LearningActivity) => {
        const dateStr = format(date, 'MMM d, yyyy');
        if (!activity) {
            return `No activity on ${dateStr}`;
        }
        return `${activity.minutes} minutes on ${dateStr}`;
    };

    return (
        <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
            <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Learning Activity
                </h3>
                <div className="flex items-center space-x-6 text-sm text-gray-600">
                    <div>
                        <span className="font-medium">
                            {streakInfo.currentStreak}
                        </span>{' '}
                        day current streak
                    </div>
                    <div>
                        <span className="font-medium">
                            {streakInfo.longestStreak}
                        </span>{' '}
                        day longest streak
                    </div>
                    <div>
                        <span className="font-medium">{activities.length}</span>{' '}
                        active days
                    </div>
                </div>
            </div>

            <div className="overflow-x-auto">
                <div className="flex space-x-1">
                    {calendarData.map((week, weekIndex) => (
                        <div
                            key={weekIndex}
                            className="flex flex-col space-y-1">
                            {week.map((day, dayIndex) => {
                                const minutes = day.activity?.minutes || 0;

                                return (
                                    <div
                                        key={dayIndex}
                                        className={`w-3 h-3 rounded-sm ${getIntensityColor(
                                            minutes,
                                        )} hover:ring-2 hover:ring-gray-400 cursor-pointer transition-all`}
                                        title={getTooltipText(
                                            day.date,
                                            day.activity,
                                        )}
                                    />
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                <span>Less</span>
                <div className="flex space-x-1">
                    <div className="w-3 h-3 bg-gray-100 rounded-sm" />
                    <div className="w-3 h-3 bg-green-200 rounded-sm" />
                    <div className="w-3 h-3 bg-green-300 rounded-sm" />
                    <div className="w-3 h-3 bg-green-400 rounded-sm" />
                    <div className="w-3 h-3 bg-green-500 rounded-sm" />
                </div>
                <span>More</span>
            </div>
        </div>
    );
};

export default StreakCalendar;
