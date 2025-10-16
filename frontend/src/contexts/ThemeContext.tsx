/**
 * Theme Context
 * Manages dark/light/auto theme preferences throughout the application
 */

import {
    createContext,
    useContext,
    useState,
    useEffect,
} from 'react';
import type { ReactNode } from 'react';

export type Theme = 'light' | 'dark' | 'auto';

interface ThemeContextType {
    theme: Theme;
    setTheme: (theme: Theme) => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// ThemeProvider component to wrap the application
interface ThemeProviderProps {
    children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('auto');
    const [isDark, setIsDark] = useState(false);

    // Check for existing theme preference on app load
    useEffect(() => {
        const checkTheme = () => {
            try {
                const storedTheme = localStorage.getItem('theme') as Theme;
                if (
                    storedTheme &&
                    ['light', 'dark', 'auto'].includes(storedTheme)
                ) {
                    setTheme(storedTheme);
                }
            } catch (error) {
                console.error('Error parsing stored theme:', error);
                localStorage.removeItem('theme');
            }
        };

        checkTheme();
    }, []);

    // Update dark mode based on theme preference
    useEffect(() => {
        const updateDarkMode = () => {
            if (theme === 'auto') {
                // Use system preference
                setIsDark(
                    window.matchMedia('(prefers-color-scheme: dark)').matches,
                );
            } else {
                setIsDark(theme === 'dark');
            }
        };

        updateDarkMode();

        // Listen for system theme changes when in auto mode
        if (theme === 'auto') {
            const mediaQuery = window.matchMedia(
                '(prefers-color-scheme: dark)',
            );
            const handleChange = () => updateDarkMode();

            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }
    }, [theme]);

    // Apply theme to document
    useEffect(() => {
        const root = document.documentElement;
        if (isDark) {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [isDark]);

    // Handle theme change
    const handleSetTheme = (newTheme: Theme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    const value: ThemeContextType = {
        theme,
        setTheme: handleSetTheme,
        isDark,
    };

    return (
        <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
    );
};

// Custom hook to use the theme context
export const useTheme = (): ThemeContextType => {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};
