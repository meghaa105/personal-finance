
/**
 * Splitwise Parser module for extracting transaction data from Splitwise CSV exports
 */
const SplitwiseParser = (function() {
    // Required headers for a valid Splitwise CSV
    const REQUIRED_HEADERS = ['Date', 'Description', 'Category', 'Cost'];

    // Splitwise CSV format headers
    const HEADER_MAPPINGS = {
        date: ['Date'],
        description: ['Description', 'Notes'],
        amount: ['Cost', 'Amount', 'Your share'],
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
                                console.log('Splitwise CSV headers:', results.meta.fields);
                                console.log('Sample row:', results.data[0]);

                                if (!results.data || !Array.isArray(results.data)) {
                                    reject(new Error('Invalid CSV data: Expected an array of rows'));
                                    return;
                                }

                                // Validate headers more flexibly
                                const headers = results.meta.fields || [];
                                const hasRequiredFields = headers.some(h => HEADER_MAPPINGS.date.includes(h)) &&
                                                        headers.some(h => HEADER_MAPPINGS.description.includes(h)) &&
                                                        headers.some(h => HEADER_MAPPINGS.amount.includes(h));
                                
                                if (!hasRequiredFields) {
                                    reject(new Error('Invalid Splitwise CSV: Missing required headers for date, description, or amount'));
                                    return;
                                }

                                let transactions = results.data
                                    .filter(row => row && typeof row === 'object')
                                    .filter(row => {
                                        if (!filterUser) return true;
                                        const userShare = parseFloat(row['Your share'] || '0');
                                        return userShare !== 0;
                                    })
                                    .map(row => {
                                        try {
                                            // Find date field
                                            const dateField = headers.find(h => HEADER_MAPPINGS.date.includes(h));
                                            const dateStr = row[dateField];
                                            if (!dateStr) return null;
                                            const date = new Date(dateStr);
                                            if (isNaN(date.getTime())) return null;

                                            // Find description field
                                            const descField = headers.find(h => HEADER_MAPPINGS.description.includes(h));
                                            const description = row[descField] || 'Unknown Splitwise Transaction';
                                            if (!description || description.trim().length === 0) return null;

                                            // Find amount field - prefer 'Your share' over 'Cost'
                                            let amount = 0;
                                            if (row['Your share']) {
                                                amount = Math.abs(parseFloat(row['Your share']));
                                            } else if (row['Cost']) {
                                                amount = Math.abs(parseFloat(row['Cost']));
                                            }
                                            
                                            if (isNaN(amount) || amount === 0) return null;

                                            // Extract currency
                                            const currency = row['Currency'] || 'INR';

                                            // Extract and map category
                                            let category = row['Category'] || '';
                                            category = mapSplitwiseCategory(category);

                                            // Set transaction type
                                            const type = 'expense';

                                            return {
                                                date,
                                                description: description.trim(),
                                                amount,
                                                category,
                                                type,
                                                source: 'splitwise',
                                                currency
                                            };
                                        } catch (error) {
                                            console.error('Error processing Splitwise row:', error, row);
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

    // Map Splitwise categories to standard categories
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
            'Travel': 'Travel',
            'General': 'Other',
            'Rent': 'Housing',
            'Movies': 'Entertainment',
            'Dining out': 'Food & Dining'
        };

        return categoryMap[splitwiseCategory] || 'Other';
    }

    return {
        parseCSV
    };
})();
