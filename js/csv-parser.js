/**
 * CSV Parser module for extracting transaction data from CSV files
 * Uses Papa Parse for CSV parsing
 */
const CSVParser = (function() {
    // Common CSV headers for different banks and financial institutions
    const HEADER_MAPPINGS = {
        // Generic mappings
        date: ['date', 'transaction date', 'posted date', 'time', 'transaction time'],
        description: ['description', 'transaction description', 'merchant', 'name', 'payee', 'memo', 'notes', 'transaction'],
        amount: ['amount', 'transaction amount', 'sum', 'payment amount', 'withdrawal amount', 'deposit amount'],
        type: ['type', 'transaction type'],
        category: ['category', 'transaction category'],
        
        // Specific bank mappings
        'chase': {
            date: ['Transaction Date', 'Post Date'],
            description: ['Description', 'Merchant'],
            amount: ['Amount'],
            type: ['Type']
        },
        'bank_of_america': {
            date: ['Date', 'Posted Date'],
            description: ['Description', 'Payee'],
            amount: ['Amount'],
            type: ['Type']
        },
        'wells_fargo': {
            date: ['Date', 'Transaction Date'],
            description: ['Description'],
            amount: ['Amount'],
            type: ['Transaction Type']
        },
        'citi': {
            date: ['Date'],
            description: ['Description'],
            amount: ['Debit', 'Credit', 'Amount'],
            type: []
        },
        'capital_one': {
            date: ['Transaction Date', 'Posted Date'],
            description: ['Description', 'Payee'],
            amount: ['Debit', 'Credit', 'Amount'],
            type: ['Card No.', 'Transaction Type']
        },
        'amex': {
            date: ['Date'],
            description: ['Description'],
            amount: ['Amount'],
            type: ['Type', 'Category']
        }
    };
    
    // Parse CSV file
    function parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: function(results) {
                    try {
                        console.log('CSV parsing complete. Rows:', results.data.length);
                        console.log('Headers:', results.meta.fields);
                        
                        if (results.errors.length > 0) {
                            console.warn('CSV parse warnings:', results.errors);
                        }
                        
                        // No data found
                        if (results.data.length === 0) {
                            reject(new Error('No data found in the CSV file'));
                            return;
                        }
                        
                        // Map headers to standard format
                        const mappedData = mapHeaders(results.data, results.meta.fields);
                        
                        resolve({
                            success: true,
                            transactions: mappedData,
                            rawData: results.data,
                            headers: results.meta.fields
                        });
                    } catch (error) {
                        console.error('Error processing CSV data:', error);
                        reject(error);
                    }
                },
                error: function(error) {
                    console.error('Error parsing CSV:', error);
                    reject(error);
                }
            });
        });
    }
    
    // Map CSV headers to standard transaction format
    function mapHeaders(data, headers) {
        // Try to detect the bank format
        const bankFormat = detectBankFormat(headers);
        console.log('Detected bank format:', bankFormat || 'generic');
        
        // Get the appropriate header mappings
        const mappings = bankFormat ? HEADER_MAPPINGS[bankFormat] : null;
        
        // Map each row to standard transaction format
        return data.map((row, index) => {
            try {
                const transaction = {};
                
                // Extract date
                transaction.date = extractField(row, headers, 'date', mappings);
                
                // Extract description
                transaction.description = extractField(row, headers, 'description', mappings);
                
                // Extract amount
                const amountStr = extractField(row, headers, 'amount', mappings);
                let amount = parseAmount(amountStr, row, headers);
                
                // Determine transaction type (income/expense)
                const typeField = extractField(row, headers, 'type', mappings);
                let type = determineTransactionType(typeField, amount, row, headers);
                
                // Ensure amount is positive (type determines if it's an expense or income)
                amount = Math.abs(amount);
                
                transaction.amount = amount;
                transaction.type = type;
                
                // Extract category if available
                const categoryField = extractField(row, headers, 'category', mappings);
                if (categoryField) {
                    transaction.category = categoryField;
                } else {
                    // Guess category based on description
                    transaction.category = guessCategory(transaction.description);
                }
                
                return transaction;
            } catch (error) {
                console.error(`Error mapping row ${index}:`, error, row);
                return null;
            }
        }).filter(transaction => transaction !== null && validateTransaction(transaction));
    }
    
    // Extract field value using header mappings
    function extractField(row, headers, fieldType, mappings) {
        // Use bank-specific mappings if available
        const fieldMappings = mappings ? mappings[fieldType] : HEADER_MAPPINGS[fieldType];
        
        // Try to find a matching header
        for (const header of headers) {
            const headerLower = header.toLowerCase();
            
            // Check if this header matches any of the possible mappings
            const isMatch = fieldMappings.some(mapping => 
                headerLower === mapping.toLowerCase() || 
                headerLower.includes(mapping.toLowerCase())
            );
            
            if (isMatch) {
                return row[header];
            }
        }
        
        // Special case handling for specific banks
        if (fieldType === 'amount') {
            // Check for debit/credit columns
            for (const header of headers) {
                const headerLower = header.toLowerCase();
                
                if (headerLower.includes('debit') && row[header] && row[header].trim() !== '') {
                    return '-' + row[header]; // Debit is negative (expense)
                }
                
                if (headerLower.includes('credit') && row[header] && row[header].trim() !== '') {
                    return row[header]; // Credit is positive (income)
                }
            }
        }
        
        return '';
    }
    
    // Parse amount string to number
    function parseAmount(amountStr, row, headers) {
        if (!amountStr || amountStr.trim() === '') {
            // Look for debit/credit columns
            for (const header of headers) {
                const headerLower = header.toLowerCase();
                
                if (headerLower.includes('debit') && row[header] && row[header].trim() !== '') {
                    // Debit is negative (expense)
                    return -Math.abs(parseFloat(row[header].replace(/[$₹Rs\.,]/g, '')));
                }
                
                if (headerLower.includes('credit') && row[header] && row[header].trim() !== '') {
                    // Credit is positive (income)
                    return Math.abs(parseFloat(row[header].replace(/[$₹Rs\.,]/g, '')));
                }
            }
            
            return 0;
        }
        
        // Remove currency symbols and commas
        const cleanStr = amountStr.replace(/[$£€₹Rs\.,]/g, '');
        
        // Parse as float
        return parseFloat(cleanStr);
    }
    
    // Determine transaction type (income or expense)
    function determineTransactionType(typeField, amount, row, headers) {
        // If amount is negative, it's an expense
        if (amount < 0) {
            return 'expense';
        }
        
        // If amount is positive, it could be income or expense depending on the context
        // Check type field for clues
        if (typeField) {
            const typeLower = typeField.toLowerCase();
            
            if (typeLower.includes('debit') || 
                typeLower.includes('payment') || 
                typeLower.includes('purchase') || 
                typeLower.includes('withdrawal')) {
                return 'expense';
            }
            
            if (typeLower.includes('credit') || 
                typeLower.includes('deposit') || 
                typeLower.includes('refund') || 
                typeLower.includes('transfer from')) {
                return 'income';
            }
        }
        
        // Look for debit/credit columns
        for (const header of headers) {
            const headerLower = header.toLowerCase();
            
            if (headerLower.includes('debit') && row[header] && row[header].trim() !== '') {
                return 'expense';
            }
            
            if (headerLower.includes('credit') && row[header] && row[header].trim() !== '') {
                return 'income';
            }
        }
        
        // Default to expense if we can't determine
        return 'expense';
    }
    
    // Detect bank format based on headers
    function detectBankFormat(headers) {
        const headersLower = headers.map(h => h.toLowerCase());
        
        // Check for Chase format
        if (headersLower.includes('transaction date') && 
            headersLower.includes('description') && 
            headersLower.includes('amount')) {
            return 'chase';
        }
        
        // Check for Bank of America format
        if ((headersLower.includes('date') || headersLower.includes('posted date')) && 
            headersLower.includes('description') && 
            headersLower.includes('amount')) {
            return 'bank_of_america';
        }
        
        // Check for Wells Fargo format
        if (headersLower.includes('date') && 
            headersLower.includes('description') && 
            headersLower.includes('amount') && 
            headersLower.includes('transaction type')) {
            return 'wells_fargo';
        }
        
        // Check for Citi format
        if (headersLower.includes('date') && 
            headersLower.includes('description') && 
            (headersLower.includes('debit') || headersLower.includes('credit'))) {
            return 'citi';
        }
        
        // Check for Capital One format
        if ((headersLower.includes('transaction date') || headersLower.includes('posted date')) && 
            headersLower.includes('description') && 
            (headersLower.includes('debit') || headersLower.includes('credit') || headersLower.includes('amount'))) {
            return 'capital_one';
        }
        
        // Check for Amex format
        if (headersLower.includes('date') && 
            headersLower.includes('description') && 
            headersLower.includes('amount')) {
            return 'amex';
        }
        
        // If no specific format is detected, return null for generic mapping
        return null;
    }
    
    // Validate transaction data
    function validateTransaction(transaction) {
        // Check if required fields are present
        if (!transaction.date || !transaction.description || isNaN(transaction.amount)) {
            return false;
        }
        
        // Try to parse the date
        const date = new Date(transaction.date);
        if (isNaN(date.getTime())) {
            // If date is invalid, try to parse it using common formats
            transaction.date = parseDate(transaction.date);
            
            // If still invalid, return false
            if (!transaction.date) {
                return false;
            }
        } else {
            transaction.date = date;
        }
        
        return true;
    }
    
    // Parse date from various formats
    function parseDate(dateStr) {
        if (!dateStr) return null;
        
        // Prioritize Indian format - DD/MM/YYYY
        let match = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(dateStr);
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // Months are 0-indexed in JavaScript
            let year = parseInt(match[3]);
            
            // Validate the day and month (to ensure it's actually DD/MM/YYYY)
            if (day > 0 && day <= 31 && month >= 0 && month < 12) {
                // Adjust two-digit years
                if (year < 100) {
                    year = year < 50 ? 2000 + year : 1900 + year;
                }
                
                return new Date(year, month, day);
            }
        }
        
        // Try YYYY-MM-DD ISO format next (most reliable)
        match = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/.exec(dateStr);
        if (match) {
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // Months are 0-indexed in JavaScript
            const day = parseInt(match[3]);
            
            return new Date(year, month, day);
        }
        
        // Try to parse with built-in Date as fallback
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }
        
        // We already tried this format above, so we'll skip it here
        
        // Try DD.MM.YYYY format
        match = /(\d{1,2})\.(\d{1,2})\.(\d{2,4})/.exec(dateStr);
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // Months are 0-indexed in JavaScript
            let year = parseInt(match[3]);
            
            // Adjust two-digit years
            if (year < 100) {
                year = year < 50 ? 2000 + year : 1900 + year;
            }
            
            return new Date(year, month, day);
        }
        
        // If all else fails, return null
        return null;
    }
    
    // Guess category based on transaction description
    function guessCategory(description) {
        if (!description) return 'Other';
        
        const descriptionLower = description.toLowerCase();
        
        // Check for income keywords
        const incomeKeywords = ['salary', 'deposit', 'payment received', 'refund', 'transfer from'];
        for (const keyword of incomeKeywords) {
            if (descriptionLower.includes(keyword)) {
                return 'Income';
            }
        }
        
        // Check for common expense categories
        const categoryKeywords = {
            'Food & Dining': ['restaurant', 'cafe', 'coffee', 'diner', 'food', 'pizza', 'burger', 'mcdonalds', 'subway', 'taco', 'chipotle'],
            'Groceries': ['grocery', 'supermarket', 'market', 'walmart', 'target', 'kroger', 'safeway', 'trader joe', 'whole foods'],
            'Shopping': ['amazon', 'ebay', 'etsy', 'shop', 'store', 'retail', 'clothing', 'apparel'],
            'Transportation': ['uber', 'lyft', 'taxi', 'transit', 'train', 'subway', 'bus', 'metro', 'gas', 'parking'],
            'Entertainment': ['movie', 'cinema', 'theater', 'netflix', 'spotify', 'hulu', 'disney+', 'hbo', 'prime video', 'game'],
            'Housing': ['rent', 'mortgage', 'apartment', 'property', 'home', 'hoa'],
            'Utilities': ['electric', 'gas bill', 'water', 'internet', 'phone', 'cell', 'cable', 'utility'],
            'Health': ['doctor', 'hospital', 'medical', 'pharmacy', 'dental', 'vision', 'healthcare', 'clinic'],
            'Education': ['tuition', 'school', 'college', 'university', 'education', 'book', 'course'],
            'Travel': ['travel', 'hotel', 'airline', 'flight', 'airbnb', 'vacation', 'trip']
        };
        
        for (const [category, keywords] of Object.entries(categoryKeywords)) {
            for (const keyword of keywords) {
                if (descriptionLower.includes(keyword)) {
                    return category;
                }
            }
        }
        
        return 'Other';
    }
    
    // Return public API
    return {
        parseCSV
    };
})();
