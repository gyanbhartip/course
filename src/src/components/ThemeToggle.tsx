/**
 * ThemeToggle Component
 * Provides a dropdown menu to switch between light, dark, and auto themes
 */

import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, setTheme } = useTheme();

    const themes = [
        { value: 'light' as const, label: 'Light', icon: Sun },
        { value: 'dark' as const, label: 'Dark', icon: Moon },
        { value: 'auto' as const, label: 'Auto', icon: Monitor },
    ];

    const currentTheme = themes.find(t => t.value === theme);
    const CurrentIcon = currentTheme?.icon || Sun;

    return (
        <div className="relative">
            <select
                value={theme}
                onChange={e =>
                    setTheme(e.target.value as 'light' | 'dark' | 'auto')
                }
                className="appearance-none bg-transparent border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 pr-8 text-sm text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
                {themes.map(themeOption => {
                    const Icon = themeOption.icon;
                    return (
                        <option
                            key={themeOption.value}
                            value={themeOption.value}>
                            {themeOption.label}
                        </option>
                    );
                })}
            </select>

            {/* Custom dropdown arrow with theme icon */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <CurrentIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </div>
        </div>
    );
};

export default ThemeToggle;
