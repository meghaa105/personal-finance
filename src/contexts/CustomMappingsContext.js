'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '../services/storage';

const CustomMappingsContext = createContext();

export function CustomMappingsProvider({ children }) {
  const [customMappings, setCustomMappings] = useState({});

  useEffect(() => {
    // Load custom mappings from storage
    const storedMappings = StorageService.getCustomMappings();
    if (storedMappings) {
      setCustomMappings(storedMappings);
    }
  }, []);

  const addCustomMapping = (category, pattern) => {
    if (!pattern || !category) return;

    const patternLower = pattern.toLowerCase();
    const categoryMappings = customMappings[category] || [];

    if (categoryMappings.includes(patternLower)) return;

    setCustomMappings(prev => ({
      ...prev,
      [category]: [...(prev[category] || []), patternLower]
    }));
    StorageService.updateCustomMappings({
      ...customMappings,
      [category]: [...(customMappings[category] || []), patternLower]
    });
  };

  const updateCustomMapping = (oldCategory, newCategory, pattern) => {
    const patternLower = pattern.toLowerCase();
    
    setCustomMappings(prev => {
      const newMappings = { ...prev };
      // Remove from old category
      if (newMappings[oldCategory]) {
        newMappings[oldCategory] = newMappings[oldCategory].filter(p => p !== patternLower);
        if (newMappings[oldCategory].length === 0) {
          delete newMappings[oldCategory];
        }
      }
      // Add to new category
      if (!newMappings[newCategory]) {
        newMappings[newCategory] = [];
      }
      newMappings[newCategory] = [...newMappings[newCategory], patternLower];
      
      StorageService.updateCustomMappings(newMappings);
      return newMappings;
    });
  };

  const deleteCustomMapping = (category, pattern) => {
    const patternLower = pattern.toLowerCase();
    
    setCustomMappings(prev => {
      const newMappings = { ...prev };
      if (newMappings[category]) {
        newMappings[category] = newMappings[category].filter(p => p !== patternLower);
        if (newMappings[category].length === 0) {
          delete newMappings[category];
        }
      }
      StorageService.updateCustomMappings(newMappings);
      return newMappings;
    });
  };

  const findMatchingCategory = (description) => {
    if (!description) return null;

    const descriptionLower = description.toLowerCase();
    
    for (const [category, patterns] of Object.entries(customMappings)) {
      if (patterns.some(pattern => descriptionLower.includes(pattern))) {
        return category;
      }
    }

    return null;
  };

  return (
    <CustomMappingsContext.Provider
      value={{
        customMappings,
        addCustomMapping,
        updateCustomMapping,
        deleteCustomMapping,
        findMatchingCategory
      }}
    >
      {children}
    </CustomMappingsContext.Provider>
  );
}

export function useCustomMappings() {
  const context = useContext(CustomMappingsContext);
  if (!context) {
    throw new Error('useCustomMappings must be used within a CustomMappingsProvider');
  }
  return context;
}