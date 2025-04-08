/**
 * Advanced Analytics Module
 * Provides advanced financial analytics and visualizations
 */
const AdvancedAnalytics = (function() {
    // Chart instances
    let savingsRateChart = null;
    let budgetComparisonChart = null;
    let recurringExpensesChart = null;
    let categoryGrowthChart = null;
    let dailyPatternChart = null;
    let expenseForecastChart = null;

    /**
     * Calculate monthly savings rate
     * @param {Array} transactions - List of transactions
     * @returns {Object} Monthly savings data
     */
    function calculateMonthlySavings(transactions) {
        const monthlySavings = {};
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlySavings[monthKey]) {
                monthlySavings[monthKey] = { income: 0, expenses: 0 };
            }
            
            if (transaction.type === 'income') {
                monthlySavings[monthKey].income += transaction.amount;
            } else {
                monthlySavings[monthKey].expenses += transaction.amount;
            }
        });
        
        return Object.entries(monthlySavings).map(([month, data]) => ({
            month,
            savingsRate: data.income > 0 ? ((data.income - data.expenses) / data.income) * 100 : 0
        }));
    }

    /**
     * Identify recurring expenses based on description and amount patterns
     * @param {Array} transactions - List of transactions
     * @returns {Array} Recurring expense patterns
     */
    function findRecurringExpenses(transactions) {
        const patterns = {};
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        
        expenseTransactions.forEach(transaction => {
            const key = `${transaction.description}-${transaction.amount}`;
            if (!patterns[key]) {
                patterns[key] = {
                    description: transaction.description,
                    amount: transaction.amount,
                    count: 0,
                    dates: []
                };
            }
            patterns[key].count++;
            patterns[key].dates.push(new Date(transaction.date));
        });
        
        // Filter for transactions that occur at least 3 times
        return Object.values(patterns)
            .filter(pattern => pattern.count >= 3)
            .sort((a, b) => b.amount - a.amount);
    }

    /**
     * Calculate category-wise spending growth
     * @param {Array} transactions - List of transactions
     * @returns {Object} Category growth data
     */
    function calculateCategoryGrowth(transactions) {
        const monthlyCategory = {};
        
        transactions.forEach(transaction => {
            if (transaction.type !== 'expense') return;
            
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyCategory[monthKey]) {
                monthlyCategory[monthKey] = {};
            }
            
            if (!monthlyCategory[monthKey][transaction.category]) {
                monthlyCategory[monthKey][transaction.category] = 0;
            }
            
            monthlyCategory[monthKey][transaction.category] += transaction.amount;
        });
        
        return monthlyCategory;
    }

    /**
     * Analyze daily spending patterns
     * @param {Array} transactions - List of transactions
     * @returns {Object} Daily spending patterns
     */
    function analyzeDailyPatterns(transactions) {
        const dayPatterns = Array(7).fill(0);
        const dayCount = Array(7).fill(0);
        
        transactions.forEach(transaction => {
            if (transaction.type !== 'expense') return;
            
            const day = new Date(transaction.date).getDay();
            dayPatterns[day] += transaction.amount;
            dayCount[day]++;
        });
        
        // Calculate average spending per day
        return dayPatterns.map((total, index) => ({
            day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][index],
            average: dayCount[index] ? total / dayCount[index] : 0
        }));
    }

    /**
     * Generate expense forecast using simple moving average
     * @param {Array} transactions - List of transactions
     * @returns {Object} Forecast data
     */
    function generateExpenseForecast(transactions) {
        const monthlyExpenses = {};
        
        // Calculate monthly totals
        transactions.forEach(transaction => {
            if (transaction.type !== 'expense') return;
            
            const date = new Date(transaction.date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            if (!monthlyExpenses[monthKey]) {
                monthlyExpenses[monthKey] = 0;
            }
            
            monthlyExpenses[monthKey] += transaction.amount;
        });
        
        const months = Object.keys(monthlyExpenses).sort();
        const values = months.map(month => monthlyExpenses[month]);
        
        // Calculate 3-month moving average
        const forecast = [];
        for (let i = 2; i < values.length; i++) {
            const avg = (values[i] + values[i-1] + values[i-2]) / 3;
            forecast.push({
                month: months[i],
                actual: values[i],
                forecast: avg
            });
        }
        
        // Project next month
        const lastThree = values.slice(-3);
        const nextMonthForecast = lastThree.reduce((a, b) => a + b, 0) / 3;
        
        // Add next month projection
        const lastDate = new Date(months[months.length - 1]);
        lastDate.setMonth(lastDate.getMonth() + 1);
        const nextMonth = `${lastDate.getFullYear()}-${String(lastDate.getMonth() + 1).padStart(2, '0')}`;
        
        forecast.push({
            month: nextMonth,
            actual: null,
            forecast: nextMonthForecast
        });
        
        return forecast;
    }

    /**
     * Update savings rate chart
     * @param {Array} transactions - List of transactions
     */
    function updateSavingsRateChart(transactions) {
        const ctx = document.getElementById('savings-rate-chart')?.getContext('2d');
        if (!ctx) {
            console.error('Savings Rate Chart canvas element not found.');
            return;
        }

        const data = calculateMonthlySavings(transactions);
        if (!data || data.length === 0) {
            console.error('No data available for Monthly Savings Rate chart.');
            ctx.canvas.parentNode.innerHTML = '<div class="empty-state">No savings rate data available</div>';
            return;
        }

        if (savingsRateChart) {
            savingsRateChart.destroy();
        }

        savingsRateChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => d.month),
                datasets: [{
                    label: 'Monthly Savings Rate (%)',
                    data: data.map(d => d.savingsRate),
                    borderColor: '#4CAF50',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Savings Rate (%)'
                        }
                    }
                }
            }
        });
    }

    /**
     * Update recurring expenses chart
     * @param {Array} transactions - List of transactions
     */
    function updateRecurringExpensesChart(transactions) {
        const ctx = document.getElementById('recurring-expenses-chart').getContext('2d');
        const recurringExpenses = findRecurringExpenses(transactions);
        
        if (recurringExpensesChart) {
            recurringExpensesChart.destroy();
        }
        
        recurringExpensesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: recurringExpenses.map(e => e.description),
                datasets: [{
                    label: 'Monthly Amount',
                    data: recurringExpenses.map(e => e.amount),
                    backgroundColor: '#FF9800'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount'
                        }
                    }
                }
            }
        });
    }

    /**
     * Update category growth chart
     * @param {Array} transactions - List of transactions
     */
    function updateCategoryGrowthChart(transactions) {
        const ctx = document.getElementById('category-growth-chart').getContext('2d');
        const growthData = calculateCategoryGrowth(transactions);
        
        if (categoryGrowthChart) {
            categoryGrowthChart.destroy();
        }
        
        // Get unique categories and months
        const categories = new Set();
        Object.values(growthData).forEach(monthData => {
            Object.keys(monthData).forEach(category => categories.add(category));
        });
        
        const months = Object.keys(growthData).sort();
        const datasets = Array.from(categories).map((category, index) => ({
            label: category,
            data: months.map(month => growthData[month][category] || 0),
            borderColor: `hsl(${(index * 360) / categories.size}, 70%, 50%)`,
            tension: 0.1
        }));
        
        categoryGrowthChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: datasets
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount'
                        }
                    }
                }
            }
        });
    }

    /**
     * Update daily pattern chart
     * @param {Array} transactions - List of transactions
     */
    function updateDailyPatternChart(transactions) {
        const ctx = document.getElementById('daily-pattern-chart').getContext('2d');
        const patterns = analyzeDailyPatterns(transactions);
        
        if (dailyPatternChart) {
            dailyPatternChart.destroy();
        }
        
        dailyPatternChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: patterns.map(p => p.day),
                datasets: [{
                    label: 'Average Daily Spending',
                    data: patterns.map(p => p.average),
                    backgroundColor: 'rgba(156, 39, 176, 0.2)',
                    borderColor: '#9C27B0',
                    pointBackgroundColor: '#9C27B0'
                }]
            },
            options: {
                responsive: true,
                scales: {
                    r: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    /**
     * Update expense forecast chart
     * @param {Array} transactions - List of transactions
     */
    function updateExpenseForecastChart(transactions) {
        const ctx = document.getElementById('expense-forecast-chart').getContext('2d');
        const forecast = generateExpenseForecast(transactions);
        
        if (expenseForecastChart) {
            expenseForecastChart.destroy();
        }
        
        expenseForecastChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: forecast.map(f => f.month),
                datasets: [
                    {
                        label: 'Actual Expenses',
                        data: forecast.map(f => f.actual),
                        borderColor: '#2196F3',
                        tension: 0.1
                    },
                    {
                        label: 'Forecast',
                        data: forecast.map(f => f.forecast),
                        borderColor: '#F44336',
                        borderDash: [5, 5],
                        tension: 0.1
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount'
                        }
                    }
                }
            }
        });
    }

    /**
     * Update budget comparison chart
     * @param {Array} transactions - List of transactions
     * @param {Object} budgets - Category-wise budget amounts
     */
    function updateBudgetComparisonChart(transactions, budgets = {}) {
        const ctx = document.getElementById('budget-comparison-chart').getContext('2d');
        const categories = Object.keys(budgets);
        
        // Calculate actual spending by category
        const actualSpending = {};
        transactions.forEach(transaction => {
            if (transaction.type !== 'expense') return;
            if (!actualSpending[transaction.category]) {
                actualSpending[transaction.category] = 0;
            }
            actualSpending[transaction.category] += transaction.amount;
        });
        
        if (budgetComparisonChart) {
            budgetComparisonChart.destroy();
        }
        
        budgetComparisonChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categories,
                datasets: [
                    {
                        label: 'Budget',
                        data: categories.map(category => budgets[category] || 0),
                        backgroundColor: '#2196F3'
                    },
                    {
                        label: 'Actual',
                        data: categories.map(category => actualSpending[category] || 0),
                        backgroundColor: '#F44336'
                    }
                ]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Amount'
                        }
                    }
                }
            }
        });
    }

    /**
     * Update all advanced analytics charts
     * @param {Array} transactions - List of transactions
     * @param {Object} budgets - Category-wise budget amounts
     */
    function refreshAdvancedAnalytics(transactions, budgets = {}) {
        updateSavingsRateChart(transactions);
        updateBudgetComparisonChart(transactions, budgets);
        updateRecurringExpensesChart(transactions);
        updateCategoryGrowthChart(transactions);
        updateDailyPatternChart(transactions);
        updateExpenseForecastChart(transactions);
    }

    // Public API
    return {
        updateSavingsRateChart: updateSavingsRateChart,
        updateBudgetComparisonChart: updateBudgetComparisonChart,
        updateRecurringExpensesChart: updateRecurringExpensesChart,
        updateCategoryGrowthChart: updateCategoryGrowthChart,
        updateDailyPatternChart: updateDailyPatternChart,
        updateExpenseForecastChart: updateExpenseForecastChart,
        refreshAdvancedAnalytics: refreshAdvancedAnalytics
    };
})();
