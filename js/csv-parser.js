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
            date: ['Tran Date', 'Transaction Date', 'Value Date', 'Date', 'Txn Date'],
            description: ['PARTICULARS', 'Description', 'Narration', 'Transaction Details', 'Transaction Description', 'Remarks', 'Transaction Remarks'],
            amount: ['DR', 'CR', 'Debit Amount', 'Credit Amount', 'Debit', 'Credit', 'Amount', 'Withdrawal Amt', 'Deposit Amt'],
            type: ['Transaction Type', 'Txn Type', 'Mode', 'Transaction Mode', 'Chq/Ref No', 'Ref No./Cheque No', 'Ref No']
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
                        const transactions = results.data.map(row => {
                            return {
                                date: parseDate(row['Date']),
                                description: row['Description'],
                                amount: parseFloat(row['Amount']),
                                type: determineTransactionType(row['Description'], parseFloat(row['Amount'])),
                                category: guessCategory(row['Description'])
                            };
                        });

                        // Add transactions to the database
                        const result = Database.addTransactions(transactions, 'CSV');
                        resolve({ success: true, addedCount: result.addedCount });
                    } catch (error) {
                        reject(error);
                    }
                },
                error: function(error) {
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

        // Ensure data is an array
        if (!Array.isArray(data)) {
            console.error('Invalid data format: expected an array');
            return [];
        }

        // Special handling for SBI bank format with its specific structure
        if (bankFormat === 'sbi_bank') {
            console.log("Processing SBI Bank statement format with sample row:", data[0]);
            console.log("SBI statement headers:", headers);

            // Check if we have the exact SBI format we're expecting
            const isSbiExactFormat = headers.includes('Tran Date') && 
                                   headers.includes('PARTICULARS') && 
                                   headers.includes('DR') && 
                                   headers.includes('CR');

            if (isSbiExactFormat) {
                console.log("Using direct SBI bank statement processing");

                // Direct processing approach for SBI bank format
                const transactions = [];

                // Process each row directly
                for (let i = 0; i < data.length; i++) {
                    const row = data[i];

                    // Skip rows without valid date in DD-MM-YYYY format
                    if (!row['Tran Date'] || !/^\d{2}-\d{2}-\d{4}$/.test(row['Tran Date'])) {
                        continue;
                    }

                    // Skip rows without description or with header values
                    if (!row['PARTICULARS'] || 
                        row['PARTICULARS'] === 'PARTICULARS' || 
                        row['PARTICULARS'] === 'Legend :' ||
                        row['PARTICULARS'].toLowerCase().includes('opening balance') ||
                        row['PARTICULARS'].toLowerCase().includes('closing balance')) {
                        continue;
                    }

                    try {
                        // Create transaction object
                        const transaction = {
                            date: parseDate(row['Tran Date']),
                            description: row['PARTICULARS'],
                            source: 'csv'  // Add source information
                        };

                        // If date parsing failed, skip this row
                        if (!transaction.date) {
                            console.log(`Skipping row ${i} - invalid date: ${row['Tran Date']}`);
                            continue;
                        }

                        // Determine amount and type
                        let amount = 0;
                        let type = 'expense';

                        if (row['DR'] && row['DR'].trim() !== '' && row['DR'] !== '-') {
                            // It's a debit (expense)
                            amount = parseFloat(row['DR'].replace(/,/g, ''));
                            type = 'expense';
                        } else if (row['CR'] && row['CR'].trim() !== '' && row['CR'] !== '-') {
                            // It's a credit (income)
                            amount = parseFloat(row['CR'].replace(/,/g, ''));
                            type = 'income';
                        } else {
                            // Skip rows with no amount
                            continue;
                        }

                        // Skip rows with invalid amounts
                        if (isNaN(amount) || amount === 0) {
                            continue;
                        }

                        transaction.amount = amount;
                        transaction.type = type;

                        // Guess category based on description
                        transaction.category = guessCategory(transaction.description);

                        transactions.push(transaction);
                    } catch (error) {
                        console.error(`Error processing SBI row ${i}:`, error, row);
                    }
                }

                console.log(`Processed ${transactions.length} valid SBI bank transactions`);
                return transactions;
            }
        }

        // Generic approach for all other bank formats or SBI formats that don't match the exact structure
        return data.map((row, index) => {
            try {
                // Skip completely empty rows
                if (Object.values(row).every(val => !val || val.trim() === '')) {
                    return null;
                }

                // Create transaction object
                const description = extractField(row, headers, 'description', mappings);
                const amount = parseAmount(extractField(row, headers, 'amount', mappings), row, headers);

                const transaction = {
                    date: extractField(row, headers, 'date', mappings),
                    description: description,
                    amount: Math.abs(amount), // Store absolute value
                    type: determineTransactionType(description, amount, headers, row),
                    source: 'csv'
                };

                // Skip rows without dates
                if (!transaction.date) {
                    return null;
                }

                // Skip rows with invalid amounts
                if (isNaN(transaction.amount) || transaction.amount === 0) {
                    return null;
                }

                // Guess category based on description
                transaction.category = guessCategory(transaction.description);

                return transaction;
            } catch (error) {
                console.error(`Error mapping row ${index}:`, error, row);
                return null;
            }
        }).filter(t => t !== null);
    }

    // Extract field value using header mappings
    function extractField(row, headers, fieldType, mappings) {
        // Use bank-specific mappings if available
        const fieldMappings = mappings ? mappings[fieldType] : HEADER_MAPPINGS[fieldType];

        // Check if we're dealing with SBI bank format
        const isSBI = headers.includes('Tran Date') && headers.includes('PARTICULARS') && 
                      headers.includes('DR') && headers.includes('CR');

        // Handle SBI bank format specifically
        if (isSBI) {
            // Special handling for SBI bank format
            if (fieldType === 'date') {
                return row['Tran Date']; // SBI always uses 'Tran Date'
            }

            if (fieldType === 'description') {
                return row['PARTICULARS']; // SBI always uses 'PARTICULARS'
            }

            if (fieldType === 'amount') {
                // SBI has separate DR and CR columns
                if (row['DR'] && row['DR'].trim() !== '' && row['DR'].trim() !== '-') {
                    return '-' + row['DR']; // Debit (negative)
                }

                if (row['CR'] && row['CR'].trim() !== '' && row['CR'].trim() !== '-') {
                    return row['CR']; // Credit (positive)
                }

                return '0'; // Default value
            }

            // For other field types, use the generic approach
        }

        // Try to find a matching header (generic approach)
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

                if ((headerLower.includes('debit') || headerLower === 'dr') && row[header] && 
                    row[header].trim() !== '' && row[header].trim() !== '-') {
                    return '-' + row[header]; // Debit is negative (expense)
                }

                if ((headerLower.includes('credit') || headerLower === 'cr') && row[header] && 
                    row[header].trim() !== '' && row[header].trim() !== '-') {
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
                if (row[drColumn] && row[drColumn].trim() !== '' && row[drColumn].trim() !== '-') {
                    // Debit/DR is negative (expense)
                    const amount = row[drColumn].replace(/[$₹Rs.,]/g, '').trim();
                    if (amount && !isNaN(parseFloat(amount))) {
                        return -Math.abs(parseFloat(amount));
                    }
                }

                if (row[crColumn] && row[crColumn].trim() !== '' && row[crColumn].trim() !== '-') {
                    // Credit/CR is positive (income)
                    const amount = row[crColumn].replace(/[$₹Rs.,]/g, '').trim();
                    if (amount && !isNaN(parseFloat(amount))) {
                        return Math.abs(parseFloat(amount));
                    }
                }
            }

            // Look for other debit/credit columns - Indian bank specific formats
            for (const header of headers) {
                const headerLower = header.toLowerCase();

                // Handle multiple variations of debit columns
                if ((headerLower.includes('debit') || 
                     headerLower === 'dr' || 
                     headerLower.includes('withdrawal') || 
                     headerLower.includes('withdrawl')) && 
                    row[header] && row[header].trim() !== '' && row[header].trim() !== '-') {

                    // Debit is negative (expense)
                    const amount = row[header].replace(/[$₹Rs.,]/g, '').trim();
                    if (amount && !isNaN(parseFloat(amount))) {
                        return -Math.abs(parseFloat(amount));
                    }
                }

                // Handle multiple variations of credit columns
                if ((headerLower.includes('credit') || 
                     headerLower === 'cr' || 
                     headerLower.includes('deposit')) && 
                    row[header] && row[header].trim() !== '' && row[header].trim() !== '-') {

                    // Credit is positive (income)
                    const amount = row[header].replace(/[$₹Rs.,]/g, '').trim();
                    if (amount && !isNaN(parseFloat(amount))) {
                        return Math.abs(parseFloat(amount));
                    }
                }
            }

            // Special case for amount columns with prefixed Dr./Cr.
            const amountColumns = headers.filter(h => 
                h.toLowerCase().includes('amount') || 
                h.toLowerCase().includes('transaction') ||
                h.toLowerCase().includes('value')
            );

            for (const amountCol of amountColumns) {
                if (row[amountCol] && row[amountCol].trim() !== '') {
                    const amountVal = row[amountCol].trim();

                    // Check for Dr. or Cr. prefixes in the amount string
                    if (amountVal.toLowerCase().includes('dr') || amountVal.toLowerCase().includes('debit')) {
                        // It's a debit/expense
                        const cleanAmount = amountVal.replace(/dr\.?|debit|[$₹Rs.,]/gi, '').trim();
                        if (cleanAmount && !isNaN(parseFloat(cleanAmount))) {
                            return -Math.abs(parseFloat(cleanAmount));
                        }
                    } else if (amountVal.toLowerCase().includes('cr') || amountVal.toLowerCase().includes('credit')) {
                        // It's a credit/income
                        const cleanAmount = amountVal.replace(/cr\.?|credit|[$₹Rs.,]/gi, '').trim();
                        if (cleanAmount && !isNaN(parseFloat(cleanAmount))) {
                            return Math.abs(parseFloat(cleanAmount));
                        }
                    }
                }
            }

            return 0;
        }

        // Handle string with "Dr." or "Cr." prefixes (common in Indian bank statements)
        if (typeof amountStr === 'string') {
            if (amountStr.toLowerCase().includes('dr') || amountStr.toLowerCase().includes('debit')) {
                // It's a debit/expense
                const cleanAmount = amountStr.replace(/dr\.?|debit|[$₹Rs.,]/gi, '').trim();
                if (cleanAmount && !isNaN(parseFloat(cleanAmount))) {
                    return -Math.abs(parseFloat(cleanAmount));
                }
            } else if (amountStr.toLowerCase().includes('cr') || amountStr.toLowerCase().includes('credit')) {
                // It's a credit/income
                const cleanAmount = amountStr.replace(/cr\.?|credit|[$₹Rs.,]/gi, '').trim();
                if (cleanAmount && !isNaN(parseFloat(cleanAmount))) {
                    return Math.abs(parseFloat(cleanAmount));
                }
            }
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
    function determineTransactionType(description, amount, headers, row) {
        if (!description) return 'expense';

        const descriptionLower = description.toLowerCase();

        // Check credit/debit columns if they exist
        const creditColumn = headers.find(h => h.toLowerCase().includes('credit') || h === 'CR');
        const debitColumn = headers.find(h => h.toLowerCase().includes('debit') || h === 'DR');

        // Check specific credit/debit columns
        if (creditColumn && debitColumn) {
            if (row[creditColumn] && row[creditColumn].trim() !== '' && row[creditColumn] !== '0' && row[creditColumn] !== '-') {
                return 'income';
            }
            if (row[debitColumn] && row[debitColumn].trim() !== '' && row[debitColumn] !== '0' && row[debitColumn] !== '-') {
                return 'expense';
            }
        }

        // Check for income-specific patterns
        const specificIncomePatterns = [
            /salary\s+credited/i,
            /interest\s+credited/i,
            /dividend\s+credited/i,
            /refund\s+credited/i,
            /cashback\s+received/i,
            /income\s+tax\s+refund/i,
            /deposit\s+by/i,
            /credit\s+received/i
        ];

        for (const pattern of specificIncomePatterns) {
            if (pattern.test(descriptionLower)) {
                return 'income';
            }
        }

        // Check for expense-specific patterns
        const expensePatterns = [
            /payment\s+to/i,
            /debit\s+card/i,
            /withdrawal/i,
            /purchase/i,
            /spent\s+at/i,
            /bill\s+payment/i,
            /debit\s+for/i
        ];

        for (const pattern of expensePatterns) {
            if (pattern.test(descriptionLower)) {
                return 'expense';
            }
        }

        // If amount is negative, it's likely an expense
        if (amount < 0) {
            return 'expense';
        }

        // Default to expense for safety
        return 'expense';
    }

    // Detect bank format based on headers
    function detectBankFormat(headers) {
        const headersLower = headers.map(h => h.toLowerCase());
        console.log("All headers for detection:", headersLower);

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

        // SBI Bank format - aggressive detection looking for common patterns in SBI statements
        const sbiPatterns = [
            // Check for the most common SBI statement pattern with exact headers
            (headers.includes('Tran Date') && headers.includes('PARTICULARS') && 
             headers.includes('DR') && headers.includes('CR') && headers.includes('BAL')),

            // Check the same with lowercase variations
            (headersLower.includes('tran date') && headersLower.includes('particulars') && 
             headersLower.includes('dr') && headersLower.includes('cr') && headersLower.includes('bal')),

            // Check for CHQNO column which is specific to SBI format
            (headers.includes('Tran Date') && headers.includes('CHQNO') && 
             headers.includes('PARTICULARS') && headers.includes('DR') && headers.includes('CR')),

            // Check for SOL column which is specific to SBI format
            (headersLower.includes('tran date') && headersLower.includes('particulars') && 
             headersLower.includes('dr') && headersLower.includes('cr') && headersLower.includes('sol')),

            // Alternate SBI pattern with Chq/Ref number
            (headersLower.includes('tran date') && headersLower.includes('chq/ref no') && 
             headersLower.includes('particulars') && (headersLower.includes('dr') || headersLower.includes('cr'))),

            // Another SBI pattern
            (headersLower.includes('date') && headersLower.includes('description') && 
             headersLower.includes('ref no./cheque no') && headersLower.includes('debit') && headersLower.includes('credit')),

            // SBI corporate or special account format
            (headersLower.includes('txn date') && headersLower.includes('description') && 
             headersLower.includes('ref no') && headersLower.includes('debit') && headersLower.includes('credit')),

            // SBI combined format
            (headersLower.includes('date') && headersLower.includes('narration') && 
             headersLower.includes('chq/ref no') && headersLower.includes('debit') && headersLower.includes('credit'))
        ];

        if (sbiPatterns.some(pattern => pattern === true)) {
            console.log("Detected SBI bank format - pattern match");
            return 'sbi_bank';
        }

        // Special detection for SBI with Value Date format
        if ((headersLower.includes('value date') || headersLower.includes('tran date')) && 
            headersLower.includes('description') &&
            (headersLower.includes('debit') && headersLower.includes('credit'))) {
            console.log("Detected SBI bank format - value date variant");
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
        if ((headersLower.includes('tran date') || headersLower.includes('transaction date') || 
             headersLower.includes('value date') || headersLower.includes('date')) && 
            (headersLower.includes('particulars') || headersLower.includes('description') || 
             headersLower.includes('narration') || headersLower.includes('remarks')) && 
            (headersLower.includes('dr') || headersLower.includes('cr') || 
             headersLower.includes('debit') || headersLower.includes('credit') ||
             headersLower.includes('withdrawal') || headersLower.includes('deposit'))) {
            console.log("Detected generic Indian bank format");
            return 'indian_bank';
        }

        // If this looks like it should be an Indian bank format but wasn't caught above
        const possibleIndianHeaders = ['credit', 'debit', 'cheque', 'chq', 'particulars', 'narration', 
                                       'withdrawal', 'deposit', 'reference', 'balance', 'upi', 'neft', 
                                       'rtgs', 'imps', 'ref', 'tran'];

        const matchCount = possibleIndianHeaders.filter(keyword => 
            headersLower.some(header => header.includes(keyword))
        ).length;

        if (matchCount >= 3) {
            console.log(`Detected possible Indian bank format (matched ${matchCount} keywords)`);
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
            transaction.description === 'Description' ||
            transaction.description === 'CHQNO' ||  // SBI bank header
            transaction.description === '-' ||      // SBI bank dash placeholder
            transaction.description === 'SOL') {    // SBI bank SOL column
            return false;
        }

        // Skip rows with typical Legend section entries (common in SBI statements)
        const legendKeywords = [
            'iconn', 'vmt', 'autosweep', 'rev sweep', 'sweep trf', 
            'cwdr', 'pur', 'tip', 'scg', 'rate.diff', 'clg', 'edc', 
            'setu', 'int.pd', 'int.coll', 'visa money', 'transfer to', 
            'interest on', 'transfer from', 'cash withdrawal', 'pos purchase'
        ];

        for (const keyword of legendKeywords) {
            if (transaction.description.toLowerCase().includes(keyword)) {
                // Check if this is likely a legend entry (not a real transaction)
                // Legend entries often have very generic descriptions
                if (transaction.description.toLowerCase().startsWith(keyword) || 
                    transaction.description.split(' ').length <= 3) {
                    return false;
                }
            }
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

        // Special case for Indian SBI format: DD-MM-YYYY
        let match = /^(\d{2})-(\d{2})-(\d{4})$/.exec(dateStr);
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // Months are 0-indexed in JavaScript
            const year = parseInt(match[3]);

            return new Date(year, month, day);
        }

        // Prioritize Indian format - DD/MM/YYYY or DD-MM-YYYY (general)
        match = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(dateStr);
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

        // Try DD.MM.YYYY format (European)
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
        const customMappings = Database.getCustomMappings(); // Fetch custom mappings
        const descriptionLower = description.toLowerCase();

        // Check custom mappings first
        for (const [keyword, category] of Object.entries(customMappings)) {
            if (descriptionLower.includes(keyword)) {
                return category; // Return category from custom mappings
            }
        }

        // Fall back to existing categorization logic
        const categoryPatterns = {
            // ...existing patterns...
            'Groceries': [/(?:bigbasket|grofers|dmart|grocery|kirana|supermarket)/i],
            'Shopping': [/(?:amazon|flipkart|myntra|ajio|store|mall|bazaar)/i],
            // ...existing patterns...
        };

        for (const [category, patterns] of Object.entries(categoryPatterns)) {
            if (patterns.some((pattern) => pattern.test(descriptionLower))) {
                return category;
            }
        }

        return 'Other'; // Default category if no match is found
    }

    // Helper function to categorize merchants
    function categorizeMerchant(merchant) {
        console.log('Categorizing merchant:', merchant);
        const merchantLower = merchant.toLowerCase();
        console.log('Normalized merchant name:', merchantLower);
        // Add more sophisticated merchant categorization logic here if needed

        // Example: Check for common restaurant names
        const restaurantPatterns = [
            /mcdonalds/i, /burger\s*king/i, /starbucks/i, /dominos/i, /pizza\s*hut/i,
            /kfc/i, /taco\s*bell/i, /wendys/i, /arbys/i, /subway/i
        ];

        if (restaurantPatterns.some(pattern => pattern.test(merchantLower))) {
            return 'Food & Dining';
        }

        // Example: Check for common grocery store names
        const groceryPatterns = [/whole\s*foods/i, /kroger/i, /safeway/i, /trader\s*joes/i, /albertsons/i];
        if (groceryPatterns.some(pattern => pattern.test(merchantLower))) {
            return 'Groceries';
        }

        // Add more merchant-specific categories as needed

        return 'Other';
    }


    // Return public API
    return {
        parseCSV
    };
})();