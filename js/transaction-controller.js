/**
 * Transactions Controller module
 * Handles all transaction-related operations including imports
 */
const TransactionsController = (function() {
    // DOM Elements
    const csvUploadInput = document.getElementById('csv-upload');
    const pdfUploadInput = document.getElementById('pdf-upload');
    const splitwiseUploadInput = document.getElementById('splitwise-upload');
    const importPreviewContent = document.getElementById('import-preview-content');
    const confirmImportBtn = document.getElementById('confirm-import');
    const csvUploadStatus = document.getElementById('csv-upload-status');
    const pdfUploadStatus = document.getElementById('pdf-upload-status');
    const splitwiseUploadStatus = document.getElementById('splitwise-upload-status');

    // Keep track of transactions to be imported
    let pendingImportTransactions = [];

    function init() {
        // Initialize DOM elements directly
        csvUploadInput = document.getElementById('csv-upload');
        pdfUploadInput = document.getElementById('pdf-upload');
        splitwiseUploadInput = document.getElementById('splitwise-upload');
        confirmImportBtn = document.getElementById('confirm-import');
        importPreviewContent = document.getElementById('import-preview-content');
        csvUploadStatus = document.getElementById('csv-upload-status');
        pdfUploadStatus = document.getElementById('pdf-upload-status');
        splitwiseUploadStatus = document.getElementById('splitwise-upload-status');

        // Log initialization state
        console.log('Transaction Controller Elements:', {
            csvUploadInput,
            pdfUploadInput,
            splitwiseUploadInput,
            confirmImportBtn,
            importPreviewContent,
            csvUploadStatus,
            pdfUploadStatus,
            splitwiseUploadStatus
        });

        setupEventListeners();
    }

    function setupEventListeners() {
        // Add event listeners with error handling
        const addSafeEventListener = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
                console.log(`Added ${event} listener to`, element);
            } else {
                console.error(`Failed to add ${event} listener - element not found`);
            }
        };

        // CSV Import
        addSafeEventListener(csvUploadInput, 'change', handleCSVUpload);
        
        // PDF Import
        addSafeEventListener(pdfUploadInput, 'change', handlePDFUpload);
        
        // Splitwise Import
        addSafeEventListener(splitwiseUploadInput, 'change', handleSplitwiseUpload);
        
        // Confirm Import
        addSafeEventListener(confirmImportBtn, 'click', confirmImport);

        // Add click handlers to file upload labels
        document.querySelectorAll('.file-upload label').forEach(label => {
            label.addEventListener('click', (e) => {
                const input = label.parentElement.querySelector('input[type="file"]');
                if (input) {
                    input.click();
                }
            });
        });
    }

    async function handleCSVUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            csvUploadStatus.textContent = 'Processing CSV file...';
            const transactions = await CSVParser.parseCSV(file);
            showImportPreview(transactions);
            csvUploadStatus.textContent = `Successfully processed ${transactions.length} transactions`;
        } catch (error) {
            console.error('CSV Import Error:', error);
            csvUploadStatus.textContent = 'Error processing CSV file: ' + error.message;
        }
    }

    async function handlePDFUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            pdfUploadStatus.textContent = 'Processing PDF file...';
            const transactions = await PDFParser.parsePDF(file);
            showImportPreview(transactions);
            pdfUploadStatus.textContent = `Successfully processed ${transactions.length} transactions`;
        } catch (error) {
            console.error('PDF Import Error:', error);
            pdfUploadStatus.textContent = 'Error processing PDF file: ' + error.message;
        }
    }

    async function handleSplitwiseUpload(event) {
        console.log('Handling Splitwise upload...');
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        splitwiseUploadStatus.textContent = 'Processing Splitwise file...';
        splitwiseUploadStatus.className = 'upload-status';
        
        try {
            console.log('Processing file:', file.name);
            console.log('Splitwise file:', file);
            splitwiseUploadStatus.textContent = 'Processing Splitwise file...';
            splitwiseUploadStatus.className = 'upload-status';

            // Check file extension
            if (!file.name.toLowerCase().endsWith('.csv')) {
                throw new Error('Please select a CSV file from Splitwise');
            }

        try {
            splitwiseUploadStatus.textContent = 'Processing Splitwise file...';
            splitwiseUploadStatus.className = 'upload-status';
            
            console.log('Starting Splitwise parse...');
            const result = await SplitwiseParser.parseCSV(file);
            console.log('Parse result:', result);
            
            if (result.success && result.transactions && result.transactions.length > 0) {
                pendingImportTransactions = result.transactions;
                showImportPreview(result.transactions);
                splitwiseUploadStatus.textContent = `Successfully processed ${result.transactions.length} transactions`;
                splitwiseUploadStatus.className = 'upload-status success';
                confirmImportBtn.disabled = false;
            } else {
                splitwiseUploadStatus.textContent = 'No valid transactions found in file';
                splitwiseUploadStatus.className = 'upload-status error';
                confirmImportBtn.disabled = true;
            }
        } catch (error) {
            console.error('Splitwise Import Error:', error);
            splitwiseUploadStatus.textContent = 'Error processing Splitwise file: ' + error.message;
            splitwiseUploadStatus.className = 'upload-status error';
            confirmImportBtn.disabled = true;
        }
    }

    function showImportPreview(transactions) {
        pendingImportTransactions = transactions;
        
        if (transactions.length === 0) {
            importPreviewContent.innerHTML = '<div class="empty-state">No valid transactions found in file</div>';
            confirmImportBtn.disabled = true;
            return;
        }

        let html = '<table class="import-preview-table">';
        html += '<thead><tr><th>Date</th><th>Description</th><th>Amount</th><th>Category</th><th>Type</th></tr></thead>';
        html += '<tbody>';

        transactions.slice(0, 10).forEach(transaction => {
            html += `
                <tr>
                    <td>${transaction.date.toLocaleDateString()}</td>
                    <td>${transaction.description}</td>
                    <td>${TransactionUtils.formatCurrency(transaction.amount)}</td>
                    <td>${transaction.category || 'Uncategorized'}</td>
                    <td>${transaction.type}</td>
                </tr>
            `;
        });

        if (transactions.length > 10) {
            html += `<tr><td colspan="5">... and ${transactions.length - 10} more transactions</td></tr>`;
        }

        html += '</tbody></table>';
        importPreviewContent.innerHTML = html;
        confirmImportBtn.disabled = false;
    }

    async function confirmImport() {
        if (pendingImportTransactions.length === 0) return;

        try {
            // Add transactions to database
            for (const transaction of pendingImportTransactions) {
                await Database.addTransaction(transaction);
            }

            // Clear the preview and pending transactions
            importPreviewContent.innerHTML = '<div class="success-message">Successfully imported transactions!</div>';
            pendingImportTransactions = [];
            confirmImportBtn.disabled = true;

            // Clear file inputs
            csvUploadInput.value = '';
            pdfUploadInput.value = '';
            splitwiseUploadInput.value = '';

            // Clear status messages
            csvUploadStatus.textContent = '';
            pdfUploadStatus.textContent = '';
            splitwiseUploadStatus.textContent = '';

            // Trigger event to refresh views
            document.dispatchEvent(new Event('transactions-updated'));
        } catch (error) {
            console.error('Import Error:', error);
            importPreviewContent.innerHTML = `<div class="error-message">Error importing transactions: ${error.message}</div>`;
        }
    }

    // Public API
    return {
        init: init
    };
})();