/**
 * Database module for handling local storage of financial data
 * Uses localStorage for persistent storage between sessions
 */
const Database = (function() {
    const defaultCategories = [
        'Food & Dining',
        'Groceries',
        'Shopping',
        'Transportation',
        'Entertainment',
        'Housing',
        'Utilities',
        'Health',
        'Education',
        'Personal',
        'Travel',
        'Income',
        'Banking & Finance',
        'Sports & Fitness',
        'Other'
    ];
    // Private storage
    let transactions = [];
    let categories = [
        'Food & Dining',
        'Groceries',
        'Shopping',
        'Transportation',
        'Entertainment',
        'Housing',
        'Utilities',
        'Health',
        'Education',
        'Personal',
        'Travel',
        'Income',
        'Banking & Finance',
        'Sports & Fitness',
        'Other',
    ];
    const categoryIcons = [
        '🍔', '🛒', '🛍️', '🚗', '🎬', '🏠', '💡', '💊', '📚', '👤', '✈️', '💰', '🏦', '🏋️‍♂️', '🎾'
    ];
    const defaultCategoryIcons = [
        '🍔', '🛒', '🛍️', '🚗', '🎬', '🏠', '💡', '💊', '📚', '👤', '✈️', '💰', '🏦', '🏋️‍♂️', '🎾'
    ];
    
    // Credit card reminders storage
    let creditCardReminders = [];
    
    // Constants
    const STORAGE_KEYS = {
        TRANSACTIONS: 'personalFinance_transactions',
        CATEGORIES: 'personalFinance_categories',
        CREDIT_CARD_REMINDERS: 'personalFinance_creditCardReminders',
        BUDGETS: 'personalFinance_budgets'
    };
    
    // Initialize database from localStorage
    function init() {
        try {
            const savedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
            if (savedTransactions) {
                transactions = JSON.parse(savedTransactions);
                
                // Ensure each transaction has a valid date object
                transactions.forEach(transaction => {
                    transaction.date = new Date(transaction.date);
                });
            }
            
            const savedCategories = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
            if (savedCategories) {
                categories = JSON.parse(savedCategories);
            } else {
                // First time initialization - save default categories
                saveCategories();
            }
            
            // Load credit card reminders
            const savedReminders = localStorage.getItem(STORAGE_KEYS.CREDIT_CARD_REMINDERS);
            if (savedReminders) {
                creditCardReminders = JSON.parse(savedReminders);
                
                // Ensure dates are properly formatted
                creditCardReminders.forEach(reminder => {
                    reminder.dueDate = new Date(reminder.dueDate);
                    if (reminder.createdAt) reminder.createdAt = new Date(reminder.createdAt);
                    if (reminder.updatedAt) reminder.updatedAt = new Date(reminder.updatedAt);
                });
            }
            
            console.log('Database initialized with', transactions.length, 'transactions and', categories.length, 'categories');
        } catch (error) {
            console.error('Error initializing database:', error);
            // Reset to empty state if error occurs
            transactions = [];
            saveTransactions();
        }
    }
    
    // Save transactions to localStorage
    function saveTransactions() {
        try {
            localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
        } catch (error) {
            console.error('Error saving transactions:', error);
            
            // Check if it's a storage quota error
            if (error.name === 'QuotaExceededError' || error.code === 22) {
                return { error: 'Storage quota exceeded. Please export and clear some data.' };
            }
            
            return { error: 'Failed to save transactions.' };
        }
        
        return { success: true };
    }
    
    // Save categories to localStorage
    function saveCategories() {
        try {
            localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
        } catch (error) {
            console.error('Error saving categories:', error);
            return { error: 'Failed to save categories.' };
        }
        
        return { success: true };
    }
    
    // Add a new transaction
    function addTransaction(transaction) {
        // Validate transaction
        if (!transaction.date || !transaction.amount || !transaction.description || !transaction.type) {
            return { error: 'Invalid transaction data. All fields are required.' };
        }
        
        // Create a new transaction object with generated ID
        const newTransaction = {
            id: generateUniqueId(),
            date: new Date(transaction.date),
            amount: parseFloat(transaction.amount),
            description: transaction.description,
            category: transaction.category || 'Other',
            type: transaction.type,
            createdAt: new Date()
        };
        
        // Add to transactions array
        transactions.push(newTransaction);
        
        // Save to localStorage
        const saveResult = saveTransactions();
        if (saveResult.error) {
            return saveResult;
        }
        
        return { success: true, transaction: newTransaction };
    }
    
    // Bulk add transactions (for imports)
    function addTransactions(transactionsArray, source = 'manual') {
        const addedTransactions = [];
        const existingTransactionIds = new Set(transactions.map(t => t.id)); // Track existing transaction IDs

        transactionsArray.forEach(transaction => {
            // Generate a unique ID for the transaction based on its content
            const transactionId = generateTransactionId(transaction);

            // Skip if the transaction already exists
            if (existingTransactionIds.has(transactionId)) {
                console.log(`Duplicate transaction skipped: ${transactionId}`);
                return;
            }

            // Add source and ID to the transaction
            transaction.source = source;
            transaction.id = transactionId;

            transactions.push(transaction);
            addedTransactions.push(transaction);
        });

        saveTransactions(); // Save updated transactions to localStorage
        return { success: true, addedCount: addedTransactions.length };
    }

    // Generate a unique ID for a transaction
    function generateTransactionId(transaction) {
        const content = `${transaction.date}-${transaction.description}-${transaction.amount}`;
        return btoa(unescape(encodeURIComponent(content))); // Base64-encoded hash
    }
    
    // Update an existing transaction
    function updateTransaction(transactionId, updatedData) {
        const index = transactions.findIndex(t => t.id === transactionId);
        
        if (index === -1) {
            return { error: 'Transaction not found.' };
        }
        
        // Update the transaction
        transactions[index] = {
            ...transactions[index],
            date: new Date(updatedData.date || transactions[index].date),
            amount: parseFloat(updatedData.amount || transactions[index].amount),
            description: updatedData.description || transactions[index].description,
            category: updatedData.category || transactions[index].category,
            type: updatedData.type || transactions[index].type,
            updatedAt: new Date()
        };
        
        // Save to localStorage
        const saveResult = saveTransactions();
        if (saveResult.error) {
            return saveResult;
        }
        
        return { success: true, transaction: transactions[index] };
    }
    
    // Delete a transaction
    function deleteTransaction(transactionId) {
        const initialLength = transactions.length;
        transactions = transactions.filter(t => t.id !== transactionId);

        if (transactions.length === initialLength) {
            return { error: "Transaction not found." };
        }

        const saveResult = saveTransactions(); // Save updated transactions to storage
        if (saveResult.error) {
            return saveResult;
        }

        return { success: true };
    }
    
    // Get all transactions
    function getAllTransactions() {
        return [...transactions].sort((a, b) => b.date - a.date);
    }
    
    // Get transactions with filters
    function getTransactions(filters = {}) {
        return transactions.filter((transaction) => {
            if (filters.startDate && new Date(transaction.date) < filters.startDate) {
                return false;
            }
            if (filters.endDate && new Date(transaction.date) > filters.endDate) {
                return false;
            }
            if (filters.type && transaction.type !== filters.type) {
                return false;
            }
            if (filters.category && transaction.category !== filters.category) {
                return false;
            }
            if (filters.search && !transaction.description.toLowerCase().includes(filters.search)) {
                return false;
            }
            if (filters.sources && !filters.sources.includes(transaction.source || "manual")) {
                return false;
            }
            return true;
        });
    }
    
    // Get a specific transaction by ID
    function getTransaction(transactionId) {
        return transactions.find(t => t.id === transactionId);
    }
    
    // Get summary statistics
    function getSummary() {
        // Initialize summary object
        const summary = {
            totalBalance: 0,
            totalIncome: 0,
            totalExpenses: 0,
            categories: {}
        };
        
        // Calculate totals
        transactions.forEach(transaction => {
            const amount = parseFloat(transaction.amount);
            
            if (transaction.type === 'income') {
                summary.totalIncome += amount;
                summary.totalBalance += amount;
            } else {
                summary.totalExpenses += amount;
                summary.totalBalance -= amount;
                
                // Add to category totals
                if (!summary.categories[transaction.category]) {
                    summary.categories[transaction.category] = 0;
                }
                summary.categories[transaction.category] += amount;
            }
        });
        
        return summary;
    }
    
    // Get all categories
    function getCategories() {
        return [...categories]; // Return a copy of the categories array
    }

    // Get all category icons
    function getCategoryIcons() {
        return [...categoryIcons]; // Return a copy of the category icons array
    }
    
    // Add a new category
    function addCategory(categoryName) {
        if (!categoryName || typeof categoryName !== 'string') {
            return { error: 'Invalid category name.' };
        }
        
        const trimmedName = categoryName.trim();
        
        if (trimmedName === '') {
            return { error: 'Category name cannot be empty.' };
        }
        
        if (categories.includes(trimmedName)) {
            return { error: 'Category already exists.' };
        }
        
        categories.push(trimmedName);
        
        // Save to localStorage
        const saveResult = saveCategories();
        if (saveResult.error) {
            return saveResult;
        }
        
        return { success: true, category: trimmedName };
    }
    
    // Delete a category
    function deleteCategory(categoryName) {
        const index = categories.indexOf(categoryName);
        
        if (index === -1) {
            return { error: 'Category not found.' };
        }
        
        // Check if category is in use
        const isInUse = transactions.some(t => t.category === categoryName);
        
        if (isInUse) {
            return { error: `The category "${categoryName}" is linked to one or more transactions and cannot be deleted.` };
        }
        
        categories.splice(index, 1);
        
        // Save to localStorage
        const saveResult = saveCategories();
        if (saveResult.error) {
            return saveResult;
        }
        
        return { success: true };
    }
    
    // Export all data as JSON
    function exportData() {
        return {
            transactions: transactions,
            categories: categories,
            exportDate: new Date()
        };
    }
    
    // Import data from JSON
    function importData(data) {
        try {
            if (!data || !data.transactions || !Array.isArray(data.transactions)) {
                return { error: 'Invalid data format.' };
            }
            
            // Validate transactions format
            for (const transaction of data.transactions) {
                if (!transaction.id || !transaction.date || !transaction.amount || 
                    !transaction.description || !transaction.type) {
                    return { error: 'Invalid transaction format in import data.' };
                }
            }
            
            // Update transactions
            transactions = data.transactions.map(t => ({
                ...t,
                date: new Date(t.date)
            }));
            
            // Update categories if available
            if (data.categories && Array.isArray(data.categories)) {
                categories = data.categories;
            }
            
            // Save to localStorage
            const saveTransactionsResult = saveTransactions();
            if (saveTransactionsResult.error) {
                return saveTransactionsResult;
            }
            
            const saveCategoriesResult = saveCategories();
            if (saveCategoriesResult.error) {
                return saveCategoriesResult;
            }
            
            return { 
                success: true, 
                transactionCount: transactions.length,
                categoryCount: categories.length
            };
        } catch (error) {
            console.error('Error importing data:', error);
            return { error: 'Failed to import data: ' + error.message };
        }
    }
    
    // Save credit card reminders to localStorage
    function saveCreditCardReminders() {
        try {
            localStorage.setItem(STORAGE_KEYS.CREDIT_CARD_REMINDERS, JSON.stringify(creditCardReminders));
        } catch (error) {
            console.error('Error saving credit card reminders:', error);
            return { error: 'Failed to save credit card reminders.' };
        }
        
        return { success: true };
    }
    
    // Add a new credit card payment reminder
    function addCreditCardReminder(reminderData) {
        // Validate reminder data
        if (!reminderData.cardName || !reminderData.dueDate || !reminderData.amount) {
            return { error: 'Invalid reminder data. Card name, due date, and amount are required.' };
        }
        
        // Create a new reminder object with generated ID
        const newReminder = {
            id: generateUniqueId(),
            cardName: reminderData.cardName,
            dueDate: new Date(reminderData.dueDate),
            amount: parseFloat(reminderData.amount),
            reminderDays: reminderData.reminderDays || 5, // Default to 5 days before due date
            notes: reminderData.notes || '',
            isPaid: false,
            createdAt: new Date()
        };
        
        // Add to reminders array
        creditCardReminders.push(newReminder);
        
        // Save to localStorage
        const saveResult = saveCreditCardReminders();
        if (saveResult.error) {
            return saveResult;
        }
        
        return { success: true, reminder: newReminder };
    }
    
    // Update an existing credit card reminder
    function updateCreditCardReminder(reminderId, updatedData) {
        const index = creditCardReminders.findIndex(r => r.id === reminderId);
        
        if (index === -1) {
            return { error: 'Reminder not found.' };
        }
        
        // Update the reminder
        creditCardReminders[index] = {
            ...creditCardReminders[index],
            cardName: updatedData.cardName || creditCardReminders[index].cardName,
            dueDate: updatedData.dueDate ? new Date(updatedData.dueDate) : creditCardReminders[index].dueDate,
            amount: updatedData.amount !== undefined ? parseFloat(updatedData.amount) : creditCardReminders[index].amount,
            reminderDays: updatedData.reminderDays !== undefined ? updatedData.reminderDays : creditCardReminders[index].reminderDays,
            notes: updatedData.notes !== undefined ? updatedData.notes : creditCardReminders[index].notes,
            isPaid: updatedData.isPaid !== undefined ? updatedData.isPaid : creditCardReminders[index].isPaid,
            updatedAt: new Date()
        };
        
        // Save to localStorage
        const saveResult = saveCreditCardReminders();
        if (saveResult.error) {
            return saveResult;
        }
        
        return { success: true, reminder: creditCardReminders[index] };
    }
    
    // Delete a credit card reminder
    function deleteCreditCardReminder(reminderId) {
        const initialLength = creditCardReminders.length;
        creditCardReminders = creditCardReminders.filter(r => r.id !== reminderId);
        
        if (creditCardReminders.length === initialLength) {
            return { error: 'Reminder not found.' };
        }
        
        // Save to localStorage
        const saveResult = saveCreditCardReminders();
        if (saveResult.error) {
            return saveResult;
        }
        
        return { success: true };
    }
    
    // Mark a credit card payment as paid
    function markCreditCardReminderAsPaid(reminderId) {
        return updateCreditCardReminder(reminderId, { isPaid: true });
    }
    
    // Get all credit card reminders
    function getAllCreditCardReminders() {
        return [...creditCardReminders].sort((a, b) => a.dueDate - b.dueDate);
    }
    
    // Get upcoming credit card reminders (unpaid with due dates approaching)
    function getUpcomingCreditCardReminders() {
        const today = new Date();
        return creditCardReminders
            .filter(reminder => !reminder.isPaid && reminder.dueDate >= today)
            .sort((a, b) => a.dueDate - b.dueDate);
    }
    
    // Get overdue credit card reminders (unpaid with due dates in the past)
    function getOverdueCreditCardReminders() {
        const today = new Date();
        return creditCardReminders
            .filter(reminder => !reminder.isPaid && reminder.dueDate < today)
            .sort((a, b) => b.dueDate - a.dueDate); // Sort by most recently overdue first
    }
    
    // Get reminders with notification dates coming up (for displaying notifications)
    function getRemindersDueForNotification() {
        const today = new Date();
        
        return creditCardReminders.filter(reminder => {
            if (reminder.isPaid) return false;
            
            // Calculate reminder date (dueDate - reminderDays)
            const reminderDate = new Date(reminder.dueDate);
            reminderDate.setDate(reminderDate.getDate() - reminder.reminderDays);
            
            // Check if today is the reminder date or the due date
            const todayStr = today.toDateString();
            const reminderDateStr = reminderDate.toDateString();
            const dueDateStr = reminder.dueDate.toDateString();
            
            return todayStr === reminderDateStr || todayStr === dueDateStr;
        });
    }
    
    // Clear all data
    function clearData() {
        transactions = [];
        categories = defaultCategories;
        categoryIcons.splice(0, categoryIcons.length, ...defaultCategoryIcons); // Clear and repopulate the array
        creditCardReminders = [];
        
        // Remove from localStorage
        localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
        localStorage.removeItem(STORAGE_KEYS.CATEGORIES); // Remove categories from localStorage
        localStorage.removeItem(STORAGE_KEYS.CREDIT_CARD_REMINDERS);
        
        // Save default categories
        saveCategories();
        
        return { success: true };
    }
    
    // Utility function to generate unique ID
    function generateUniqueId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }
    
    // Budget management
    let budgets = {};

    function setBudget(category, amount) {
        budgets[category] = parseFloat(amount);
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
        return { success: true };
    }

    function getBudget(category) {
        return budgets[category] || 0;
    }

    function getAllBudgets() {
        return { ...budgets };
    }

    function getBudgets() {
        const budgetsList = [];
        for (const category in budgets) {
            budgetsList.push({
                category: category,
                amount: budgets[category]
            });
        }
        return budgetsList;
    }

    function deleteBudget(category) {
        delete budgets[category];
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
        return { success: true };
    }

    // Custom string-to-category mappings
    let customMappings = JSON.parse(localStorage.getItem('customMappings')) || {};

    /**
     * Add or update a custom mapping
     * @param {string} keyword - The string to map
     * @param {string} category - The category to map to
     */
    function addCustomMapping(keyword, category) {
        customMappings[keyword.toLowerCase()] = category;
        localStorage.setItem('customMappings', JSON.stringify(customMappings));
    }

    /**
     * Delete a custom mapping
     * @param {string} keyword - The string to remove
     */
    function deleteCustomMapping(keyword) {
        delete customMappings[keyword.toLowerCase()];
        localStorage.setItem('customMappings', JSON.stringify(customMappings));
    }

    /**
     * Get all custom mappings
     * @returns {Object} - The custom mappings
     */
    function getCustomMappings() {
        return { ...customMappings };
    }

    // Return public API
    return {
        init,
        addTransaction,
        addTransactions,
        updateTransaction,
        deleteTransaction,
        getAllTransactions,
        getTransactions,
        getTransaction,
        getSummary,
        getCategories,
        getCategoryIcons,
        addCategory,
        deleteCategory,
        exportData,
        importData,
        clearData,
        setBudget,
        getBudget,
        getAllBudgets,
        getBudgets,
        deleteBudget,
        // Credit card reminder methods
        addCreditCardReminder,
        updateCreditCardReminder,
        deleteCreditCardReminder,
        markCreditCardReminderAsPaid,
        getAllCreditCardReminders,
        getUpcomingCreditCardReminders,
        getOverdueCreditCardReminders,
        getRemindersDueForNotification,
        // Custom mapping methods
        addCustomMapping,
        deleteCustomMapping,
        getCustomMappings
    };
})();

// Initialize the database when script loads
document.addEventListener('DOMContentLoaded', function() {
    Database.init();
});
