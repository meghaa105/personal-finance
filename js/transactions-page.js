// DOM elements specific to the transactions page
const TransactionsPage = (function () {
    const DOM = {
        transactionsList: document.getElementById("transactions-list"),
        searchTransactions: document.getElementById("search-transactions"),
        filterType: document.getElementById("filter-type"),
        filterCategory: document.getElementById("filter-category"),
        applyFiltersBtn: document.getElementById("apply-transaction-filters"),
        startDate: document.getElementById("start-date"), // Add start date input
        endDate: document.getElementById("end-date"),     // Add end date input
        sourceFilters: document.querySelectorAll("#source-filters input[type='checkbox']"), // Add source filter checkboxes
    };

    /**
     * Show a loading spinner in the transactions list
     */
    function showLoadingSpinner() {
        DOM.transactionsList.innerHTML = `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading transactions...</p>
            </div>
        `;
    }

    /**
     * Update the transactions list in the UI
     * @param {Array} transactions - Array of transactions to display
     */
    function updateTransactionsList(transactions = null) {
        showLoadingSpinner(); // Show spinner while fetching data

        setTimeout(() => {
            const container = DOM.transactionsList;

            // If no transactions are provided, fetch all transactions from the database
            if (!transactions) {
                transactions = Database.getAllTransactions();
            }

            if (transactions.length === 0) {
                container.innerHTML = `
                    <div class="empty-state">
                        <span class="material-icons">search_off</span>
                        <p>No transactions available. Try adjusting your filters.</p>
                    </div>
                `;
                return;
            }

            container.innerHTML = ""; // Clear existing transactions

            transactions.forEach((transaction) => {
                const transactionEl = UIController.createTransactionElement(transaction, true); // Use UIController's function
                container.appendChild(transactionEl);
            });
        }, 500); // Simulate a delay for better UX
    }

    /**
     * Apply transaction filters based on user input
     */
    function applyTransactionFilters() {
        const searchValue = DOM.searchTransactions.value.trim().toLowerCase();
        const typeFilter = DOM.filterType.value;
        const categoryFilter = DOM.filterCategory.value;
        const startDate = DOM.startDate.value ? new Date(DOM.startDate.value) : null;
        const endDate = DOM.endDate.value ? new Date(DOM.endDate.value) : null;

        // Get selected sources and ensure uniqueness
        const selectedSources = Array.from(new Set(
            Array.from(DOM.sourceFilters)
                .filter((checkbox) => checkbox.checked)
                .map((checkbox) => checkbox.value)
        ));

        const filters = {};
        if (searchValue) filters.search = searchValue;
        if (typeFilter !== "all") filters.type = typeFilter;
        if (categoryFilter !== "all") filters.category = categoryFilter;
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
        if (selectedSources.length > 0) filters.sources = selectedSources;

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
        DOM.filterCategory.addEventListener("change", applyTransactionFilters);
        DOM.applyFiltersBtn.addEventListener("click", applyTransactionFilters);
        DOM.startDate.addEventListener("change", applyTransactionFilters);
        DOM.endDate.addEventListener("change", applyTransactionFilters);
        DOM.sourceFilters.forEach((checkbox) =>
            checkbox.addEventListener("change", applyTransactionFilters)
        );
    }

    // Initialize the transactions page
    function init() {
        setupEventListeners();
        updateTransactionsList(); // Load all transactions initially

        // Populate category dropdown in transaction filters
        if (DOM.filterCategory) {
            const categories = Database.getCategories(); // Fetch categories from the database
            DOM.filterCategory.innerHTML = '<option value="all">All Categories</option>'; // Default option

            categories.forEach((category) => {
                const option = document.createElement("option");
                option.value = category;
                option.textContent = category;
                DOM.filterCategory.appendChild(option);
            });
        }

        // Populate category dropdown in custom mappings
        const categoryDropdown = document.getElementById("mapping-category-dropdown");
        if (categoryDropdown) {
            const categories = Database.getCategories(); // Fetch categories from the database
            categoryDropdown.innerHTML = '<option value="" disabled selected>Select a category</option>'; // Default option

            categories.forEach((category) => {
                const option = document.createElement("option");
                option.value = category;
                option.textContent = category;
                categoryDropdown.appendChild(option);
            });
        }
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
