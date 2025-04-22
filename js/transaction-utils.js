/**
 * Transaction Utilities module
 * Provides helper functions for working with transaction data
 */
const TransactionUtils = (function() {
    // Format currency amount
    function formatCurrency(amount, showPositiveSign = false) {
        // Remove the currency style to avoid double rupee signs
        const formatter = new Intl.NumberFormat('en-IN', {
            minimumFractionDigits: 2
        });

        const formattedAmount = formatter.format(Math.abs(amount));
        const prefix = showPositiveSign && amount > 0 ? '+₹' : amount < 0 ? '-₹' : '₹';
        return prefix + formattedAmount;
    }

    // Format date to readable string
    function formatDate(date) {
        if (!(date instanceof Date)) {
            date = new Date(date);
        }

        if (isNaN(date.getTime())) {
            return 'Invalid date';
        }

        return date.toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Group transactions by month
    function groupByMonth(transactions) {
        const groups = {};

        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

            if (!groups[yearMonth]) {
                groups[yearMonth] = [];
            }

            groups[yearMonth].push(transaction);
        });

        // Sort groups by year and month (descending)
        return Object.keys(groups)
            .sort((a, b) => b.localeCompare(a))
            .reduce((result, key) => {
                result[key] = groups[key];
                return result;
            }, {});
    }

    // Group transactions by category
    function groupByCategory(transactions) {
        const groups = {};

        transactions.forEach(transaction => {
            const category = transaction.category || 'Other';

            if (!groups[category]) {
                groups[category] = {
                    total: 0,
                    count: 0,
                    transactions: []
                };
            }

            groups[category].total += parseFloat(transaction.amount);
            groups[category].count += 1;
            groups[category].transactions.push(transaction);
        });

        return groups;
    }

    // Calculate category totals for expenses
    function getCategoryTotals(transactions) {
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const categoryGroups = groupByCategory(expenseTransactions);

        // Convert to array and sort by total (descending)
        return Object.keys(categoryGroups)
            .map(category => ({
                category: category,
                total: categoryGroups[category].total,
                count: categoryGroups[category].count
            }))
            .sort((a, b) => b.total - a.total);
    }

    // Get transactions for a specific month
    function getTransactionsForMonth(transactions, year, month) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        return transactions.filter(transaction => {
            const date = new Date(transaction.date);
            return date >= startDate && date <= endDate;
        });
    }

    // Get transactions for the current month
    function getCurrentMonthTransactions(transactions) {
        const now = new Date();
        return getTransactionsForMonth(transactions, now.getFullYear(), now.getMonth() + 1);
    }

    // Get monthly summary
    function getMonthlySummary(transactions) {
        const monthlySummary = {};

        // Group transactions by month
        const groupedByMonth = groupByMonth(transactions);

        for (const yearMonth in groupedByMonth) {
            const monthTransactions = groupedByMonth[yearMonth];

            // Calculate total income and expenses for the month
            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const expenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const balance = income - expenses;

            // Get month name
            const [year, month] = yearMonth.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            const monthName = date.toLocaleString('default', { month: 'long' });

            monthlySummary[yearMonth] = {
                year: parseInt(year),
                month: parseInt(month),
                monthName: monthName,
                income: income,
                expenses: expenses,
                balance: balance
            };
        }

        return monthlySummary;
    }

    // Get spending trends
    function getSpendingTrends(transactions, months = 6) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const trends = [];

        // Get data for the last specified number of months
        for (let i = 0; i < months; i++) {
            const month = currentMonth - i;
            const year = currentYear + Math.floor(month / 12);
            const adjustedMonth = ((month % 12) + 12) % 12; // Handle negative months

            const monthTransactions = getTransactionsForMonth(transactions, year, adjustedMonth + 1);

            const income = monthTransactions
                .filter(t => t.type === 'income')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const expenses = monthTransactions
                .filter(t => t.type === 'expense')
                .reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const date = new Date(year, adjustedMonth, 1);
            const monthName = date.toLocaleString('default', { month: 'short' });

            trends.unshift({
                month: monthName,
                year: year,
                income: income,
                expenses: expenses
            });
        }

        return trends;
    }

    // Export transactions to CSV
    function exportToCSV(transactions) {
        if (!transactions || transactions.length === 0) {
            return null;
        }

        // Define CSV headers
        const headers = ['Date', 'Description', 'Amount', 'Type', 'Category', 'Source'];
        let csvContent = headers.join(',') + '\n';

        // Add transaction rows
        transactions.forEach(transaction => {
            const date = formatDate(transaction.date);
            const description = `"${transaction.description.replace(/"/g, '""')}"`; // Escape quotes
            const amount = transaction.amount;
            const type = transaction.type;
            const category = transaction.category || 'Other';
            const source = transaction.source || 'Manual'; // Default to 'Manual' if no source is provided

            csvContent += [date, description, amount, type, category, source].join(',') + '\n';
        });

        return csvContent;
    }

    // Generate download link for CSV data
    function generateCSVDownload(csvContent, filename = 'transactions.csv') {
        if (!csvContent) {
            return null;
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    }

    // Export transactions to JSON
    function exportToJSON(data) {
        if (!data) {
            return null;
        }

        const jsonContent = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'finance_backup.json');
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        return true;
    }

    // Helper function to get category icon
    function getCategoryIcon(category) {
        switch (category) {
            case "Food & Dining": return "restaurant"; // Fork and knife icon
            case "Groceries": return "shopping_cart"; // Shopping cart icon
            case "Shopping": return "local_mall"; // Mall bag icon
            case "Transportation": return "directions_car"; // Car icon
            case "Entertainment": return "movie"; // Movie icon
            case "Housing": return "home"; // Home icon
            case "Utilities": return "bolt"; // Lightning bolt icon
            case "Health": return "medical_services"; // Medical services icon
            case "Education": return "school"; // School icon
            case "Personal": return "person"; // Person icon
            case "Travel": return "flight"; // Airplane icon
            case "Income": return "payments"; // Payments icon
            case "Banking & Finance": return "account_balance"; // Bank icon
            case "Other": return "category"; // Default category icon
            default: return "help_outline"; // Help icon for unknown categories
        }
    }

    /**
     * Guess category based on transaction description
     * @param {string} description - The transaction description
     * @returns {string} - The guessed category
     */
    function guessCategory(description) {
        const customMappings = Database.getCustomMappings();
        const descriptionLower = description.toLowerCase();

        // Check custom mappings first
        for (const [keyword, category] of Object.entries(customMappings)) {
            if (descriptionLower.includes(keyword)) {
                return category;
            }
        }

        /*...existing logic for guessing category...*/
    }

    function processImportedTransactions(transactions) {
        return transactions.map((transaction) => {
            if (!transaction.category) {
                transaction.category = guessCategory(transaction.description); // Apply custom mappings and fallback logic
            }
            return transaction;
        });
    }

    // Return public API
    return {
        formatCurrency,
        formatDate,
        groupByMonth,
        groupByCategory,
        getCategoryTotals,
        getTransactionsForMonth,
        getCurrentMonthTransactions,
        getMonthlySummary,
        getSpendingTrends,
        exportToCSV,
        generateCSVDownload,
        exportToJSON,
        getCategoryIcon,
        guessCategory,
        processImportedTransactions
    };
})();