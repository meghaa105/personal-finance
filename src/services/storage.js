/**
 * Local Storage Service
 * Handles data persistence using browser's localStorage
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'personalFinance_transactions',
  CATEGORIES: 'personalFinance_categories',
  CUSTOM_MAPPINGS: 'personalFinance_customMappings',
  REMINDERS: 'personalFinance_reminders'
};

class StorageService {
  /**
   * Initialize storage with default values if empty
   */
  static init() {
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CATEGORIES)) {
      const defaultCategories = [
        'Food',
        'Transportation',
        'Shopping',
        'Bills',
        'Entertainment',
        'Health',
        'Education',
        'Other'
      ];
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPPINGS)) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify([]));
    }

    if (!localStorage.getItem(STORAGE_KEYS.REMINDERS)) {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify([]));
    }
  }

  /**
   * Get all transactions
   * @returns {Array} Array of transactions
   */
  static getAllTransactions() {
    const transactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return JSON.parse(transactions || '[]');
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
    const transactions = this.getAllTransactions();
    transactions.push(transaction);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  /**
   * Update an existing transaction
   * @param {string} id - Transaction ID
   * @param {Object} updatedTransaction - Updated transaction object
   */
  static updateTransaction(id, updatedTransaction) {
    const transactions = this.getAllTransactions();
    const index = transactions.findIndex(t => t.id === id);
    if (index !== -1) {
      transactions[index] = { ...transactions[index], ...updatedTransaction };
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    }
  }

  /**
   * Delete a transaction
   * @param {string} id - Transaction ID
   */
  static deleteTransaction(id) {
    const transactions = this.getAllTransactions();
    const filteredTransactions = transactions.filter(t => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(filteredTransactions));
  }

  /**
   * Get all categories
   * @returns {Array} Array of categories
   */
  static getCategories() {
    const categories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    return JSON.parse(categories || '[]');
  }

  /**
   * Add a new category
   * @param {string} category - Category name
   */
  static addCategory(category) {
    const categories = this.getCategories();
    if (!categories.includes(category)) {
      categories.push(category);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    }
  }

  /**
   * Clear all data from storage
   */
  static clearAllData() {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    this.init(); // Reinitialize with default values
  }
}

export default StorageService;