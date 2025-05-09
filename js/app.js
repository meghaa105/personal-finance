/**
 * Main application entry point
 * Initializes all components and ensures smooth operation
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize components
    console.log('Initializing application...');
    
    // First, load and initialize the database
    if (typeof Database !== 'undefined') {
        Database.init();
        console.log('Database initialized');
    } else {
        console.error('Database module not loaded');
    }
    
    // Initialize UI controller
    if (typeof UIController !== 'undefined') {
        UIController.init();
        console.log('UI Controller initialized');
    } else {
        console.error('UI Controller module not loaded');
    }
    
    // Setup clear data modal listeners
    if (typeof setupClearDataModalListeners === "function") {
        setupClearDataModalListeners();
    } else {
        console.error("setupClearDataModalListeners is not defined.");
    }
    
    // Initialize Reminder controller
    if (typeof ReminderController !== 'undefined') {
        ReminderController.init();
        console.log('Reminder Controller initialized');
    } else {
        console.error('Reminder Controller module not loaded');
    }
    
    // Initialize Analytics controller
    if (typeof AnalyticsController !== 'undefined') {
        AnalyticsController.init();
        console.log('Analytics Controller initialized');
        
        // Update category filters on page load
        AnalyticsController.updateCategoryFilters();
    } else {
        console.error('Analytics Controller module not loaded');
    }
    
    // Ensure category dropdown is populated on page load
    if (typeof populateCategoryDropdown === "function") {
        populateCategoryDropdown();
    } else {
        console.error("populateCategoryDropdown is not defined.");
    }
    
    // Check for PDF.js availability for PDF parsing
    if (typeof pdfjsLib === 'undefined') {
        console.warn('PDF.js library not loaded. PDF import may not work properly.');
    }
    
    // Check for Papa Parse availability for CSV parsing
    if (typeof Papa === 'undefined') {
        console.warn('Papa Parse library not loaded. CSV import may not work properly.');
    }
    
    // Add service worker for offline capability if supported
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            // Note: We're not actually registering a service worker here
            // as it would require additional files, but this is where you'd do it
            console.log('Service worker support detected. Could enable offline mode.');
        });
    }
    
    // Set up server port if needed
    const port = 5000;
    console.log(`App is configured to run on port ${port}.`);
    
    // Set up window variables
    window.appConfig = {
        version: '1.0.0',
        name: 'Personal Finance Manager (₹)',
        storagePrefix: 'personalFinance_'
    };
    
    // Hide all modals on load
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    
    // Log successful initialization
    console.log('Application initialized successfully!');

    // Initialize custom mappings feature
    if (typeof UIController !== 'undefined' && typeof UIController.populateCustomMappings === 'function') {
        UIController.populateCustomMappings();
    } else {
        console.error('UIController.populateCustomMappings is not defined.');
    }

    // Add event listener for adding custom mappings
    const addMappingBtn = document.getElementById('add-mapping-btn');
    if (addMappingBtn) {
        addMappingBtn.addEventListener('click', function() {
            if (typeof UIController !== 'undefined' && typeof UIController.handleAddCustomMapping === 'function') {
                UIController.handleAddCustomMapping();
            } else {
                console.error('UIController.handleAddCustomMapping is not defined.');
            }
        });
    } else {
        console.error('Add Mapping button not found.');
    }

    // Add event listeners for navigation tabs
    document.querySelectorAll('.tab-btn').forEach((tab) => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            UIController.switchTab(tabId);

            // Populate custom mappings when the tab is clicked
            if (tabId === 'custom-mappings') {
                UIController.populateCustomMappings();
            }
        });
    });
});

// Trigger Clear Data Modal
document.getElementById("clear-data").addEventListener("click", () => {
    const clearDataModal = document.getElementById("clear-data-confirmation");
    if (clearDataModal) {
        clearDataModal.style.display = "flex";
    }
});

document.getElementById("cancel-clear-data").addEventListener("click", () => {
    const clearDataModal = document.getElementById("clear-data-confirmation");
    if (clearDataModal) {
        clearDataModal.style.display = "none";
    }
});

// Trigger Rename File Modal
document.getElementById("rename-file-modal").addEventListener("click", () => {
    const renameFileModal = document.getElementById("rename-file-modal");
    if (renameFileModal) {
        renameFileModal.style.display = "block";
    }
});

document.getElementById("cancel-rename").addEventListener("click", () => {
    const renameFileModal = document.getElementById("rename-file-modal");
    if (renameFileModal) {
        renameFileModal.style.display = "none";
    }
});

// Apply filters button in the transactions page
document.getElementById("apply-transaction-filters").addEventListener("click", () => {
    if (typeof TransactionsPage.applyTransactionFilters === "function") {
        TransactionsPage.applyTransactionFilters();
        console.log("Transaction filters applied.");
    } else {
        console.error("TransactionsPage.applyTransactionFilters is not defined.");
    }
});

// Handle errors globally
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    // You could show a user-friendly error message here
    return false;
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    // You could show a user-friendly error message here
    return false;
});
