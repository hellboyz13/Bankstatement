'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  if (theme === 'dark') {
    html.classList.add('dark');
    html.style.colorScheme = 'dark';
  } else {
    html.classList.remove('dark');
    html.style.colorScheme = 'light';
  }
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Initialize theme from localStorage on client mount
  useEffect(() => {
    try {
      // Get stored theme or default to light
      const storedTheme = (localStorage.getItem('theme') as Theme | null) || 'light';
      setTheme(storedTheme);
      // Immediately apply theme to prevent flash
      applyTheme(storedTheme);
    } catch (error) {
      console.error('Failed to load theme:', error);
      applyTheme('light');
    }
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme((prevTheme) => {
      const newTheme = prevTheme === 'light' ? 'dark' : 'light';

      // Apply to DOM immediately
      applyTheme(newTheme);

      // Persist to localStorage
      try {
        localStorage.setItem('theme', newTheme);
      } catch (error) {
        console.error('Failed to save theme:', error);
      }

      return newTheme;
    });
  };

  // Always provide context, even during SSR to prevent build errors
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
