'use client';

import { useTheme } from '@/context/ThemeContext';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors smooth-transition"
      title="Toggle theme"
      aria-label="Toggle dark/light mode"
    >
      {theme === 'light' ? '🌙' : '☀️'}
    </button>
  );
}
