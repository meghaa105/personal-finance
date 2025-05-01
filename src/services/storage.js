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
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(defaultCategories));
    }

    if (!localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPPINGS)) {
      const defaultCustomMappings = {
        'Food & Dining': ['restaurant', 'cafe', 'swiggy', 'zomato'],
        'Groceries': ['grocery', 'supermarket', 'dmart', 'kirana'],
        'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'tatacliq', 'shop', 'store', 'retail', 'clothing', 'apparel', 'snapdeal', 'lenskart', 'croma', 'reliance digital', 'vijay sales', 'lifestyle', 'pantaloons', 'westside', 'mall', 'bazaar'],
        'Transportation': ['uber', 'ola', 'rapido', 'taxi', 'auto', 'transit', 'train', 'irctc', 'railway', 'metro', 'bus', 'red bus', 'redbus', 'petrol', 'diesel', 'fuel', 'indian oil', 'hp', 'bharat petroleum', 'bpcl', 'toll', 'fastag'],
        'Entertainment': ['movie', 'cinema', 'pvr', 'inox', 'bookmyshow', 'theater', 'netflix', 'hotstar', 'disney+', 'amazon prime', 'sony liv', 'zee5', 'jio cinema', 'game', 'gaming', 'concert', 'event'],
        'Housing': ['rent', 'lease', 'maintenance', 'society', 'apartment', 'flat', 'property', 'home', 'housing', 'accommodation', 'builder', 'construction', 'repair', 'renovation'],
        'Utilities': ['electric', 'electricity', 'bill', 'water', 'internet', 'broadband', 'jio', 'airtel', 'bsnl', 'vi', 'vodafone', 'idea', 'tata sky', 'dth', 'gas', 'lpg', 'indane', 'utility', 'pipeline'],
        'Health': ['doctor', 'hospital', 'medical', 'apollo', 'fortis', 'max', 'medanta', 'medplus', 'pharmacy', 'pharmeasy', 'netmeds', 'tata 1mg', 'dental', 'vision', 'healthcare', 'clinic', 'diagnostic', 'lab', 'test', 'medicine', 'ayurvedic'],
        'Education': ['tuition', 'school', 'college', 'university', 'education', 'book', 'course', 'byjus', 'unacademy', 'vedantu', 'whitehat', 'cuemath', 'coaching', 'institute', 'academy', 'library', 'learning'],
        'Travel': ['travel', 'hotel', 'oyo', 'makemytrip', 'goibibo', 'booking.com', 'cleartrip', 'ixigo', 'trivago', 'airline', 'indigo', 'spicejet', 'vistara', 'air india', 'flight', 'vacation', 'trip', 'tourism', 'resort', 'package', 'goa', 'manali', 'kerala'],
        'Insurance': ['insurance', 'policy', 'premium', 'lic', 'health insurance', 'vehicle insurance', 'hdfc ergo', 'bajaj allianz', 'icici lombard', 'max bupa', 'star health', 'new india', 'mutual', 'term', 'life'],
        'Banking & Finance': ['investment', 'mutual fund', 'stocks', 'shares', 'demat', 'zerodha', 'groww', 'upstox', 'kuvera', 'uti', 'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'sip', 'nps', 'ppf', 'fixed deposit', 'fd', 'nifty', 'sensex'],
        'Sports & Fitness': ['badminton', 'nvk', 'pullela', 'shuttles', 'baddy']
      };
      localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify(defaultCustomMappings));
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
    if (!categories.map(cat => cat.id).includes(category.id)) {
      categories.push(category);
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));

      // Initialize empty custom mappings for new category
      const customMappings = JSON.parse(localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPPINGS) || '{}');
      customMappings[category.id] = [];
      localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify(customMappings));
    }
  }

  /**
   * Update a category
   * @param {string} categoryId - Category ID to update
   * @param {Object} updatedCategory - Updated category object
   */
  static updateCategory(categoryId, updatedCategory) {
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
  }

  /**
   * Delete a category
   * @param {string} categoryId - Category ID to delete
   */
  static deleteCategory(categoryId) {
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
  }

  /**
   * Get all custom mappings
   * @returns {Object} Object of custom mappings by category
   */
  static getCustomMappings() {
    const mappings = localStorage.getItem(STORAGE_KEYS.CUSTOM_MAPPINGS);
    return JSON.parse(mappings || '[]');
  }

  /**
   * Add a new custom mapping
   * @param {Object} mapping - Custom mapping object
   */
  static addCustomMapping(mapping) {
    const mappings = this.getCustomMappings();
    mappings.push(mapping);
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify(mappings));
  }

  /**
   * Update custom mappings
   * @param {Array} mappings - Array of custom mappings
   */
  static updateCustomMappings(mappings) {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_MAPPINGS, JSON.stringify(mappings));
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