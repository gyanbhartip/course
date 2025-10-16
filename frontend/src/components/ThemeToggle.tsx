/**
 * ThemeToggle Component
 * Provides a dropdown menu to switch between light, dark, and auto themes
 */

import { ChevronDown, Monitor, Moon, Sun } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTheme, type Theme } from '../contexts/ThemeContext';

const THEMES = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'auto' as const, label: 'Auto', icon: Monitor },
];

const ThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const currentTheme = THEMES.find(t => t.value === theme);
    const CurrentIcon = currentTheme?.icon || Sun;

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
        return () =>
            document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleThemeSelect = (selectedTheme: Theme) => {
        setTheme(selectedTheme);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Custom dropdown button */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 appearance-none bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <CurrentIcon className="h-4 w-4" />
                <span>{currentTheme?.label}</span>
                <ChevronDown className="h-4 w-4 absolute right-2" />
            </button>

            {/* Custom dropdown menu */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
                    {THEMES.map(themeOption => {
                        const Icon = themeOption.icon;
                        const isSelected = themeOption.value === theme;

                        return (
                            <button
                                type="button"
                                key={themeOption.value}
                                onClick={() =>
                                    handleThemeSelect(themeOption.value)
                                }
                                className={`w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors first:rounded-t-md last:rounded-b-md ${
                                    isSelected
                                        ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                                        : 'text-gray-700 dark:text-gray-300'
                                }`}>
                                <Icon className="h-4 w-4" />
                                <span>{themeOption.label}</span>
                                {isSelected && (
                                    <div className="ml-auto w-2 h-2 bg-indigo-500 rounded-full" />
                                )}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ThemeToggle;
