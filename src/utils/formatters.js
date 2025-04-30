/**
 * Format a number as Indian Rupees
 * @param {number} amount - The amount to format
 * @param {boolean} showPositiveSign - Whether to show + sign for positive amounts
 * @returns {string} Formatted currency string
 */
export function formatCurrency(amount, showPositiveSign = false) {
  const formatter = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2
  });

  const formattedAmount = formatter.format(Math.abs(amount));
  const prefix = showPositiveSign && amount > 0 ? '+₹' : amount < 0 ? '-₹' : '₹';
  return prefix + formattedAmount;
}

/**
 * Format a date to a readable string
 * @param {Date|string} date - The date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
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

/**
 * Group transactions by month
 * @param {Array} transactions - Array of transactions
 * @returns {Object} Transactions grouped by month
 */
export function groupByMonth(transactions) {
  const groups = {};

  transactions.forEach(transaction => {
    const date = new Date(transaction.date);
    const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

    if (!groups[yearMonth]) {
      groups[yearMonth] = [];
    }

    groups[yearMonth].push(transaction);
  });

  return Object.keys(groups)
    .sort((a, b) => b.localeCompare(a))
    .reduce((result, key) => {
      result[key] = groups[key];
      return result;
    }, {});
}

/**
 * Group transactions by category
 * @param {Array} transactions - Array of transactions
 * @returns {Object} Transactions grouped by category with totals
 */
export function groupByCategory(transactions) {
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