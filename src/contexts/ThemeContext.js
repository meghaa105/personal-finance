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
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('personalFinance_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const updatePrimaryColor = (color) => {
    setPrimaryColor(color);
    localStorage.setItem('personalFinance_primaryColor', color);
    document.documentElement.style.setProperty('--color-primary', color);
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