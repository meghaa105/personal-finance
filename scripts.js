document.addEventListener('DOMContentLoaded', () => {
    const transactions = document.querySelector('.transactions');
    // Ensure no filters are applied
    transactions.dataset.filter = ''; // Clear any default filter
});