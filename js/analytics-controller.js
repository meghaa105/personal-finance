/**
 * Analytics Controller module
 * Manages data analytics, visualizations, and insights
 */
const AnalyticsController = (function() {
    // References to DOM elements
    const startDateInput = document.getElementById('start-date');
    const endDateInput = document.getElementById('end-date');
    const applyDateBtn = document.getElementById('apply-date-range');
    const categoryFiltersContainer = document.getElementById('category-filters');
    const searchInput = document.getElementById('analytics-search');
    const sourceFiltersContainer = document.getElementById('source-filters');
    
    // Chart references
    let categoryChart = null;
    let trendsChart = null;
    let cashFlowChart = null;
    let paymentMethodChart = null;
    
    // Current filter state
    let currentTimePeriod = 'month';
    let selectedCategories = [];
    let selectedSources = ['manual', 'csv', 'pdf'];
    let searchQuery = '';
    let customDateRange = {
        start: null,
        end: null
    };
    
    /**
     * Initialize the analytics controller
     */
    function init() {
        setupEventListeners();
        initializeDatePickers();
        updateCategoryFilters();
        refreshAnalytics();
    }
    
    /**
     * Set up event listeners for analytics components
     */
    function setupEventListeners() {
        // Time period filter buttons
        document.querySelectorAll('.time-filter-buttons .filter-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const period = this.getAttribute('data-period');
                document.querySelectorAll('.time-filter-buttons .filter-btn').forEach(b => {
                    b.classList.remove('active');
                });
                this.classList.add('active');
                
                // Show/hide custom date range inputs
                if (period === 'custom') {
                    document.querySelector('.custom-date-range').style.display = 'flex';
                } else {
                    document.querySelector('.custom-date-range').style.display = 'none';
                    applyTimePeriodFilter(period);
                }
            });
        });
        
        // Apply custom date range
        applyDateBtn.addEventListener('click', applyCustomDateRange);
        
        // Setup search functionality
        if (searchInput) {
            searchInput.addEventListener('input', function() {
                searchQuery = this.value.trim().toLowerCase();
                refreshAnalytics();
            });
        }
        
        // Setup source filter checkboxes
        if (sourceFiltersContainer) {
            document.querySelectorAll('#source-filters input[type="checkbox"]').forEach(checkbox => {
                checkbox.addEventListener('change', function() {
                    selectedSources = Array.from(
                        document.querySelectorAll('#source-filters input[type="checkbox"]:checked')
                    ).map(input => input.getAttribute('data-source'));
                    
                    refreshAnalytics();
                });
            });
        }
        
        // Listen for database changes
        document.addEventListener('transactions-updated', refreshAnalytics);
        document.addEventListener('categories-updated', updateCategoryFilters);
    }
    
    /**
     * Initialize date pickers with appropriate default values
     */
    function initializeDatePickers() {
        const today = new Date();
        
        // Set end date to today
        const endDateStr = today.toISOString().split('T')[0];
        endDateInput.value = endDateStr;
        
        // Set start date to 30 days ago
        const startDate = new Date();
        startDate.setDate(today.getDate() - 30);
        const startDateStr = startDate.toISOString().split('T')[0];
        startDateInput.value = startDateStr;
    }
    
    /**
     * Update category filter checkboxes based on available categories
     */
    function updateCategoryFilters() {
        const categories = Database.getCategories();
        
        if (categories.length === 0) {
            categoryFiltersContainer.innerHTML = '<div class="empty-state">No categories available</div>';
            return;
        }
        
        let html = '';
        categories.forEach(category => {
            const isChecked = selectedCategories.length === 0 || selectedCategories.includes(category);
            html += `
                <div class="category-checkbox">
                    <input type="checkbox" id="cat-${category}" data-category="${category}" ${isChecked ? 'checked' : ''}>
                    <label for="cat-${category}">${category}</label>
                </div>
            `;
        });
        
        categoryFiltersContainer.innerHTML = html;
        
        // Add event listeners to checkboxes
        document.querySelectorAll('.category-checkbox input').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Update selected categories
                selectedCategories = Array.from(
                    document.querySelectorAll('.category-checkbox input:checked')
                ).map(input => input.getAttribute('data-category'));
                
                refreshAnalytics();
            });
        });
    }
    
    /**
     * Apply time period filter
     * @param {string} period - Time period (month, quarter, year)
     */
    function applyTimePeriodFilter(period) {
        currentTimePeriod = period;
        customDateRange.start = null;
        customDateRange.end = null;
        
        refreshAnalytics();
    }
    
    /**
     * Apply custom date range filter
     */
    function applyCustomDateRange() {
        const startDate = new Date(startDateInput.value);
        const endDate = new Date(endDateInput.value);
        
        if (isNaN(startDate) || isNaN(endDate)) {
            // Show error
            return;
        }
        
        if (startDate > endDate) {
            // Show error
            return;
        }
        
        currentTimePeriod = 'custom';
        customDateRange.start = startDate;
        customDateRange.end = endDate;
        
        refreshAnalytics();
    }
    
    /**
     * Refresh all analytics data and visualizations
     */
    function refreshAnalytics() {
        const transactions = getFilteredTransactions();
        
        // Update summary statistics
        updateAnalyticsSummary(transactions);
        
        // Only update charts if analytics tab is active
        const analyticsTab = document.getElementById('analytics');
        if (analyticsTab && analyticsTab.classList.contains('active')) {
            try {
                updateCategoryChart(transactions);
            } catch (error) {
                console.error('Error updating category chart:', error);
            }

            try {
                updateTrendsChart(transactions);
            } catch (error) {
                console.error('Error updating trends chart:', error);
            }

            try {
                updateCashFlowChart(transactions);
            } catch (error) {
                console.error('Error updating cash flow chart:', error);
            }

            try {
                updatePaymentMethodChart(transactions);
            } catch (error) {
                console.error('Error updating payment method chart:', error);
            }

            try {
                AdvancedAnalytics.updateSavingsRateChart(transactions);
            } catch (error) {
                console.error('Error updating savings rate chart:', error);
            }

            try {
                AdvancedAnalytics.updateBudgetComparisonChart(transactions);
            } catch (error) {
                console.error('Error updating budget comparison chart:', error);
            }
        }
        
        // Update filtered transactions list
        updateFilteredTransactionsList(transactions);
    }
    
    /**
     * Get transactions filtered by current filter settings
     * @returns {Array} Filtered transactions
     */
    function getFilteredTransactions() {
        let filters = {};
        
        // Apply date filters
        const now = new Date();
        
        if (currentTimePeriod === 'custom' && customDateRange.start && customDateRange.end) {
            filters.startDate = customDateRange.start;
            filters.endDate = customDateRange.end;
        } else if (currentTimePeriod === 'month') {
            const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            filters.startDate = startDate;
            filters.endDate = now;
        } else if (currentTimePeriod === 'quarter') {
            const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
            const startDate = new Date(now.getFullYear(), quarterStartMonth, 1);
            filters.startDate = startDate;
            filters.endDate = now;
        } else if (currentTimePeriod === 'year') {
            const startDate = new Date(now.getFullYear(), 0, 1);
            filters.startDate = startDate;
            filters.endDate = now;
        }
        
        // Apply category filters
        if (selectedCategories.length > 0) {
            filters.categories = selectedCategories;
        }
        
        // Get transactions based on filters
        let transactions = Database.getTransactions(filters);
        
        // Apply search filter if there's a search query
        if (searchQuery) {
            transactions = transactions.filter(transaction => {
                return transaction.description.toLowerCase().includes(searchQuery) ||
                       (transaction.category && transaction.category.toLowerCase().includes(searchQuery));
            });
        }
        
        // Apply source filter
        if (selectedSources && selectedSources.length > 0) {
            transactions = transactions.filter(transaction => {
                // Determine transaction source (default to 'manual' if not specified)
                const source = transaction.source || 'manual';
                return selectedSources.includes(source);
            });
        }
        
        return transactions;
    }
    
    /**
     * Update analytics summary section with metrics
     * @param {Array} transactions - Filtered transactions
     */
    function updateAnalyticsSummary(transactions) {
        const totalSpendingEl = document.getElementById('total-spending');
        const totalIncomeEl = document.getElementById('total-income');
        const avgDailyExpenseEl = document.getElementById('avg-daily-expense');
        const maxExpenseDayEl = document.getElementById('max-expense-day');
        const monthlySavingsRateEl = document.getElementById('monthly-savings-rate');
        
        // Calculate metrics
        let totalSpending = 0;
        let totalIncome = 0;
        
        // Daily totals for calculations
        const dailyExpenses = {};
        
        transactions.forEach(transaction => {
            if (transaction.type === 'expense') {
                totalSpending += transaction.amount;
                
                // Track daily expenses
                const dateStr = new Date(transaction.date).toLocaleDateString('en-IN');
                dailyExpenses[dateStr] = (dailyExpenses[dateStr] || 0) + transaction.amount;
            } else {
                totalIncome += transaction.amount;
            }
        });
        
        // Calculate average daily expense
        let avgDailyExpense = 0;
        const dayCount = Object.keys(dailyExpenses).length || 1; // Avoid division by zero
        avgDailyExpense = totalSpending / dayCount;
        
        // Find max expense day
        let maxExpenseDay = 'None';
        let maxAmount = 0;
        
        for (const [dateStr, amount] of Object.entries(dailyExpenses)) {
            if (amount > maxAmount) {
                maxAmount = amount;
                maxExpenseDay = dateStr;
            }
        }
        
        // Calculate monthly savings rate
        let savingsRate = 0;
        if (totalIncome > 0) {
            savingsRate = ((totalIncome - totalSpending) / totalIncome) * 100;
        }
        
        // Update the UI
        totalSpendingEl.textContent = TransactionUtils.formatCurrency(totalSpending);
        totalIncomeEl.textContent = TransactionUtils.formatCurrency(totalIncome);
        avgDailyExpenseEl.textContent = TransactionUtils.formatCurrency(avgDailyExpense);
        maxExpenseDayEl.textContent = maxExpenseDay === 'None' ? 'None' : `${maxExpenseDay} (${TransactionUtils.formatCurrency(maxAmount)})`;
        monthlySavingsRateEl.textContent = savingsRate.toFixed(1) + '%';
    }
    
    /**
     * Update the category distribution chart
     * @param {Array} transactions - Filtered transactions
     */
    function updateCategoryChart(transactions) {
        const ctx = document.getElementById('category-chart').getContext('2d');
        
        // Filter expense transactions only
        const expenses = transactions.filter(t => t.type === 'expense');
        
        if (expenses.length === 0) {
            if (categoryChart) {
                categoryChart.destroy();
                categoryChart = null;
            }
            ctx.canvas.parentNode.style.display = 'flex';
            ctx.canvas.parentNode.style.justifyContent = 'center';
            ctx.canvas.parentNode.style.alignItems = 'center';
            ctx.canvas.style.display = 'none';
            ctx.canvas.parentNode.innerHTML = '<div class="empty-state">No expense data available</div>';
            return;
        }
        
        ctx.canvas.style.display = 'block';
        ctx.canvas.parentNode.style.display = 'block';
        
        // Group transactions by category
        const categoryTotals = {};
        expenses.forEach(transaction => {
            const category = transaction.category || 'Uncategorized';
            categoryTotals[category] = (categoryTotals[category] || 0) + transaction.amount;
        });
        
        const categories = Object.keys(categoryTotals);
        const amounts = Object.values(categoryTotals);
        
        // Generate colors for each category
        const colors = generateColors(categories.length);
        
        const data = {
            labels: categories,
            datasets: [{
                data: amounts,
                backgroundColor: colors
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    }
                }
            }
        };
        
        if (categoryChart) {
            categoryChart.destroy();
        }
        
        categoryChart = new Chart(ctx, {
            type: 'pie',
            data: data,
            options: options
        });
    }
    
    /**
     * Update the spending trends chart
     * @param {Array} transactions - Filtered transactions
     */
    function updateTrendsChart(transactions) {
        const ctx = document.getElementById('trends-chart').getContext('2d');
        
        // Group transactions by month
        const monthlyData = groupTransactionsByMonth(transactions);
        
        if (Object.keys(monthlyData.expenses).length === 0) {
            if (trendsChart) {
                trendsChart.destroy();
                trendsChart = null;
            }
            ctx.canvas.parentNode.style.display = 'flex';
            ctx.canvas.parentNode.style.justifyContent = 'center';
            ctx.canvas.parentNode.style.alignItems = 'center';
            ctx.canvas.style.display = 'none';
            ctx.canvas.parentNode.innerHTML = '<div class="empty-state">No trend data available</div>';
            return;
        }
        
        ctx.canvas.style.display = 'block';
        ctx.canvas.parentNode.style.display = 'block';
        
        const months = Object.keys(monthlyData.expenses).sort((a, b) => new Date(a) - new Date(b));
        const expenseData = months.map(month => monthlyData.expenses[month] || 0);
        const incomeData = months.map(month => monthlyData.income[month] || 0);
        
        const data = {
            labels: months,
            datasets: [
                {
                    label: 'Expenses',
                    data: expenseData,
                    backgroundColor: 'rgba(250, 82, 82, 0.5)',
                    borderColor: 'rgba(250, 82, 82, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(64, 192, 87, 0.5)',
                    borderColor: 'rgba(64, 192, 87, 1)',
                    borderWidth: 1
                }
            ]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `${context.dataset.label}: ₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    }
                }
            }
        };
        
        if (trendsChart) {
            trendsChart.destroy();
        }
        
        trendsChart = new Chart(ctx, {
            type: 'bar',
            data: data,
            options: options
        });
    }
    
    /**
     * Update the cash flow chart
     * @param {Array} transactions - Filtered transactions
     */
    function updateCashFlowChart(transactions) {
        const ctx = document.getElementById('cash-flow-chart').getContext('2d');
        
        if (transactions.length === 0) {
            if (cashFlowChart) {
                cashFlowChart.destroy();
                cashFlowChart = null;
            }
            ctx.canvas.parentNode.style.display = 'flex';
            ctx.canvas.parentNode.style.justifyContent = 'center';
            ctx.canvas.parentNode.style.alignItems = 'center';
            ctx.canvas.style.display = 'none';
            ctx.canvas.parentNode.innerHTML = '<div class="empty-state">No cash flow data available</div>';
            return;
        }
        
        ctx.canvas.style.display = 'block';
        ctx.canvas.parentNode.style.display = 'block';
        
        // Sort transactions by date
        const sortedTransactions = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Calculate running balance
        let balance = 0;
        const labels = [];
        const balanceData = [];
        
        sortedTransactions.forEach(transaction => {
            const date = new Date(transaction.date).toLocaleDateString('en-IN');
            if (transaction.type === 'income') {
                balance += transaction.amount;
            } else {
                balance -= transaction.amount;
            }
            
            labels.push(date);
            balanceData.push(balance);
        });
        
        const data = {
            labels: labels,
            datasets: [{
                label: 'Running Balance',
                data: balanceData,
                fill: true,
                backgroundColor: 'rgba(76, 110, 245, 0.2)',
                borderColor: 'rgba(76, 110, 245, 1)',
                tension: 0.1
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: true, // Ensure aspect ratio is maintained
            scales: {
                y: {
                    ticks: {
                        callback: function(value) {
                            return '₹' + value.toLocaleString('en-IN');
                        }
                    }
                },
                x: {
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `Balance: ₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    }
                }
            }
        };
        
        if (cashFlowChart) {
            cashFlowChart.destroy();
        }
        
        cashFlowChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: options
        });
    }
    
    /**
     * Update the payment method chart
     * @param {Array} transactions - Filtered transactions
     */
    function updatePaymentMethodChart(transactions) {
        const ctx = document.getElementById('payment-method-chart').getContext('2d');
        
        // Filter expense transactions only
        const expenses = transactions.filter(t => t.type === 'expense');
        
        if (expenses.length === 0) {
            if (paymentMethodChart) {
                paymentMethodChart.destroy();
                paymentMethodChart = null;
            }
            ctx.canvas.parentNode.style.display = 'flex';
            ctx.canvas.parentNode.style.justifyContent = 'center';
            ctx.canvas.parentNode.style.alignItems = 'center';
            ctx.canvas.style.display = 'none';
            ctx.canvas.parentNode.innerHTML = '<div class="empty-state">No payment method data available</div>';
            return;
        }
        
        ctx.canvas.style.display = 'block';
        ctx.canvas.parentNode.style.display = 'block';
        
        // Extract and group by payment methods
        const paymentMethods = extractPaymentMethods(expenses);
        
        const methods = Object.keys(paymentMethods);
        const amounts = Object.values(paymentMethods);
        
        // Generate colors
        const colors = generateColors(methods.length);
        
        const data = {
            labels: methods,
            datasets: [{
                data: amounts,
                backgroundColor: colors
            }]
        };
        
        const options = {
            responsive: true,
            maintainAspectRatio: true,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        boxWidth: 15,
                        font: {
                            size: 10
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.raw;
                            return `₹${value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                        }
                    }
                }
            }
        };
        
        if (paymentMethodChart) {
            paymentMethodChart.destroy();
        }
        
        paymentMethodChart = new Chart(ctx, {
            type: 'doughnut',
            data: data,
            options: options
        });
    }
    
    /**
     * Update the filtered transactions list
     * @param {Array} transactions - Filtered transactions
     */
    function updateFilteredTransactionsList(transactions) {
        const container = document.getElementById('analytics-transactions');
        
        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No transactions match the current filters</div>';
            return;
        }
        
        // Sort transactions by date (newest first)
        const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        let html = '';
        sortedTransactions.forEach(transaction => {
            const date = new Date(transaction.date).toLocaleDateString('en-IN');
            const amountClass = transaction.type === 'income' ? 'income' : 'expense';
            
            html += `
                <div class="transaction-item">
                    <div class="transaction-details">
                        <div class="transaction-title">${transaction.description}</div>
                        <div class="transaction-date">${date}</div>
                        <span class="transaction-category">${transaction.category || 'Uncategorized'}</span>
                    </div>
                    <div class="transaction-amount ${amountClass}">
                        ${transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }
    
    /**
     * Group transactions by month
     * @param {Array} transactions - Transactions array
     * @returns {Object} Object with income and expenses grouped by month
     */
    function groupTransactionsByMonth(transactions) {
        const monthlyData = {
            income: {},
            expenses: {}
        };
        
        transactions.forEach(transaction => {
            const date = new Date(transaction.date);
            const monthYear = `${date.toLocaleString('en-IN', { month: 'short' })} ${date.getFullYear()}`;
            
            if (transaction.type === 'income') {
                monthlyData.income[monthYear] = (monthlyData.income[monthYear] || 0) + transaction.amount;
            } else {
                monthlyData.expenses[monthYear] = (monthlyData.expenses[monthYear] || 0) + transaction.amount;
            }
        });
        
        return monthlyData;
    }
    
    /**
     * Extract payment methods from transactions
     * @param {Array} transactions - Expense transactions
     * @returns {Object} Object with payment methods and their total amounts
     */
    function extractPaymentMethods(transactions) {
        const paymentMethods = {};
        
        transactions.forEach(transaction => {
            // Use paymentMethod if available, otherwise use a fallback based on description
            let method = transaction.paymentMethod || 'Other';
            
            // Auto-detect common payment methods from description if not set
            const description = transaction.description.toLowerCase();
            if (!transaction.paymentMethod) {
                if (description.includes('upi') || description.includes('phonepe') || 
                    description.includes('gpay') || description.includes('google pay')) {
                    method = 'UPI';
                } else if (description.includes('neft') || description.includes('imps') || 
                           description.includes('rtgs') || description.includes('transfer')) {
                    method = 'Bank Transfer';
                } else if (description.includes('credit card') || description.includes('creditcard') || 
                           description.includes('cc') || description.includes('visa') || 
                           description.includes('mastercard') || description.includes('rupay')) {
                    method = 'Credit Card';
                } else if (description.includes('debit card') || description.includes('debitcard') || 
                           description.includes('dc') || description.includes('atm')) {
                    method = 'Debit Card';
                } else if (description.includes('cash') || description.includes('withdrawal')) {
                    method = 'Cash';
                } else if (description.includes('emi') || description.includes('loan')) {
                    method = 'EMI/Loan';
                } else if (description.includes('netbanking') || description.includes('net banking')) {
                    method = 'Net Banking';
                }
            }
            
            paymentMethods[method] = (paymentMethods[method] || 0) + transaction.amount;
        });
        
        return paymentMethods;
    }
    
    /**
     * Generate colors for charts
     * @param {number} count - Number of colors needed
     * @returns {Array} Array of color strings
     */
    function generateColors(count) {
        const baseColors = [
            'rgba(76, 110, 245, 0.8)',   // Primary blue
            'rgba(250, 82, 82, 0.8)',    // Danger red
            'rgba(64, 192, 87, 0.8)',    // Success green
            'rgba(255, 146, 43, 0.8)',   // Accent orange
            'rgba(150, 117, 206, 0.8)',  // Purple
            'rgba(23, 162, 184, 0.8)',   // Teal
            'rgba(255, 193, 7, 0.8)',    // Yellow
            'rgba(108, 117, 125, 0.8)'   // Gray
        ];
        
        const colors = [];
        
        // Use base colors for first few items
        for (let i = 0; i < count; i++) {
            if (i < baseColors.length) {
                colors.push(baseColors[i]);
            } else {
                // Generate additional colors with different opacity
                const index = i % baseColors.length;
                const opacity = 0.5 + (i / count) * 0.5; // Vary opacity
                const color = baseColors[index].replace(/[\d\.]+\)$/, `${opacity})`);
                colors.push(color);
            }
        }
        
        return colors;
    }
    
    // Public API
    return {
        init: init,
        refreshAnalytics: refreshAnalytics
    };
})();