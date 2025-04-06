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
        name: 'PersonalFinance (₹)',
        storagePrefix: 'personalFinance_'
    };
    
    // Log successful initialization
    console.log('Application initialized successfully!');
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
