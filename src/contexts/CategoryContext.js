'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import StorageService from '../services/storage';
import { useCustomMappings } from './CustomMappingsContext';

const CategoryContext = createContext();

const DEFAULT_CATEGORIES = [
  { id: 'food_dining', label: 'Food & Dining', icon: '🍽️' },
  { id: 'groceries', label: 'Groceries', icon: '🛒' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'transport', label: 'Transportation', icon: '🚌' },
  { id: 'entertainment', label: 'Entertainment', icon: '🎬' },
  { id: 'housing', label: 'Housing', icon: '🏠' },
  { id: 'utilities', label: 'Utilities', icon: '💡' },
  { id: 'health', label: 'Health', icon: '🏥' },
  { id: 'education', label: 'Education', icon: '🎓' },
  { id: 'personal', label: 'Personal', icon: '👤' },
  { id: 'travel', label: 'Travel', icon: '✈️' },
  { id: 'income', label: 'Income', icon: '💰' },
  { id: 'insurance', label: 'Insurance', icon: '🛡️' },
  { id: 'banking_finance', label: 'Banking & Finance', icon: '🏦' },
  { id: 'sports_fitness', label: 'Sports & Fitness', icon: '🏃' },
  { id: 'other', label: 'Other', icon: '⛓️' }
];

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const { customMappings, updateCustomMapping } = useCustomMappings();

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
    // Get the old category before update
    const oldCategory = categories.find(cat => cat.id === id);

    setCategories(prev =>
      prev.map(category =>
        category.id === id ? { ...category, ...updatedCategory } : category
      )
    );

    // Update in storage
    const categoryIds = categories.map(cat => cat.id);
    localStorage.setItem('personalFinance_categories', JSON.stringify(categoryIds));

    // Update custom mappings if category label changed
    if (oldCategory && oldCategory.label !== updatedCategory.label && customMappings[oldCategory.label]) {
      const patterns = customMappings[oldCategory.label];
      patterns.forEach(pattern => {
        updateCustomMapping(oldCategory.label, updatedCategory.label, pattern);
      });
    }
  };

  const deleteCategory = (id) => {
    if (id === 'other') return; // Prevent deletion of the default 'other' category
    
    // Get the category before deletion
    const categoryToDelete = categories.find(cat => cat.id === id);

    setCategories(prev => prev.filter(category => category.id !== id));
    
    // Update in storage
    const categoryIds = categories.filter(cat => cat.id !== id).map(cat => cat.id);
    localStorage.setItem('personalFinance_categories', JSON.stringify(categoryIds));

    // Move custom mappings to 'Other' category
    if (categoryToDelete && customMappings[categoryToDelete.label]) {
      const patterns = customMappings[categoryToDelete.label];
      patterns.forEach(pattern => {
        updateCustomMapping(categoryToDelete.label, 'Other', pattern);
      });
    }
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