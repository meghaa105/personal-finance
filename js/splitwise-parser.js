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

    async function parseCSV(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
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

                                const transactions = results.data
                                    .filter(row => row && typeof row === 'object')
                                    .map(row => {
                                        // Extract date - Splitwise uses YYYY-MM-DD format
                                        const date = row['Date'];
                                        if (!date) return null;

                                        // Extract description
                                        const description = row['Description'] || row['Notes'] || 'Unknown';

                                        // Extract amount - Splitwise uses 'Cost' or 'Amount' field
                                        const amount = parseFloat(row['Cost'] || row['Amount'] || '0');
                                        if (isNaN(amount) || amount === 0) return null;

                                        // Extract category
                                        const category = row['Category'] || 'Other';

                                        // Extract currency
                                        const currency = row['Currency'] || 'INR';

                                        // Create transaction object
                                        return {
                                            date: new Date(date),
                                            description,
                                            amount: Math.abs(amount),
                                            category,
                                            type: 'expense', // Splitwise entries are typically expenses
                                            source: 'splitwise',
                                            currency
                                        };
                                    })
                                    .filter(t => t !== null && t.date instanceof Date && !isNaN(t.date));

                                console.log(`Successfully parsed ${transactions.length} Splitwise transactions`);
                                resolve(transactions);
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

    return {
        parseCSV
    };
})();