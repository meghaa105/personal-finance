/**
 * PDF Parser module for extracting transaction data from PDF files
 * Uses PDF.js for PDF parsing
 */
const PDFParser = (function() {
    // Set PDF.js worker path
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    }
    
    // Regular expression patterns for different types of credit card statements
    const PATTERNS = {
        // Date patterns (various formats)
        DATE: [
            /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,  // MM/DD/YYYY or M/D/YY
            /(\d{1,2}-\d{1,2}-\d{2,4})/g,    // MM-DD-YYYY or M-D-YY
            /(\d{2}\.\d{2}\.\d{2,4})/g,      // DD.MM.YYYY or MM.DD.YYYY
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.]\d{1,2},?\s\d{2,4}/gi, // Month DD, YYYY
            /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2})/gi, // DD MMM YY (Indian format)
            /(\d{2}-\d{2}-\d{4})/g  // DD-MM-YYYY (common in Indian bank statements)
        ],
        
        // Amount patterns
        AMOUNT: [
            /₹\s?(\d+,?\d*\.\d{2})/g,        // ₹123.45 or ₹ 1,234.56
            /Rs\.\s?(\d+,?\d*\.\d{2})/g,      // Rs. 123.45 or Rs. 1,234.56
            /INR\s?(\d+,?\d*\.\d{2})/g,       // INR 123.45 or INR 1,234.56
            /(\d+,?\d*\.\d{2})\s?INR/g,       // 123.45 INR or 1,234.56 INR
            /(\d+,?\d*\.\d{2})\s?[CD]$/g,     // 1,234.56 C or 1,234.56 D (Credit/Debit indicator)
            /(\d+,?\d*\.\d{0,2})/g            // 123.45 or 1,234.56 or 123 (no decimal)
        ],
        
        // Transaction patterns (combinations of date, description, and amount)
        TRANSACTION: [
            // Common pattern for most credit card statements with rupee symbol
            /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(₹\s?\d+,?\d*\.\d{2})/g,
            
            // Pattern with Rs. notation
            /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(Rs\.\s?\d+,?\d*\.\d{2})/g,
            
            // Alternative pattern with different date format and rupee symbol
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.]\d{1,2},?\s\d{2,4}\s+(.+?)\s+(₹\s?\d+,?\d*\.\d{2})/gi,
            
            // Alternative pattern with different date format and Rs. notation
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.]\d{1,2},?\s\d{2,4}\s+(.+?)\s+(Rs\.\s?\d+,?\d*\.\d{2})/gi,
            
            // Indian credit card statement format (DD MMM YY, description, amount with C/D indicator)
            /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2})\s+(.+?)\s+(\d+,?\d*\.\d{2})\s+([CD])/gi
        ],
        
        // SBI credit card statement specific pattern
        SBI_STATEMENT: /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2})\s+(.+?)\s+(\d+,?\d*\.\d{2})\s+([CD])/gi,
        
        // Axis Bank statement pattern
        AXIS_BANK_STATEMENT: /(\d{2}-\d{2}-\d{4})\s+.+?\s+(.+?)\s+(\d+\.\d{2})\s+|(\d{2}-\d{2}-\d{4})\s+.+?\s+(.+?)\s+\s+(\d+\.\d{2})/g
    };
    
    // Common merchant keywords to help with category identification
    const MERCHANT_CATEGORIES = {
        // Indian specific merchants
        'nykaa': 'Shopping',
        'myntra': 'Shopping',
        'reliance retail': 'Shopping',
        'swiggy': 'Food & Dining',
        'zomato': 'Food & Dining',
        'bigbasket': 'Groceries',
        'dmart': 'Groceries',
        'air india': 'Travel',
        'indigo': 'Travel',
        'spicejet': 'Travel',
        'bharti airtel': 'Utilities',
        'jio': 'Utilities',
        'bsnl': 'Utilities',
        'tata power': 'Utilities',
        'adani': 'Utilities',
        'hdfc': 'Banking & Finance',
        'icici': 'Banking & Finance',
        'sbi': 'Banking & Finance',
        'axis': 'Banking & Finance',
        'kotak': 'Banking & Finance',
        'ola': 'Transportation',
        'uber': 'Transportation',
        'rapido': 'Transportation',
        'irctc': 'Transportation',
        'mmt': 'Travel',
        'makemytrip': 'Travel',
        'goibibo': 'Travel',
        'cleartrip': 'Travel',
        'yatra': 'Travel',
        'bookmyshow': 'Entertainment',
        'paytm': 'Shopping',
        'phonepe': 'Shopping',
        'gpay': 'Shopping',
        'amazon': 'Shopping',
        'flipkart': 'Shopping',
        'meesho': 'Shopping',
        'ajio': 'Shopping',
        'lenskart': 'Health',
        'apollo': 'Health',
        'medlife': 'Health',
        'pharmeasy': 'Health',
        'netmeds': 'Health',
        'practo': 'Health',
        'cult': 'Health',
        'zomato': 'Food & Dining',
        
        // General categories
        'restaurant': 'Food & Dining',
        'café': 'Food & Dining',
        'cafe': 'Food & Dining',
        'coffee': 'Food & Dining',
        'bar': 'Food & Dining',
        'diner': 'Food & Dining',
        'eatery': 'Food & Dining',
        'food': 'Food & Dining',
        'pizza': 'Food & Dining',
        'burger': 'Food & Dining',
        'taco': 'Food & Dining',
        'sushi': 'Food & Dining',
        
        'grocery': 'Groceries',
        'market': 'Groceries',
        'supermarket': 'Groceries',
        'walmart': 'Groceries',
        'target': 'Groceries',
        'kroger': 'Groceries',
        'safeway': 'Groceries',
        'trader joe': 'Groceries',
        'whole foods': 'Groceries',
        
        'ebay': 'Shopping',
        'etsy': 'Shopping',
        'shop': 'Shopping',
        'store': 'Shopping',
        'retail': 'Shopping',
        'clothing': 'Shopping',
        'apparel': 'Shopping',
        'designs': 'Shopping',
        
        'lyft': 'Transportation',
        'taxi': 'Transportation',
        'cab': 'Transportation',
        'transit': 'Transportation',
        'train': 'Transportation',
        'subway': 'Transportation',
        'bus': 'Transportation',
        'metro': 'Transportation',
        'gas': 'Transportation',
        'parking': 'Transportation',
        
        'movie': 'Entertainment',
        'cinema': 'Entertainment',
        'theater': 'Entertainment',
        'netflix': 'Entertainment',
        'spotify': 'Entertainment',
        'hulu': 'Entertainment',
        'disney+': 'Entertainment',
        'hbo': 'Entertainment',
        'prime video': 'Entertainment',
        'game': 'Entertainment',
        
        'rent': 'Housing',
        'mortgage': 'Housing',
        'apartment': 'Housing',
        'property': 'Housing',
        'home': 'Housing',
        'hoa': 'Housing',
        
        'electric': 'Utilities',
        'gas bill': 'Utilities',
        'water': 'Utilities',
        'internet': 'Utilities',
        'phone': 'Utilities',
        'cell': 'Utilities',
        'cable': 'Utilities',
        'utility': 'Utilities',
        'limited': 'Utilities',
        
        'doctor': 'Health',
        'hospital': 'Health',
        'medical': 'Health',
        'pharmacy': 'Health',
        'dental': 'Health',
        'vision': 'Health',
        'healthcare': 'Health',
        'clinic': 'Health',
        'health': 'Health',
        
        'tuition': 'Education',
        'school': 'Education',
        'college': 'Education',
        'university': 'Education',
        'education': 'Education',
        'book': 'Education',
        'course': 'Education',
        
        'hotel': 'Travel',
        'airline': 'Travel',
        'flight': 'Travel',
        'airbnb': 'Travel',
        'vacation': 'Travel',
        'trip': 'Travel',
        'resort': 'Travel',
        
        'payment': 'Income',
        'deposit': 'Income',
        'salary': 'Income',
        'payroll': 'Income',
        'direct deposit': 'Income',
        'cashback': 'Income'
    };
    
    // Parse the PDF file
    async function parsePDF(file) {
        try {
            if (!pdfjsLib) {
                throw new Error('PDF.js library not loaded');
            }
            
            // Read file as ArrayBuffer
            const arrayBuffer = await readFileAsArrayBuffer(file);
            
            // Load the PDF document
            const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
            const pdf = await loadingTask.promise;
            
            console.log('PDF loaded. Number of pages:', pdf.numPages);
            
            // Extract text from all pages
            let extractedText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // Concatenate the text items
                const pageText = textContent.items.map(item => item.str).join(' ');
                extractedText += pageText + '\n';
            }
            
            // Extract transactions from the text
            const transactions = extractTransactions(extractedText);
            
            return {
                success: true,
                transactions: transactions,
                rawText: extractedText
            };
        } catch (error) {
            console.error('Error parsing PDF:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    // Helper function to read file as ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = function(event) {
                resolve(event.target.result);
            };
            
            reader.onerror = function(event) {
                reject(new Error('Failed to read file: ' + event.target.error));
            };
            
            reader.readAsArrayBuffer(file);
        });
    }
    
    // Extract transactions from text
    function extractTransactions(text) {
        const transactions = [];
        const lines = text.split('\n');
        
        // First, try to extract using SBI statement specific format
        let match;
        const sbiPattern = PATTERNS.SBI_STATEMENT;
        while ((match = sbiPattern.exec(text)) !== null) {
            const dateStr = match[1];
            const description = match[2].trim();
            // Clean amount string - remove commas
            const amountStr = match[3].replace(/,/g, '').trim();
            // Get the transaction type (C = Credit/Income, D = Debit/Expense)
            const typeIndicator = match[4].trim();
            
            const date = parseDate(dateStr);
            const amount = parseFloat(amountStr);
            
            if (date && !isNaN(amount)) {
                const transactionType = typeIndicator === 'C' ? 'income' : 'expense';
                transactions.push({
                    date: date,
                    description: description,
                    amount: amount,
                    type: transactionType,
                    category: transactionType === 'income' ? 'Income' : guessCategory(description)
                });
            }
        }
        
        // Check for Axis Bank statement pattern
        if (transactions.length === 0) {
            // Check if it's an Axis Bank statement by looking for text markers
            const isAxisStatement = text.includes("Statement of Axis Account") || 
                                   text.includes("Axis Bank") || 
                                   (text.includes("Tran Date") && text.includes("Particulars") && text.includes("Debit") && text.includes("Credit"));
            
            if (isAxisStatement) {
                // Process the data row by row
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line === '') continue;
                    
                    // Look for date pattern DD-MM-YYYY (common in Axis statements)
                    const dateMatch = /(\d{2}-\d{2}-\d{4})/.exec(line);
                    if (!dateMatch) continue;
                    
                    const dateStr = dateMatch[1];
                    const date = parseDate(dateStr);
                    
                    if (!date) continue;
                    
                    // Extract description (typically after the date)
                    const dateIndex = line.indexOf(dateStr);
                    let endIndex = line.length;
                    
                    // Look for amount columns - either Debit or Credit
                    const debitMatch = /(\d+\.\d{2})\s+/.exec(line.substring(dateIndex + dateStr.length));
                    const creditMatch = /\s+(\d+\.\d{2})/.exec(line.substring(dateIndex + dateStr.length));
                    
                    let amount = 0;
                    let transactionType = 'expense'; // Default to expense
                    
                    if (debitMatch) {
                        amount = parseFloat(debitMatch[1]);
                        transactionType = 'expense';
                        endIndex = line.indexOf(debitMatch[0], dateIndex);
                    } else if (creditMatch) {
                        amount = parseFloat(creditMatch[1]);
                        transactionType = 'income';
                        endIndex = line.indexOf(creditMatch[0], dateIndex);
                    }
                    
                    if (amount > 0) {
                        // Extract description between date and amount
                        let description = line.substring(dateIndex + dateStr.length, endIndex).trim();
                        
                        // Clean up description by removing any extra spaces
                        description = description.replace(/\s+/g, ' ').trim();
                        
                        // Sometimes description continues on next line, so check
                        if (description === '' && i + 1 < lines.length && !lines[i + 1].match(/\d{2}-\d{2}-\d{4}/)) {
                            description = lines[i + 1].trim();
                            i++; // Skip the next line
                        }
                        
                        transactions.push({
                            date: date,
                            description: description,
                            amount: amount,
                            type: transactionType,
                            category: transactionType === 'income' ? 'Income' : guessCategory(description)
                        });
                    }
                }
            }
        }
        
        // If no transactions found yet, try other transaction patterns
        if (transactions.length === 0) {
            for (const pattern of PATTERNS.TRANSACTION) {
                let match;
                while ((match = pattern.exec(text)) !== null) {
                    if (pattern.toString() === PATTERNS.SBI_STATEMENT.toString()) continue; // Skip if it's the SBI pattern
                    
                    const dateStr = match[1];
                    const description = match[2].trim();
                    // Clean amount string - replace any currency symbols
                    const amountStr = match[3].replace(/[$₹Rs\.,]/g, '').trim();
                    
                    const date = parseDate(dateStr);
                    const amount = parseFloat(amountStr);
                    
                    // Guess if this is income or expense based on description
                    const isIncome = /payment|deposit|salary|credit|cashback|refund/i.test(description);
                    
                    if (date && !isNaN(amount)) {
                        transactions.push({
                            date: date,
                            description: description,
                            amount: amount,
                            type: isIncome ? 'income' : 'expense',
                            category: isIncome ? 'Income' : guessCategory(description)
                        });
                    }
                }
            }
        }
        
        // If still no transactions found using patterns, try line-by-line analysis
        if (transactions.length === 0) {
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line === '') continue;
                
                // Try to extract date and amount from the line
                const dateMatch = extractDate(line);
                const amountMatch = extractAmount(line);
                
                if (dateMatch && amountMatch) {
                    // Assume the text between date and amount is the description
                    const dateIndex = line.indexOf(dateMatch.match);
                    const amountIndex = line.indexOf(amountMatch.match);
                    
                    let description;
                    if (dateIndex < amountIndex) {
                        description = line.substring(dateIndex + dateMatch.match.length, amountIndex).trim();
                    } else {
                        description = line.substring(amountIndex + amountMatch.match.length, dateIndex).trim();
                    }
                    
                    // If description is empty, look at the next line
                    if (description === '' && i + 1 < lines.length) {
                        description = lines[i + 1].trim();
                        i++; // Skip the next line
                    }
                    
                    // Guess if this is income or expense based on description
                    const isIncome = /payment|deposit|salary|credit|cashback|refund/i.test(description);
                    
                    if (description) {
                        transactions.push({
                            date: dateMatch.date,
                            description: description,
                            amount: amountMatch.amount,
                            type: isIncome ? 'income' : 'expense',
                            category: isIncome ? 'Income' : guessCategory(description)
                        });
                    }
                }
            }
        }
        
        return transactions;
    }
    
    // Extract date from text
    function extractDate(text) {
        for (const pattern of PATTERNS.DATE) {
            const match = pattern.exec(text);
            if (match) {
                const dateStr = match[1];
                const date = parseDate(dateStr);
                
                if (date) {
                    return { match: match[0], date: date };
                }
            }
        }
        
        return null;
    }
    
    // Extract amount from text
    function extractAmount(text) {
        for (const pattern of PATTERNS.AMOUNT) {
            const match = pattern.exec(text);
            if (match) {
                // Clean the amount string - remove currency symbols and commas
                const amountStr = match[1].replace(/[$₹Rs\.,]/g, '');
                const amount = parseFloat(amountStr);
                
                if (!isNaN(amount)) {
                    return { match: match[0], amount: amount };
                }
            }
        }
        
        return null;
    }
    
    // Parse date from various formats
    function parseDate(dateStr) {
        // Try parsing with built-in Date
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }
        
        // Try DD-MM-YYYY format (common in Indian bank statements like Axis Bank)
        let match = /(\d{2})-(\d{2})-(\d{4})/.exec(dateStr);
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // Months are 0-indexed in JavaScript
            const year = parseInt(match[3]);
            
            return new Date(year, month, day);
        }
        
        // Try MM/DD/YYYY format
        match = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(dateStr);
        if (match) {
            const month = parseInt(match[1]) - 1; // Months are 0-indexed in JavaScript
            const day = parseInt(match[2]);
            let year = parseInt(match[3]);
            
            // Adjust two-digit years
            if (year < 100) {
                year = year < 50 ? 2000 + year : 1900 + year;
            }
            
            return new Date(year, month, day);
        }
        
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
        
        // Try Month DD, YYYY format
        match = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.]\d{1,2},?\s\d{2,4}/i.exec(dateStr);
        if (match) {
            return new Date(match[0]);
        }
        
        // Try DD MMM YY format (common in Indian bank statements)
        match = /(\d{2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{2})/i.exec(dateStr);
        if (match) {
            const day = parseInt(match[1]);
            const monthStr = match[2];
            let year = parseInt(match[3]);
            
            // Convert month string to number (0-11)
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const month = months.findIndex(m => m.toLowerCase() === monthStr.toLowerCase());
            
            // Adjust two-digit years (assuming 20xx for all years)
            if (year < 100) {
                year = 2000 + year;
            }
            
            return new Date(year, month, day);
        }
        
        return null;
    }
    
    // Guess category based on transaction description
    function guessCategory(description) {
        const descriptionLower = description.toLowerCase();
        
        // Check if it matches any of the merchant keywords
        for (const [keyword, category] of Object.entries(MERCHANT_CATEGORIES)) {
            if (descriptionLower.includes(keyword.toLowerCase())) {
                return category;
            }
        }
        
        // Default category if no match found
        return 'Other';
    }
    
    // Return public API
    return {
        parsePDF
    };
})();
