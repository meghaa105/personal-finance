'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  const [primaryColor, setPrimaryColor] = useState('#6c63ff'); // Default blue color

  useEffect(() => {
    // Load theme and primary color from localStorage on mount
    const savedTheme = localStorage.getItem('personalFinance_theme');
    const savedPrimaryColor = localStorage.getItem('personalFinance_primaryColor');
    const savedHoverColor = localStorage.getItem('personalFinance_hoverColor');

    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }

    if (savedPrimaryColor) {
      setPrimaryColor(savedPrimaryColor);
      document.documentElement.style.setProperty('--color-primary', savedPrimaryColor);
    } else {
      document.documentElement.style.setProperty('--color-primary', primaryColor);
    }

    if (savedHoverColor) {
      document.documentElement.style.setProperty('--color-primary-hover', savedHoverColor);
    } else {
      document.documentElement.style.setProperty('--color-primary-hover', '#150f8b');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('personalFinance_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const updatePrimaryColor = (color, hoverColor) => {
    setPrimaryColor(color);
    localStorage.setItem('personalFinance_primaryColor', color);
    localStorage.setItem('personalFinance_hoverColor', hoverColor);
    document.documentElement.style.setProperty('--color-primary', color);
    document.documentElement.style.setProperty('--color-primary-hover', hoverColor);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, primaryColor, updatePrimaryColor }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}