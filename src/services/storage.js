/**
 * Local Storage Service
 * Handles data persistence using browser's localStorage
 */

import { DEFAULT_CATEGORIES, DEFAULT_MAPPINGS } from '../constants/categories';

const STORAGE_KEYS = {
  TRANSACTIONS: 'personalFinance_transactions',
  CATEGORIES: 'personalFinance_categories',
  CUSTOM_MAPPINGS: 'personalFinance_customMappings'
};

class StorageService {
  static init() {
    if (typeof window === 'undefined') return;

    try {
      // Force initialize transactions with sample
      if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
      }

      if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(DEFAULT_CATEGORIES));
      }

      if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPPINGS)) {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify(DEFAULT_MAPPINGS));
      }
    } catch (error) {
      console.error('Error initializing storage:', error);
    }
  }

  static getAllTransactions() {
    if (typeof window === 'undefined') return [];

    try {
      const transactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const parsedTransactions = JSON.parse(transactions || '[]');
      return Array.isArray(parsedTransactions) ? parsedTransactions : [];
    } catch (error) {
      console.error('Error getting transactions:', error);
      return [];
    }
  }

  /**
   * Get filtered transactions
   * @param {Object} filters - Filter criteria
   * @returns {Array} Filtered transactions
   */
  static getTransactions(filters = {}) {
    let transactions = this.getAllTransactions();

    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      transactions = transactions.filter(t =>
        t.description.toLowerCase().includes(searchTerm)
      );
    }

    if (filters.type) {
      transactions = transactions.filter(t => t.type === filters.type);
    }

    if (filters.category) {
      transactions = transactions.filter(t => t.category === filters.category);
    }

    if (filters.startDate) {
      transactions = transactions.filter(t =>
        new Date(t.date) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      transactions = transactions.filter(t =>
        new Date(t.date) <= new Date(filters.endDate)
      );
    }

    if (filters.sources && filters.sources.length > 0) {
      transactions = transactions.filter(t =>
        filters.sources.includes(t.source)
      );
    }

    return transactions;
  }

  /**
   * Add a new transaction
   * @param {Object} transaction - Transaction object
   */
  static addTransaction(transaction) {
    if (typeof window === 'undefined') return;
    if (!transaction || typeof transaction !== 'object') {
        console.error('Invalid transaction object');
        return;
    }

    try {
      const transactions = this.getAllTransactions();
      transactions.push(transaction);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  }

  /**
   * Update an existing transaction
   * @param {string} id - Transaction ID
   * @param {Object} updatedTransaction - Updated transaction object
   */
  static updateTransaction(id, updatedTransaction) {
    if (typeof window === 'undefined') return;

    try {
      const transactions = this.getAllTransactions();
      const index = transactions.findIndex(t => t.id === id);
      if (index !== -1) {
        transactions[index] = { ...transactions[index], ...updatedTransaction };
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
      }
    } catch (error) {
      console.error('Error updating transaction:', error);
    }
  }

  /**
   * Delete a transaction
   * @param {string} id - Transaction ID
   */
  static deleteTransaction(id) {
    if (typeof window === 'undefined') return;

    try {
      const transactions = this.getAllTransactions();
      const filteredTransactions = transactions.filter(t => t.id !== id);
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  }

  /**
   * Get all categories
   * @returns {Array} Array of categories
   */
  static getCategories() {
    if (typeof window === 'undefined') return [];

    try {
      const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
      const parsedCategories = JSON.parse(categories || '[]');
      return Array.isArray(parsedCategories) ? parsedCategories : [];
    } catch (error) {
      console.error('Error getting categories:', error);
      return [];
    }
  }

  /**
   * Add a new category
   * @param {string} category - Category name
   */
  static addCategory(category) {
    if (typeof window === 'undefined') return;

    try {
      const categories = this.getCategories();
      if (!categories.map(cat => cat.id).includes(category.id)) {
        categories.push(category);
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

        // Initialize empty custom mappings for new category
        const customMappings = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPPINGS) || '{}');
        customMappings[category.id] = [];
        localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify(customMappings));
      }
    } catch (error) {
      console.error('Error adding category:', error);
    }
  }

  /**
   * Update a category
   * @param {string} categoryId - Category ID to update
   * @param {Object} updatedCategory - Updated category object
   */
  static updateCategory(categoryId, updatedCategory) {
    if (typeof window === 'undefined') return;

    try {
      const categories = this.getCategories();
      const index = categories.findIndex(c => c.id === categoryId);
      if (index !== -1) {
        categories[index] = { ...categories[index], ...updatedCategory };
        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

        // Update custom mappings if category ID changed
        if (categoryId !== updatedCategory.id) {
          const customMappings = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPPINGS) || '{}');
          customMappings[updatedCategory.id] = customMappings[categoryId] || [];
          delete customMappings[categoryId];
          localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify(customMappings));
        }
      }
    } catch (error) {
      console.error('Error updating category:', error);
    }
  }

  /**
   * Delete a category
   * @param {string} categoryId - Category ID to delete
   */
  static deleteCategory(categoryId) {
    if (typeof window === 'undefined') return;

    try {
      const categories = this.getCategories();
      const filteredCategories = categories.filter(c => c.id !== categoryId);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(filteredCategories));

      // Remove custom mappings for deleted category
      const customMappings = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPPINGS) || '{}');
      delete customMappings[categoryId];
      localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify(customMappings));

      // Update transactions with deleted category to 'other'
      const transactions = this.getAllTransactions();
      const updatedTransactions = transactions.map(t => {
        if (t.category === categoryId) {
          return { ...t, category: 'other' };
        }
        return t;
      });
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(updatedTransactions));
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  }

  /**
   * Get all custom mappings
   * @returns {Object} Object of custom mappings by category
   */
  static getCustomMappings() {
    if (typeof window === 'undefined') return {};

    try {
      const mappings = localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPPINGS);
      return JSON.parse(mappings || '{}');
    } catch (error) {
      console.error('Error getting custom mappings:', error);
      return {};
    }
  }

  /**
   * Add a new custom mapping
   * @param {Object} mapping - Custom mapping object
   */
  static addCustomMapping(mapping) {
    if (typeof window === 'undefined') return;

    // Based on CustomMappingsContext.js, mapping is added via updateCustomMappings with the full object.
    // This method (addCustomMapping) seems unused or legacy in the context of the current app usage
    // where CustomMappingsContext manages the state and just calls updateCustomMappings.
    // However, if it were used, it would need to handle the object structure correctly.
    // Since getCustomMappings returns an object, and mapping here seems to imply a single mapping entry?
    // It is safer to deprecate this or align it with the object structure.
    // Given I don't see it used in the context, I will log a warning and return.

    console.warn('addCustomMapping is deprecated or incorrectly implemented for the current data structure. Use updateCustomMappings instead.');
  }

  /**
   * Update custom mappings
   * @param {Object} mappings - Object of custom mappings
   */
  static updateCustomMappings(mappings) {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify(mappings));
    } catch (error) {
        console.error('Error updating custom mappings:', error);
    }
  }

  /**
   * Clear all data from storage
   */
  static clearAllData() {
    if (typeof window === 'undefined') return;
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      this.init(); // Reinitialize with default values
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  static clearTransactions() {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    } catch (error) {
        console.error('Error clearing transactions:', error);
    }
  }
}

export default StorageService;
