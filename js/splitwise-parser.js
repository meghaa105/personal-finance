/**
 * Splitwise Parser module for extracting transaction data from Splitwise CSV exports
 */
const SplitwiseParser = (function() {
    // Required headers for a valid Splitwise CSV
    const REQUIRED_HEADERS = ['Date', 'Description', 'Category', 'Cost', 'Currency'];

    // Splitwise CSV format headers
    const HEADER_MAPPINGS = {
        date: ['Date'],
        description: ['Description'],
        amount: ['Cost', 'Megha Agarwal'],
        category: ['Category'],
        currency: ['Currency']
    };

    function isSplitwiseFormat(headers) {
        return headers.includes('Date') && 
               headers.includes('Description') && 
               headers.includes('Category') && 
               headers.includes('Currency') && 
               (headers.includes('Cost') || headers.includes('Megha Agarwal'));
    }

    async function parseCSV(file, filterUser = null) {
        console.log('Starting Splitwise CSV parsing...', file);
        if (!file) {
            throw new Error('No file selected');
        }
        if (!file.name.toLowerCase().endsWith('.csv')) {
            throw new Error('Invalid file type. Please upload a Splitwise CSV file.');
        }
        if (file.size === 0) {
            throw new Error('File is empty');
        }
        console.log('HiFile loaded, beginning parse...');
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                console.log('File loaded, beginning parse...');
                try {
                    const csvData = event.target.result;
                    const hasRequiredFields = true; // Placeholder for actual field check
                    Papa.parse(csvData, {
                        header: true,
                        skipEmptyLines: true,
                        hasRequiredFields: hasRequiredFields,
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
                                console.log('CSV Headers:', headers);

                                // Ensure all required headers are present
                                const missingHeaders = REQUIRED_HEADERS.filter(h => !headers.includes(h));
                                console.log('HELLOO Missing headers:', missingHeaders);
                                if (missingHeaders.length > 0) {
                                    reject(new Error(`Missing required headers: ${missingHeaders.join(', ')}`));
                                    return;
                                }

                                if (!isSplitwiseFormat(headers)) {
                                    reject(new Error('Invalid Splitwise CSV format. Please make sure you are uploading a Splitwise export file.'));
                                    return;
                                }

                                let transactions = results.data
                                    .filter(row => row && typeof row === 'object')
                                    .filter(row => {
                                        if (!filterUser) return true;
                                        const userShare = parseFloat(row['Megha Agarwal'] || '0');
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

                                            // Find amount field - prefer 'Megha Agarwal' over 'Cost'
                                            let amount = 0;
                                            if (row['Megha Agarwal']) {
                                                amount = Math.abs(parseFloat(row['Megha Agarwal']));
                                            } else if (row['Cost']) {
                                                amount = Math.abs(parseFloat(row['Cost']));
                                            }
                                            console.log('Processing amount:', row['Your share'], row['Cost'], amount);
                                            
                                            if (isNaN(amount) || amount === 0) return null;

                                            // Extract currency
                                            const currency = row['Currency'] || 'INR';

                                            // Extract and map category
                                            let category = row['Category'] || '';
                                            category = mapSplitwiseCategory(category, row[descField]);

                                            // Determine transaction type
                                            const incomeCategories = ['Income', 'Investments', 'Refunds'];
                                            const isIncomeCategory = incomeCategories.includes(category);
                                            const isIncome = isIncomeCategory || /received|refund|credit|paid/i.test(description); // Include "paid" as income
                                            const isExpense = /spent|debit|expense|upi|transfer to/i.test(description);
                                            const type = isIncome ? "income" : isExpense ? "expense" : "expense"; // Default to expense

                                            return {
                                                date,
                                                description: description.trim(),
                                                amount,
                                                category: type === "income" ? "Income" : category,
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

                                if (transactions.length === 0) {
                                    reject(new Error('No valid transactions found in the file'));
                                    return;
                                }
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
    function mapSplitwiseCategory(category, description = '') {
        const customMappings = Database.getCustomMappings(); // Fetch custom mappings
        const descriptionLower = description.toLowerCase();

        // Check custom mappings first
        for (const [keyword, mappedCategory] of Object.entries(customMappings)) {
            if (descriptionLower.includes(keyword)) {
                return mappedCategory; // Return category from custom mappings
            }
        }

        // Enhanced category mappings
        const categoryKeywords = {
            'Food & Dining': ['restaurant', 'cafe', 'swiggy', 'zomato', 'dining', 'food', 'eatery', 'biryani', 'pizza', 'burger', 'snacks', 'beverages', 'coffee', 'tea', 'feast', 'meal', 'lunch', 'dinner', 'breakfast','cake'],
            'Groceries': ['grocery', 'supermarket', 'dmart', 'kirana', 'provisions', 'vegetables', 'fruits', 'daily needs', 'milk', 'bread', 'eggs'],
            'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'tatacliq', 'shop', 'store', 'retail', 'clothing', 'apparel', 'electronics', 'gadgets', 'accessories', 'mall', 'bazaar'],
            'Transportation': ['uber', 'ola', 'rapido', 'taxi', 'auto', 'train', 'bus', 'metro', 'fuel', 'petrol', 'diesel', 'toll', 'fastag', 'parking', 'cab'],
            'Entertainment': ['movie', 'cinema', 'pvr', 'inox', 'netflix', 'hotstar', 'prime', 'gaming', 'concert', 'event', 'bookmyshow', 'theater', 'recreation'],
            'Housing': ['rent', 'lease', 'maintenance', 'society', 'apartment', 'flat', 'property', 'home', 'housing', 'repair', 'renovation'],
            'Utilities': ['electricity', 'water', 'gas', 'internet', 'broadband', 'mobile', 'recharge', 'bill', 'dth', 'wifi', 'power', 'phone'],
            'Health': ['doctor', 'hospital', 'pharmacy', 'medicine', 'clinic', 'diagnostic', 'lab', 'test', 'healthcare', 'treatment', 'wellness'],
            'Education': ['tuition', 'school', 'college', 'university', 'course', 'coaching', 'learning', 'books', 'training', 'exam', 'certification'],
            'Travel': ['hotel', 'flight', 'travel', 'trip', 'vacation', 'tour', 'booking', 'resort', 'airbnb', 'holiday', 'tourism'],
            'Insurance': ['insurance', 'policy', 'premium', 'lic', 'health insurance', 'vehicle insurance', 'life insurance', 'term plan'],
            'Investments': ['investment', 'mutual fund', 'stocks', 'shares', 'demat', 'zerodha', 'groww', 'sip', 'nps', 'ppf', 'fd', 'rd'],
            'Banking & Finance': ['emi', 'loan', 'credit card', 'bank', 'transfer', 'neft', 'rtgs', 'imps', 'upi', 'interest', 'charges', 'fees'],
            'Miscellaneous': ['gift', 'donation', 'charity', 'misc', 'other', 'unknown']
        };

        // Match description against keywords
        for (const [mappedCategory, keywords] of Object.entries(categoryKeywords)) {
            if (keywords.some(keyword => descriptionLower.includes(keyword))) {
                return mappedCategory;
            }
        }

        // Default category if no match is found
        return 'Other';
    }

    return {
        parseCSV
    };
})();
