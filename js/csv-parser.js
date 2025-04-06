/**
 * CSV Parser module for extracting transaction data from CSV files
 * Uses Papa Parse for CSV parsing
 */
const CSVParser = (function() {
    // Common CSV headers for different banks and financial institutions
    const HEADER_MAPPINGS = {
        // Generic mappings
        date: ['date', 'transaction date', 'posted date', 'time', 'transaction time', 'tran date'],
        description: ['description', 'transaction description', 'merchant', 'name', 'payee', 'memo', 'notes', 'transaction', 'particulars'],
        amount: ['amount', 'transaction amount', 'sum', 'payment amount', 'withdrawal amount', 'deposit amount', 'dr', 'cr'],
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
        },
        'indian_bank': {
            date: ['Tran Date', 'Transaction Date', 'Value Date', 'Date'],
            description: ['PARTICULARS', 'Description', 'Narration', 'Transaction Remarks'],
            amount: ['DR', 'CR', 'Debit', 'Credit', 'Withdrawal Amt', 'Deposit Amt'],
            type: []
        },
        'sbi_bank': {
            date: ['Tran Date', 'Value Date', 'Date'],
            description: ['PARTICULARS', 'Description', 'Narration'],
            amount: ['DR', 'CR', 'Debit Amount', 'Credit Amount'],
            type: []
        },
        'hdfc_bank': {
            date: ['Date', 'Transaction Date', 'Value Date'],
            description: ['Narration', 'Particulars', 'Description'],
            amount: ['Withdrawal Amt(INR)', 'Deposit Amt(INR)', 'Debit', 'Credit'],
            type: []
        },
        'axis_bank': {
            date: ['Tran Date', 'Date', 'Transaction Date'],
            description: ['PARTICULARS', 'Transaction Remarks', 'Description'],
            amount: ['DR', 'CR', 'Debit Amount', 'Credit Amount'],
            type: []
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
            // Special case for Indian bank formats with DR/CR columns
            const drColumn = headers.find(h => h.toLowerCase() === 'dr');
            const crColumn = headers.find(h => h.toLowerCase() === 'cr');
            
            if (drColumn && crColumn) {
                // If both DR and CR columns exist (Indian bank format)
                if (row[drColumn] && row[drColumn].trim() !== '') {
                    // Debit/DR is negative (expense)
                    const amount = row[drColumn].replace(/[$₹Rs.,]/g, '').trim();
                    if (amount && !isNaN(parseFloat(amount))) {
                        return -Math.abs(parseFloat(amount));
                    }
                }
                
                if (row[crColumn] && row[crColumn].trim() !== '') {
                    // Credit/CR is positive (income)
                    const amount = row[crColumn].replace(/[$₹Rs.,]/g, '').trim();
                    if (amount && !isNaN(parseFloat(amount))) {
                        return Math.abs(parseFloat(amount));
                    }
                }
            }
            
            // Look for other debit/credit columns
            for (const header of headers) {
                const headerLower = header.toLowerCase();
                
                if ((headerLower.includes('debit') || headerLower === 'dr') && 
                    row[header] && row[header].trim() !== '') {
                    // Debit is negative (expense)
                    const amount = row[header].replace(/[$₹Rs.,]/g, '').trim();
                    if (amount && !isNaN(parseFloat(amount))) {
                        return -Math.abs(parseFloat(amount));
                    }
                }
                
                if ((headerLower.includes('credit') || headerLower === 'cr') && 
                    row[header] && row[header].trim() !== '') {
                    // Credit is positive (income)
                    const amount = row[header].replace(/[$₹Rs.,]/g, '').trim();
                    if (amount && !isNaN(parseFloat(amount))) {
                        return Math.abs(parseFloat(amount));
                    }
                }
            }
            
            return 0;
        }
        
        // Remove currency symbols and commas
        const cleanStr = amountStr.replace(/[$£€₹Rs.,]/g, '').trim();
        
        // Parse as float
        if (cleanStr && !isNaN(parseFloat(cleanStr))) {
            return parseFloat(cleanStr);
        }
        
        return 0;
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
        
        // Check for Indian bank formats - updated for better detection of various Indian banks
        // SBI Bank format - specifically looking for the common SBI statement format
        if ((headersLower.includes('tran date') || headersLower.includes('date')) && 
            (headersLower.includes('particulars')) && 
            (headersLower.includes('dr') && headersLower.includes('cr') && headersLower.includes('bal'))) {
            console.log("Detected SBI bank format");
            return 'sbi_bank';
        }
        
        // HDFC Bank format
        if ((headersLower.includes('date') || headersLower.includes('value date')) && 
            (headersLower.includes('narration') || headersLower.includes('particulars')) && 
            (headersLower.includes('withdrawal amt') || headersLower.includes('deposit amt') || 
             headersLower.includes('withdrawal amt(inr)') || headersLower.includes('deposit amt(inr)'))) {
            console.log("Detected HDFC bank format");
            return 'hdfc_bank';
        }
        
        // Axis Bank format
        if ((headersLower.includes('tran date') || headersLower.includes('date')) && 
            (headersLower.includes('particulars') || headersLower.includes('transaction remarks')) && 
            (headersLower.includes('dr') || headersLower.includes('cr') || 
             headersLower.includes('debit amount') || headersLower.includes('credit amount'))) {
            console.log("Detected Axis bank format");
            return 'axis_bank';
        }
        
        // Generic Indian bank format
        if ((headersLower.includes('tran date') || headersLower.includes('transaction date') || headersLower.includes('value date')) && 
            (headersLower.includes('particulars') || headersLower.includes('description') || headersLower.includes('narration')) && 
            (headersLower.includes('dr') || headersLower.includes('cr') || 
             headersLower.includes('debit') || headersLower.includes('credit') ||
             headersLower.includes('withdrawal') || headersLower.includes('deposit'))) {
            console.log("Detected generic Indian bank format");
            return 'indian_bank';
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
        
        // Skip rows with non-transaction data (common in Indian bank statements)
        if (transaction.description.toLowerCase().includes('legend') || 
            transaction.description.toLowerCase().includes('opening balance') ||
            transaction.description.toLowerCase().includes('closing balance') ||
            transaction.description.toLowerCase().includes('statement') ||
            transaction.description.toLowerCase().includes('transaction trough') ||
            transaction.description === 'PARTICULARS' ||
            transaction.description === 'Narration' ||
            transaction.description === 'Description') {
            return false;
        }
        
        // Skip empty descriptions or very short ones that are likely not transactions
        if (transaction.description.trim().length < 3) {
            return false;
        }
        
        // Skip zero-amount transactions
        if (transaction.amount === 0) {
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
        
        // Check for income keywords - Enhanced for Indian banks
        const incomeKeywords = ['salary', 'deposit', 'payment received', 'refund', 'transfer from', 'credit', 'cr', 'trf from', 'imps', 'neft', 'rtgs', 'upi', 'inward', 'by transfer'];
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
            'Investments': ['investment', 'mutual fund', 'stocks', 'shares', 'demat', 'zerodha', 'groww', 'upstox', 'kuvera', 'uti', 'sbi', 'hdfc', 'icici', 'axis', 'kotak', 'sip', 'nps', 'ppf', 'fixed deposit', 'fd', 'nifty', 'sensex']
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
