'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '../services/storage';

const CategoryContext = createContext();

const DEFAULT_CATEGORIES = [
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'transport', label: 'Transportation', icon: '🚌' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'bills', label: 'Bills', icon: '📄' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'other', label: 'Other', icon: '⛓️' }
];

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    // Load categories from storage
    const storedCategories = StorageService.getCategories();
    if (storedCategories && storedCategories.length > 0) {
      // Convert stored categories to full objects with icons
      const fullCategories = storedCategories.map(category => {
        const defaultCategory = DEFAULT_CATEGORIES.find(c => c.id === category.id);
        return defaultCategory || { id: category.id, label: category.label, icon: category.icon || '⛓️' };
      });
      setCategories(fullCategories);
    } else {
      // Initialize with default categories
      StorageService.init();
    }
  }, []);

  const addCategory = (newCategory) => {
    if (!newCategory.id || !newCategory.label) return;
    
    const categoryExists = categories.some(cat => cat.id === newCategory.id);
    if (categoryExists) return;

    const categoryWithIcon = {
      ...newCategory,
      icon: newCategory.icon || '⛓️'
    };

    StorageService.addCategory(newCategory.id);
    setCategories(prev => [...prev, categoryWithIcon]);
  };

  const updateCategory = (id, updatedCategory) => {
    setCategories(prev =>
      prev.map(category =>
        category.id === id ? { ...category, ...updatedCategory } : category
      )
    );
    // Update in storage
    const categoryIds = categories.map(cat => cat.id);
    localStorage.setItem('personalFinance_categories', JSON.stringify(categoryIds));
  };

  const deleteCategory = (id) => {
    if (id === 'other') return; // Prevent deletion of the default 'other' category
    
    setCategories(prev => prev.filter(category => category.id !== id));
    // Update in storage
    const categoryIds = categories.filter(cat => cat.id !== id).map(cat => cat.id);
    localStorage.setItem('personalFinance_categories', JSON.stringify(categoryIds));
  };

  return (
    <CategoryContext.Provider
      value={{
        categories,
        addCategory,
        updateCategory,
        deleteCategory
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}