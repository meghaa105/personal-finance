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
        // Initialize DOM elements
        const elements = {
            csvUpload: document.getElementById('csv-upload'),
            pdfUpload: document.getElementById('pdf-upload'),
            splitwiseUpload: document.getElementById('splitwise-upload'),
            confirmImport: document.getElementById('confirm-import'),
            importPreview: document.getElementById('import-preview-content'),
            csvStatus: document.getElementById('csv-upload-status'),
            pdfStatus: document.getElementById('pdf-upload-status'),
            splitwiseStatus: document.getElementById('splitwise-upload-status')
        };

        // Validate all elements exist
        Object.entries(elements).forEach(([name, element]) => {
            if (!element) {
                console.error(`Missing DOM element: ${name}`);
            }
        });

        // Assign to module scope
        csvUploadInput = elements.csvUpload;
        pdfUploadInput = elements.pdfUpload;
        splitwiseUploadInput = elements.splitwiseUpload;
        confirmImportBtn = elements.confirmImport;
        importPreviewContent = elements.importPreview;
        csvUploadStatus = elements.csvStatus;
        pdfUploadStatus = elements.pdfStatus;
        splitwiseUploadStatus = elements.splitwiseStatus;

        setupEventListeners();
    }

    function setupEventListeners() {
        // CSV Import
        if (csvUploadInput) {
            csvUploadInput.addEventListener('change', handleCSVUpload);
        }
        
        // PDF Import
        if (pdfUploadInput) {
            pdfUploadInput.addEventListener('change', handlePDFUpload);
        }
        
        // Splitwise Import
        if (splitwiseUploadInput) {
            splitwiseUploadInput.addEventListener('change', handleSplitwiseUpload);
        }
        
        // Confirm Import
        if (confirmImportBtn) {
            confirmImportBtn.addEventListener('click', confirmImport);
        }
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
        const file = event.target.files[0];
        if (!file) return;

        const statusElement = document.getElementById('splitwise-upload-status');
        if (!statusElement) {
            console.error('Splitwise status element not found');
            return;
        }

        try {
            statusElement.textContent = 'Processing Splitwise file...';
            statusElement.className = 'upload-status';
            
            const transactions = await SplitwiseParser.parseCSV(file, 'Megha Agarwal');
            showImportPreview(transactions);
            
            statusElement.textContent = `Successfully processed ${transactions.length} transactions`;
            statusElement.className = 'upload-status success';
        } catch (error) {
            console.error('Splitwise Import Error:', error);
            statusElement.textContent = 'Error processing Splitwise file: ' + error.message;
            statusElement.className = 'upload-status error';
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