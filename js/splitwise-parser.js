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
                                            
                                            if (isNaN(amount) || amount === 0) return null;

                                            // Extract currency
                                            const currency = row['Currency'] || 'INR';

                                            // Extract and map category
                                            let category = row['Category'] || '';
                                            category = mapSplitwiseCategory(category, row[descField]);

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
        if (!category && !description) return 'Other';
        
        const descriptionLower = description.toLowerCase();
        
        // Check for income keywords - Enhanced for Indian banks
        const incomeKeywords = ['salary', 'deposit', 'payment received', 'refund', 'transfer from', 'credit', 'cr', 'trf from', 'imps', 'neft', 'rtgs', 'upi', 'inward', 'by transfer', 'paid'];
        for (const keyword of incomeKeywords) {
            if (descriptionLower.includes(keyword)) {
                return 'Income';
            }
        }
        
        // Check for common expense categories - Optimized for Indian merchants and categories
        const categoryKeywords = {
            'Food & Dining': ['restaurant', 'cafe', 'coffee', 'diner', 'food', 'pizza', 'burger', 'mcdonalds', 'subway', 'swiggy', 'zomato', 'dominos', 'dosa', 'biryani', 'dhaba', 'thali', 'udupi', 'saravana', 'chaayos', 'barista', 'chai', 'eat', 'kitchen', 'sweet', 'mithai'],
            'Groceries': ['grocery', 'supermarket', 'market', 'big basket', 'bigbasket', 'dmart', 'reliance fresh', 'more', 'grofers', 'jiomart', 'blinkit', 'kirana', 'nature basket', 'spencers', 'star bazaar', 'vegetables', 'fruits', 'milk', 'provision'],
            'Shopping': ['amazon', 'flipkart', 'myntra', 'ajio', 'nykaa', 'meesho', 'tatacliq', 'shop', 'store', 'retail', 'clothing', 'apparel', 'snapdeal', 'lenskart', 'croma', 'reliance digital', 'vijay sales', 'lifestyle', 'pantaloons', 'westside', 'mall', 'bazaar'],
            'Transportation': ['uber', 'ola', 'rapido', 'taxi', 'auto', 'transit', 'train', 'irctc', 'railway', 'metro', 'bus', 'red bus', 'redbus', 'petrol', 'diesel', 'fuel', 'indian oil', 'hp', 'bharat petroleum', 'bpcl', 'toll', 'fastag'],
            'Entertainment': ['movie', 'cinema', 'pvr', 'inox', 'bookmyshow', 'theater', 'netflix', 'hotstar', 'disney+', 'amazon prime', 'sony liv', 'zee5', 'jio cinema', 'game', 'gaming', 'concert', 'event'],
            'Housing': ['rent', 'lease', 'maintenance', 'society', 'apartment', 'flat', 'property', 'home', 'housing', 'accommodation', 'builder', 'construction', 'repair', 'renovation'],
            'Utilities': ['electric', 'electricity', 'bill', 'water', 'internet', 'broadband', 'jio', 'airtel', 'bsnl', 'vi', 'vodafone', 'idea', 'tata sky', 'dth', 'gas', 'lpg', 'indane', 'utility', 'pipeline'],
            'Health': ['doctor', 'hospital', 'medical', 'apollo', 'fortis', 'max', 'medanta', 'medplus', 'pharmacy', 'pharmeasy', 'netmeds', 'tata 1mg', 'dental', 'vision', 'healthcare', 'clinic', 'diagnostic', 'lab', 'test', 'medicine', 'ayurvedic'],
            'Education': ['tuition', 'school', 'college', 'university', 'education', 'book', 'course', 'byjus', 'unacademy', 'vedantu', 'whitehat', 'cuemath', 'coaching', 'institute', 'academy', 'library', 'learning'],
            'Travel': ['travel', 'hotel', 'oyo', 'makemytrip', 'goibibo', 'booking.com', 'cleartrip', 'ixigo', 'trivago', 'airline', 'indigo', 'spicejet', 'vistara', 'air india', 'flight', 'vacation', 'trip', 'tourism', 'resort', 'package', 'goa', 'manali', 'kerala'],
            'Insurance': ['insurance', 'policy', 'premium', 'lic', 'health insurance', 'vehicle insurance', 'hdfc ergo', 'bajaj allianz', 'icici lombard', 'max bupa', 'star health', 'new india', 'mutual', 'term', 'life'],
            'Investments': ['investment', 'mutual fund', 'stocks', 'shares', 'demat', 'zerodha', 'groww', 'upstox', 'kuvera', 'uti', 'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'sip', 'nps', 'ppf', 'fixed deposit', 'fd', 'nifty', 'sensex'],
            'Sports': ['badminton', 'nvk', 'pullela', 'shuttles', 'baddy']
        };
        
        for (const [category1, keywords] of Object.entries(categoryKeywords)) {
            for (const keyword of keywords) {
                if (descriptionLower.includes(keyword)) {
                    return category1;
                }
            }
        }
        
        return 'Other';
    }

    return {
        parseCSV
    };
})();
