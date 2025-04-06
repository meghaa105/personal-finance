/**
 * UI Controller module
 * Manages UI interactions and DOM manipulation
 */
const UIController = (function() {
    // DOM selectors
    const DOM = {
        tabs: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        
        // Dashboard elements
        totalBalance: document.querySelector('.total-balance'),
        totalIncome: document.querySelector('.total-income'),
        totalExpenses: document.querySelector('.total-expenses'),
        expenseChart: document.getElementById('expense-chart'),
        recentTransactionsList: document.getElementById('recent-transactions-list'),
        
        // Transactions elements
        transactionsList: document.getElementById('transactions-list'),
        addTransactionBtn: document.getElementById('add-transaction-btn'),
        searchTransactions: document.getElementById('search-transactions'),
        filterType: document.getElementById('filter-type'),
        filterMonth: document.getElementById('filter-month'),
        
        // Import elements
        pdfUpload: document.getElementById('pdf-upload'),
        csvUpload: document.getElementById('csv-upload'),
        pdfUploadStatus: document.getElementById('pdf-upload-status'),
        csvUploadStatus: document.getElementById('csv-upload-status'),
        importPreviewContent: document.getElementById('import-preview-content'),
        confirmImportBtn: document.getElementById('confirm-import'),
        
        // Settings elements
        exportDataBtn: document.getElementById('export-data'),
        backupDataBtn: document.getElementById('backup-data'),
        restoreBackupInput: document.getElementById('restore-backup'),
        clearDataBtn: document.getElementById('clear-data'),
        categoriesList: document.getElementById('categories-list'),
        newCategoryInput: document.getElementById('new-category'),
        addCategoryBtn: document.getElementById('add-category-btn'),
        
        // Transaction modal
        transactionModal: document.getElementById('transaction-modal'),
        modalTitle: document.getElementById('modal-title'),
        transactionForm: document.getElementById('transaction-form'),
        transactionId: document.getElementById('transaction-id'),
        transactionDate: document.getElementById('transaction-date'),
        transactionAmount: document.getElementById('transaction-amount'),
        transactionType: document.getElementById('transaction-type'),
        transactionCategory: document.getElementById('transaction-category'),
        transactionDescription: document.getElementById('transaction-description'),
        saveTransactionBtn: document.getElementById('save-transaction'),
        cancelTransactionBtn: document.getElementById('cancel-transaction'),
        closeModal: document.querySelector('.close-modal'),
        
        // Confirmation modal
        confirmationModal: document.getElementById('confirmation-modal'),
        confirmDeleteBtn: document.getElementById('confirm-delete'),
        cancelDeleteBtn: document.getElementById('cancel-delete')
    };
    
    // Chart instances
    let expenseChartInstance = null;
    
    // Import data (for preview)
    let importData = null;
    
    // Transaction being deleted (for confirmation)
    let transactionToDelete = null;
    
    // Initialize UI
    function init() {
        // Set up tab navigation
        DOM.tabs.forEach(tab => {
            tab.addEventListener('click', function() {
                switchTab(this.dataset.tab);
            });
        });
        
        // Initialize the dashboard
        updateDashboard();
        
        // Initialize transactions list
        updateTransactionsList();
        
        // Set up transaction form events
        DOM.addTransactionBtn.addEventListener('click', showAddTransactionModal);
        DOM.transactionForm.addEventListener('submit', handleTransactionFormSubmit);
        DOM.cancelTransactionBtn.addEventListener('click', hideTransactionModal);
        DOM.closeModal.addEventListener('click', hideTransactionModal);
        
        // Set up transaction filters
        DOM.searchTransactions.addEventListener('input', applyTransactionFilters);
        DOM.filterType.addEventListener('change', applyTransactionFilters);
        DOM.filterMonth.addEventListener('change', applyTransactionFilters);
        
        // Set current month as default for month filter
        const now = new Date();
        DOM.filterMonth.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
        
        // Set up import handlers
        DOM.pdfUpload.addEventListener('change', handlePDFUpload);
        DOM.csvUpload.addEventListener('change', handleCSVUpload);
        DOM.confirmImportBtn.addEventListener('click', confirmImport);
        
        // Set up settings handlers
        DOM.exportDataBtn.addEventListener('click', exportTransactionsToCSV);
        DOM.backupDataBtn.addEventListener('click', backupAllData);
        DOM.restoreBackupInput.addEventListener('change', restoreFromBackup);
        DOM.clearDataBtn.addEventListener('click', confirmClearData);
        DOM.addCategoryBtn.addEventListener('click', addNewCategory);
        
        // Update categories list
        updateCategoriesList();
        
        // Populate transaction category dropdown
        populateCategoryDropdown();
        
        // Set up confirmation modal events
        DOM.confirmDeleteBtn.addEventListener('click', confirmDeleteTransaction);
        DOM.cancelDeleteBtn.addEventListener('click', cancelDeleteTransaction);
        
        // Set current date as default for new transactions
        const today = new Date().toISOString().split('T')[0];
        DOM.transactionDate.value = today;
        
        // Close modals when clicking outside
        window.addEventListener('click', function(event) {
            if (event.target === DOM.transactionModal) {
                hideTransactionModal();
            }
            if (event.target === DOM.confirmationModal) {
                cancelDeleteTransaction();
            }
        });
        
        console.log('UI Controller initialized');
    }
    
    // Switch active tab
    function switchTab(tabId) {
        // Update tab buttons
        DOM.tabs.forEach(tab => {
            if (tab.dataset.tab === tabId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
        
        // Update tab content
        DOM.tabContents.forEach(content => {
            if (content.id === tabId) {
                content.classList.add('active');
                
                // Refresh content for specific tabs
                if (tabId === 'dashboard') {
                    updateDashboard();
                } else if (tabId === 'transactions') {
                    updateTransactionsList();
                } else if (tabId === 'settings') {
                    updateCategoriesList();
                }
            } else {
                content.classList.remove('active');
            }
        });
    }
    
    // Update dashboard with latest data
    function updateDashboard() {
        const summary = Database.getSummary();
        
        // Update summary cards
        DOM.totalBalance.textContent = TransactionUtils.formatCurrency(summary.totalBalance);
        DOM.totalIncome.textContent = TransactionUtils.formatCurrency(summary.totalIncome);
        DOM.totalExpenses.textContent = TransactionUtils.formatCurrency(summary.totalExpenses);
        
        // Update expense chart
        updateExpenseChart(summary.categories);
        
        // Update recent transactions
        updateRecentTransactions();
    }
    
    // Update expense chart
    function updateExpenseChart(categories) {
        // Convert categories object to arrays for chart
        const categoryNames = [];
        const categoryAmounts = [];
        
        // Sort categories by amount (descending)
        const sortedCategories = Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5); // Show top 5 categories
        
        sortedCategories.forEach(([category, amount]) => {
            categoryNames.push(category);
            categoryAmounts.push(amount);
        });
        
        // If there are no categories, show a message
        if (categoryNames.length === 0) {
            if (expenseChartInstance) {
                expenseChartInstance.destroy();
                expenseChartInstance = null;
            }
            
            DOM.expenseChart.parentNode.innerHTML = '<div class="empty-state">No expense data to display</div>';
            return;
        }
        
        // Create or update chart
        if (expenseChartInstance) {
            expenseChartInstance.data.labels = categoryNames;
            expenseChartInstance.data.datasets[0].data = categoryAmounts;
            expenseChartInstance.update();
        } else {
            // If DOM element was replaced, get it again
            const chartCanvas = document.getElementById('expense-chart');
            
            if (!chartCanvas) {
                DOM.expenseChart.parentNode.innerHTML = '<canvas id="expense-chart"></canvas>';
            }
            
            const ctx = document.getElementById('expense-chart').getContext('2d');
            
            expenseChartInstance = new Chart(ctx, {
                type: 'doughnut',
                data: {
                    labels: categoryNames,
                    datasets: [{
                        data: categoryAmounts,
                        backgroundColor: [
                            '#4c6ef5', '#339af0', '#20c997', '#94d82d', '#fcc419'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                boxWidth: 12,
                                padding: 10,
                                font: {
                                    size: 10
                                }
                            }
                        },
                        title: {
                            display: true,
                            text: 'Top Expense Categories',
                            font: {
                                size: 14
                            }
                        }
                    }
                }
            });
        }
    }
    
    // Update recent transactions list
    function updateRecentTransactions() {
        const transactions = Database.getTransactions({ limit: 5 });
        
        if (transactions.length === 0) {
            DOM.recentTransactionsList.innerHTML = '<div class="empty-state">No transactions available</div>';
            return;
        }
        
        DOM.recentTransactionsList.innerHTML = '';
        
        transactions.forEach(transaction => {
            const transactionEl = createTransactionElement(transaction);
            DOM.recentTransactionsList.appendChild(transactionEl);
        });
    }
    
    // Update main transactions list
    function updateTransactionsList() {
        // Get filter values
        const searchValue = DOM.searchTransactions.value.trim();
        const typeFilter = DOM.filterType.value;
        
        let startDate, endDate;
        if (DOM.filterMonth.value) {
            const [year, month] = DOM.filterMonth.value.split('-');
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
        }
        
        // Apply filters
        const filters = {};
        
        if (searchValue) {
            filters.search = searchValue;
        }
        
        if (typeFilter !== 'all') {
            filters.type = typeFilter;
        }
        
        if (startDate) {
            filters.startDate = startDate;
        }
        
        if (endDate) {
            filters.endDate = endDate;
        }
        
        const transactions = Database.getTransactions(filters);
        
        if (transactions.length === 0) {
            DOM.transactionsList.innerHTML = '<div class="empty-state">No transactions match your filters</div>';
            return;
        }
        
        // Group transactions by month
        const transactionsByMonth = TransactionUtils.groupByMonth(transactions);
        
        DOM.transactionsList.innerHTML = '';
        
        // Create section for each month
        for (const yearMonth in transactionsByMonth) {
            const [year, month] = yearMonth.split('-');
            const date = new Date(parseInt(year), parseInt(month) - 1, 1);
            const monthName = date.toLocaleString('default', { month: 'long', year: 'numeric' });
            
            // Create month header
            const monthHeader = document.createElement('div');
            monthHeader.className = 'month-header';
            monthHeader.textContent = monthName;
            DOM.transactionsList.appendChild(monthHeader);
            
            // Add transactions for this month
            const monthTransactions = transactionsByMonth[yearMonth];
            monthTransactions.forEach(transaction => {
                const transactionEl = createTransactionElement(transaction, true);
                DOM.transactionsList.appendChild(transactionEl);
            });
        }
    }
    
    // Create transaction element
    function createTransactionElement(transaction, showActions = false) {
        const transactionEl = document.createElement('div');
        transactionEl.className = 'transaction-item';
        transactionEl.dataset.id = transaction.id;
        
        // Transaction details
        const details = document.createElement('div');
        details.className = 'transaction-details';
        
        const title = document.createElement('div');
        title.className = 'transaction-title';
        title.textContent = transaction.description;
        details.appendChild(title);
        
        const date = document.createElement('div');
        date.className = 'transaction-date';
        date.textContent = TransactionUtils.formatDate(transaction.date);
        details.appendChild(date);
        
        const category = document.createElement('div');
        category.className = 'transaction-category';
        category.textContent = transaction.category || 'Other';
        details.appendChild(category);
        
        transactionEl.appendChild(details);
        
        // Transaction amount
        const amount = document.createElement('div');
        amount.className = `transaction-amount ${transaction.type}`;
        amount.textContent = TransactionUtils.formatCurrency(transaction.amount, transaction.type === 'income');
        transactionEl.appendChild(amount);
        
        // Transaction actions (edit, delete)
        if (showActions) {
            const actions = document.createElement('div');
            actions.className = 'transaction-actions';
            
            const editBtn = document.createElement('button');
            editBtn.className = 'action-btn edit';
            editBtn.innerHTML = '<span class="material-icons">edit</span>';
            editBtn.addEventListener('click', () => showEditTransactionModal(transaction.id));
            actions.appendChild(editBtn);
            
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'action-btn delete';
            deleteBtn.innerHTML = '<span class="material-icons">delete</span>';
            deleteBtn.addEventListener('click', () => showDeleteConfirmation(transaction.id));
            actions.appendChild(deleteBtn);
            
            transactionEl.appendChild(actions);
        }
        
        return transactionEl;
    }
    
    // Apply transaction filters
    function applyTransactionFilters() {
        updateTransactionsList();
    }
    
    // Show add transaction modal
    function showAddTransactionModal() {
        // Reset form
        DOM.transactionForm.reset();
        DOM.transactionId.value = '';
        DOM.modalTitle.textContent = 'Add Transaction';
        
        // Set current date as default
        const today = new Date().toISOString().split('T')[0];
        DOM.transactionDate.value = today;
        
        // Show modal
        DOM.transactionModal.style.display = 'block';
    }
    
    // Show edit transaction modal
    function showEditTransactionModal(transactionId) {
        const transaction = Database.getTransaction(transactionId);
        
        if (!transaction) {
            alert('Transaction not found.');
            return;
        }
        
        // Set form values
        DOM.transactionId.value = transaction.id;
        DOM.transactionDate.value = new Date(transaction.date).toISOString().split('T')[0];
        DOM.transactionAmount.value = transaction.amount;
        DOM.transactionType.value = transaction.type;
        DOM.transactionCategory.value = transaction.category || 'Other';
        DOM.transactionDescription.value = transaction.description;
        
        // Update modal title
        DOM.modalTitle.textContent = 'Edit Transaction';
        
        // Show modal
        DOM.transactionModal.style.display = 'block';
    }
    
    // Hide transaction modal
    function hideTransactionModal() {
        DOM.transactionModal.style.display = 'none';
    }
    
    // Show delete confirmation modal
    function showDeleteConfirmation(transactionId) {
        transactionToDelete = transactionId;
        DOM.confirmationModal.style.display = 'block';
    }
    
    // Confirm delete transaction
    function confirmDeleteTransaction() {
        if (!transactionToDelete) {
            return;
        }
        
        const result = Database.deleteTransaction(transactionToDelete);
        
        if (result.success) {
            updateTransactionsList();
            updateDashboard();
        } else {
            alert('Error deleting transaction: ' + result.error);
        }
        
        DOM.confirmationModal.style.display = 'none';
        transactionToDelete = null;
    }
    
    // Cancel delete transaction
    function cancelDeleteTransaction() {
        DOM.confirmationModal.style.display = 'none';
        transactionToDelete = null;
    }
    
    // Handle transaction form submit
    function handleTransactionFormSubmit(event) {
        event.preventDefault();
        
        // Get form values
        const id = DOM.transactionId.value;
        const date = DOM.transactionDate.value;
        const amount = parseFloat(DOM.transactionAmount.value);
        const type = DOM.transactionType.value;
        const category = DOM.transactionCategory.value;
        const description = DOM.transactionDescription.value;
        
        // Validate form
        if (!date || isNaN(amount) || !description) {
            alert('Please fill in all required fields.');
            return;
        }
        
        // Create transaction object
        const transaction = {
            date,
            amount,
            type,
            category,
            description
        };
        
        let result;
        
        // Add or update transaction
        if (id) {
            result = Database.updateTransaction(id, transaction);
        } else {
            result = Database.addTransaction(transaction);
        }
        
        // Handle result
        if (result.success) {
            hideTransactionModal();
            updateTransactionsList();
            updateDashboard();
        } else {
            alert('Error saving transaction: ' + result.error);
        }
    }
    
    // Handle PDF upload
    async function handlePDFUpload(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }
        
        // Check file type
        if (file.type !== 'application/pdf') {
            DOM.pdfUploadStatus.textContent = 'Error: Please select a PDF file.';
            DOM.pdfUploadStatus.className = 'upload-status error';
            return;
        }
        
        // Show loading status
        DOM.pdfUploadStatus.textContent = 'Parsing PDF...';
        DOM.pdfUploadStatus.className = 'upload-status';
        
        try {
            // Parse PDF
            const result = await PDFParser.parsePDF(file);
            
            if (result.success && result.transactions.length > 0) {
                // Update status
                DOM.pdfUploadStatus.textContent = `Successfully parsed ${result.transactions.length} transactions.`;
                DOM.pdfUploadStatus.className = 'upload-status success';
                
                // Store import data
                importData = result.transactions;
                
                // Show preview
                showImportPreview(result.transactions);
                
                // Enable import button
                DOM.confirmImportBtn.disabled = false;
            } else {
                DOM.pdfUploadStatus.textContent = 'Error: No transactions found in the PDF.';
                DOM.pdfUploadStatus.className = 'upload-status error';
                
                // Disable import button
                DOM.confirmImportBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error parsing PDF:', error);
            DOM.pdfUploadStatus.textContent = 'Error parsing PDF: ' + error.message;
            DOM.pdfUploadStatus.className = 'upload-status error';
            
            // Disable import button
            DOM.confirmImportBtn.disabled = true;
        }
    }
    
    // Handle CSV upload
    async function handleCSVUpload(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }
        
        // Check file extension
        if (!file.name.endsWith('.csv')) {
            DOM.csvUploadStatus.textContent = 'Error: Please select a CSV file.';
            DOM.csvUploadStatus.className = 'upload-status error';
            return;
        }
        
        // Show loading status
        DOM.csvUploadStatus.textContent = 'Parsing CSV...';
        DOM.csvUploadStatus.className = 'upload-status';
        
        try {
            // Parse CSV
            const result = await CSVParser.parseCSV(file);
            
            if (result.success && result.transactions.length > 0) {
                // Update status
                DOM.csvUploadStatus.textContent = `Successfully parsed ${result.transactions.length} transactions.`;
                DOM.csvUploadStatus.className = 'upload-status success';
                
                // Store import data
                importData = result.transactions;
                
                // Show preview
                showImportPreview(result.transactions);
                
                // Enable import button
                DOM.confirmImportBtn.disabled = false;
            } else {
                DOM.csvUploadStatus.textContent = 'Error: No transactions found in the CSV.';
                DOM.csvUploadStatus.className = 'upload-status error';
                
                // Disable import button
                DOM.confirmImportBtn.disabled = true;
            }
        } catch (error) {
            console.error('Error parsing CSV:', error);
            DOM.csvUploadStatus.textContent = 'Error parsing CSV: ' + error.message;
            DOM.csvUploadStatus.className = 'upload-status error';
            
            // Disable import button
            DOM.confirmImportBtn.disabled = true;
        }
    }
    
    // Show import preview
    function showImportPreview(transactions) {
        if (!transactions || transactions.length === 0) {
            DOM.importPreviewContent.innerHTML = '<div class="empty-state">No transactions to preview</div>';
            return;
        }
        
        // Create preview table
        const table = document.createElement('table');
        table.className = 'preview-table';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const headers = ['Date', 'Description', 'Amount', 'Type', 'Category'];
        headers.forEach(header => {
            const th = document.createElement('th');
            th.textContent = header;
            headerRow.appendChild(th);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        // Show at most 10 transactions in preview
        const previewTransactions = transactions.slice(0, 10);
        
        previewTransactions.forEach(transaction => {
            const row = document.createElement('tr');
            
            const dateCell = document.createElement('td');
            dateCell.textContent = TransactionUtils.formatDate(transaction.date);
            row.appendChild(dateCell);
            
            const descriptionCell = document.createElement('td');
            descriptionCell.textContent = transaction.description;
            row.appendChild(descriptionCell);
            
            const amountCell = document.createElement('td');
            amountCell.textContent = TransactionUtils.formatCurrency(transaction.amount);
            row.appendChild(amountCell);
            
            const typeCell = document.createElement('td');
            typeCell.textContent = transaction.type;
            row.appendChild(typeCell);
            
            const categoryCell = document.createElement('td');
            categoryCell.textContent = transaction.category || 'Other';
            row.appendChild(categoryCell);
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        
        // If there are more transactions than shown in preview, add a message
        if (transactions.length > 10) {
            const message = document.createElement('div');
            message.className = 'preview-message';
            message.textContent = `Showing 10 of ${transactions.length} transactions.`;
            
            DOM.importPreviewContent.innerHTML = '';
            DOM.importPreviewContent.appendChild(table);
            DOM.importPreviewContent.appendChild(message);
        } else {
            DOM.importPreviewContent.innerHTML = '';
            DOM.importPreviewContent.appendChild(table);
        }
    }
    
    // Confirm import
    function confirmImport() {
        if (!importData || importData.length === 0) {
            alert('No transactions to import.');
            return;
        }
        
        // Add transactions to database
        const result = Database.addTransactions(importData);
        
        if (result.success) {
            alert(`Successfully imported ${result.count} transactions.`);
            
            // Reset import data
            importData = null;
            
            // Clear upload inputs
            DOM.pdfUpload.value = '';
            DOM.csvUpload.value = '';
            
            // Update status
            DOM.pdfUploadStatus.textContent = '';
            DOM.csvUploadStatus.textContent = '';
            
            // Clear preview
            DOM.importPreviewContent.innerHTML = '<div class="empty-state">No import data to preview</div>';
            
            // Disable import button
            DOM.confirmImportBtn.disabled = true;
            
            // Update dashboard and transactions list
            updateDashboard();
            
            // Switch to transactions tab
            switchTab('transactions');
        } else {
            alert('Error importing transactions: ' + result.error);
        }
    }
    
    // Export transactions to CSV
    function exportTransactionsToCSV() {
        const transactions = Database.getAllTransactions();
        
        if (transactions.length === 0) {
            alert('No transactions to export.');
            return;
        }
        
        const csvContent = TransactionUtils.exportToCSV(transactions);
        
        if (csvContent) {
            const today = new Date().toISOString().slice(0, 10);
            TransactionUtils.generateCSVDownload(csvContent, `transactions_${today}.csv`);
        } else {
            alert('Error generating CSV file.');
        }
    }
    
    // Backup all data
    function backupAllData() {
        const data = Database.exportData();
        
        if (data) {
            TransactionUtils.exportToJSON(data);
        } else {
            alert('Error creating backup data.');
        }
    }
    
    // Restore from backup
    function restoreFromBackup(event) {
        const file = event.target.files[0];
        
        if (!file) {
            return;
        }
        
        // Check file extension
        if (!file.name.endsWith('.json')) {
            alert('Please select a JSON backup file.');
            return;
        }
        
        // Read file
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);
                
                // Confirm before restoring
                if (confirm('This will replace all your current data with the backup. Continue?')) {
                    const result = Database.importData(data);
                    
                    if (result.success) {
                        alert(`Backup restored: ${result.transactionCount} transactions and ${result.categoryCount} categories imported.`);
                        
                        // Reset file input
                        DOM.restoreBackupInput.value = '';
                        
                        // Update UI
                        updateDashboard();
                        updateCategoriesList();
                        populateCategoryDropdown();
                    } else {
                        alert('Error restoring backup: ' + result.error);
                    }
                }
            } catch (error) {
                console.error('Error parsing backup file:', error);
                alert('Invalid backup file: ' + error.message);
            }
        };
        
        reader.readAsText(file);
    }
    
    // Confirm clear data
    function confirmClearData() {
        if (confirm('Are you sure you want to delete all your financial data? This cannot be undone!')) {
            if (confirm('FINAL WARNING: All transactions and custom categories will be permanently deleted.')) {
                const result = Database.clearData();
                
                if (result.success) {
                    alert('All data has been cleared.');
                    
                    // Update UI
                    updateDashboard();
                    updateCategoriesList();
                    populateCategoryDropdown();
                    
                    // Switch to dashboard tab
                    switchTab('dashboard');
                } else {
                    alert('Error clearing data: ' + result.error);
                }
            }
        }
    }
    
    // Update categories list
    function updateCategoriesList() {
        const categories = Database.getCategories();
        
        DOM.categoriesList.innerHTML = '';
        
        categories.forEach(category => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'category-item';
            
            const categoryName = document.createElement('span');
            categoryName.textContent = category;
            categoryEl.appendChild(categoryName);
            
            // Don't allow deleting default categories for now
            
            DOM.categoriesList.appendChild(categoryEl);
        });
    }
    
    // Add new category
    function addNewCategory() {
        const categoryName = DOM.newCategoryInput.value.trim();
        
        if (!categoryName) {
            alert('Please enter a category name.');
            return;
        }
        
        const result = Database.addCategory(categoryName);
        
        if (result.success) {
            // Clear input
            DOM.newCategoryInput.value = '';
            
            // Update categories list
            updateCategoriesList();
            
            // Update category dropdown
            populateCategoryDropdown();
        } else {
            alert('Error adding category: ' + result.error);
        }
    }
    
    // Populate category dropdown
    function populateCategoryDropdown() {
        const categories = Database.getCategories();
        
        // Clear existing options
        DOM.transactionCategory.innerHTML = '';
        
        // Add options
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            DOM.transactionCategory.appendChild(option);
        });
    }
    
    // Return public API
    return {
        init
    };
})();
