// DOM elements specific to the transactions page
const TransactionsPage = (function () {
    const DOM = {
        transactionsList: document.getElementById("transactions-list"),
        searchTransactions: document.getElementById("search-transactions"),
        filterType: document.getElementById("filter-type"),
        filterCategory: document.getElementById("filter-category"),
        filterMonth: document.getElementById("filter-month"),
        applyFiltersBtn: document.getElementById("apply-transaction-filters"),
    };

    /**
     * Update the transactions list in the UI
     * @param {Array} transactions - Array of transactions to display
     */
    function updateTransactionsList(transactions = null) {
        const container = DOM.transactionsList;

        // If no transactions are provided, fetch all transactions from the database
        if (!transactions) {
            transactions = Database.getAllTransactions();
        }

        if (transactions.length === 0) {
            container.innerHTML = '<div class="empty-state">No transactions available</div>';
            return;
        }

        container.innerHTML = ""; // Clear existing transactions

        transactions.forEach((transaction) => {
            const transactionEl = UIController.createTransactionElement(transaction, true); // Use UIController's function
            container.appendChild(transactionEl);
        });
    }

    /**
     * Apply transaction filters based on user input
     */
    function applyTransactionFilters() {
        const searchValue = DOM.searchTransactions.value.trim().toLowerCase();
        const typeFilter = DOM.filterType.value;
        const categoryFilter = DOM.filterCategory.value;
        const filterMonth = DOM.filterMonth.value;

        let startDate, endDate;
        if (filterMonth) {
            const [year, month] = filterMonth.split("-");
            startDate = new Date(year, month - 1, 1);
            endDate = new Date(year, month, 0);
        }

        const filters = {};
        if (searchValue) filters.search = searchValue;
        if (typeFilter !== "all") filters.type = typeFilter;
        if (categoryFilter !== "all") filters.category = categoryFilter;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;

        console.log("Filters applied:", filters); // Log the filters being applied

        const filteredTransactions = Database.getTransactions(filters);

        if (filteredTransactions && filteredTransactions.length > 0) {
            updateTransactionsList(filteredTransactions);
        } else {
            DOM.transactionsList.innerHTML = '<div class="empty-state">No transactions match the filters</div>';
        }
    }

    // Attach event listeners
    function setupEventListeners() {
        DOM.searchTransactions.addEventListener("input", applyTransactionFilters);
        DOM.filterType.addEventListener("change", applyTransactionFilters);
        DOM.filterMonth.addEventListener("change", applyTransactionFilters);
        DOM.filterCategory.addEventListener("change", applyTransactionFilters);
        DOM.applyFiltersBtn.addEventListener("click", applyTransactionFilters);
    }

    // Initialize the transactions page
    function init() {
        setupEventListeners();
        updateTransactionsList(); // Load all transactions initially
    }

    // Return public API
    return {
        init,
        applyTransactionFilters, // Expose this function
    };
})();

document.addEventListener("DOMContentLoaded", () => {
    TransactionsPage.init();
});
