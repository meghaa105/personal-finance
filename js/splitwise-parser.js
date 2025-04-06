/**
 * Splitwise Parser module for extracting transaction data from Splitwise CSV exports
 */
const SplitwiseParser = (function() {
    // Required headers for a valid Splitwise CSV
    const REQUIRED_HEADERS = ['Date', 'Description', 'Category', 'Cost'];

    // Splitwise CSV format headers
    const HEADER_MAPPINGS = {
        date: ['Date'],
        description: ['Description'],
        amount: ['Cost', 'Amount'],
        category: ['Category'],
        currency: ['Currency'],
        type: ['Type']
    };

    async function parseCSV(file, filterUser = null) {
        console.log('Starting Splitwise CSV parsing...');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                console.log('File loaded, beginning parse...');
                try {
                    const csvData = event.target.result;
                    Papa.parse(csvData, {
                        header: true,
                        skipEmptyLines: true,
                        complete: function(results) {
                            try {
                                if (!results.data || !Array.isArray(results.data)) {
                                    reject(new Error('Invalid CSV data: Expected an array of rows'));
                                    return;
                                }

                                // Validate that this is a Splitwise CSV
                                const headers = results.meta.fields || [];
                                const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
                                if (missingHeaders.length > 0) {
                                    reject(new Error(`Invalid Splitwise CSV: Missing required headers: ${missingHeaders.join(', ')}`));
                                    return;
                                }

                                console.log('Splitwise CSV headers:', headers);
                                console.log('Sample row:', results.data[0]);

                                let transactions = results.data
                                    .filter(row => row && typeof row === 'object')
                                    .filter(row => {
                                        if (!filterUser) return true;
                                        const userAmount = parseFloat(row[filterUser] || '0');
                                        return userAmount !== 0;
                                    })
                                    .map(row => {
                                        try {
                                            // Extract date - Splitwise uses YYYY-MM-DD format
                                            const dateStr = row['Date'];
                                            if (!dateStr) return null;
                                            const date = new Date(dateStr);
                                            if (isNaN(date.getTime())) return null;

                                            // Extract description
                                            const description = row['Description'] || row['Notes'] || 'Unknown';
                                            if (!description || description.trim().length === 0) return null;

                                            // Extract amount - Splitwise uses 'Cost' or 'Amount' field
                                            let amount = parseFloat(row['Cost'] || row['Amount'] || '0');
                                            if (isNaN(amount) || amount === 0) return null;

                                            // If we have user-specific amount, use that instead
                                            if (filterUser && row[filterUser]) {
                                                amount = Math.abs(parseFloat(row[filterUser]));
                                                if (isNaN(amount) || amount === 0) return null;
                                            }

                                            // Extract currency
                                            const currency = row['Currency'] || 'INR';

                                            // Extract and map category
                                            let category = row['Category'] || '';
                                            category = mapSplitwiseCategory(category);

                                            // Determine transaction type (expense by default)
                                            const type = 'expense';

                                            return {
                                                date,
                                                description,
                                                amount,
                                                category,
                                                type,
                                                source: 'splitwise',
                                                currency
                                            };
                                        } catch (error) {
                                            console.error('Error processing row:', error, row);
                                            return null;
                                        }
                                    })
                                    .filter(t => t !== null);

                                console.log(`Successfully parsed ${transactions.length} Splitwise transactions`);
                                resolve({
                                    success: true,
                                    transactions: transactions,
                                    rawData: results.data
                                });
                            } catch (error) {
                                console.error('Error parsing Splitwise data:', error);
                                reject(new Error('Failed to parse Splitwise data: ' + error.message));
                            }
                        },
                        error: function(error) {
                            console.error('Papa Parse error:', error);
                            reject(new Error('Failed to parse CSV: ' + error.message));
                        }
                    });
                } catch (error) {
                    console.error('File reading error:', error);
                    reject(new Error('Failed to read file: ' + error.message));
                }
            };
            reader.onerror = function(error) {
                console.error('FileReader error:', error);
                reject(new Error('Failed to read file: ' + error.message));
            };
            reader.readAsText(file);
        });
    }

    // Map Splitwise categories to our standard categories
    function mapSplitwiseCategory(splitwiseCategory) {
        const categoryMap = {
            'Food & Drink': 'Food & Dining',
            'Groceries': 'Groceries',
            'Shopping': 'Shopping',
            'Entertainment': 'Entertainment',
            'Home': 'Housing',
            'Transportation': 'Transportation',
            'Utilities': 'Utilities',
            'Medical': 'Health',
            'Education': 'Education',
            'Travel': 'Travel'
        };

        const category = categoryMap[splitwiseCategory] || 'Other';
        return category;
    }

    return {
        parseCSV
    };
})();