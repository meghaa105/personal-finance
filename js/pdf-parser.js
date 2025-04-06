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
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.]\d{1,2},?\s\d{2,4}/gi // Month DD, YYYY
        ],
        
        // Amount patterns
        AMOUNT: [
            /\$\s?(\d+,?\d*\.\d{2})/g,       // $123.45 or $ 1,234.56
            /(\d+,?\d*\.\d{2})\s?USD/g,      // 123.45 USD or 1,234.56 USD
            /USD\s?(\d+,?\d*\.\d{2})/g,      // USD 123.45 or USD 1,234.56
            /(\d+,?\d*\.\d{2})/g             // 123.45 or 1,234.56
        ],
        
        // Transaction patterns (combinations of date, description, and amount)
        TRANSACTION: [
            // Common pattern for most credit card statements
            /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(\$\s?\d+,?\d*\.\d{2})/g,
            
            // Alternative pattern with different date format
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.]\d{1,2},?\s\d{2,4}\s+(.+?)\s+(\$\s?\d+,?\d*\.\d{2})/gi
        ]
    };
    
    // Common merchant keywords to help with category identification
    const MERCHANT_CATEGORIES = {
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
        
        'amazon': 'Shopping',
        'ebay': 'Shopping',
        'etsy': 'Shopping',
        'shop': 'Shopping',
        'store': 'Shopping',
        'retail': 'Shopping',
        'clothing': 'Shopping',
        'apparel': 'Shopping',
        
        'uber': 'Transportation',
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
        
        'doctor': 'Health',
        'hospital': 'Health',
        'medical': 'Health',
        'pharmacy': 'Health',
        'dental': 'Health',
        'vision': 'Health',
        'healthcare': 'Health',
        'clinic': 'Health',
        
        'tuition': 'Education',
        'school': 'Education',
        'college': 'Education',
        'university': 'Education',
        'education': 'Education',
        'book': 'Education',
        'course': 'Education',
        
        'travel': 'Travel',
        'hotel': 'Travel',
        'airline': 'Travel',
        'flight': 'Travel',
        'airbnb': 'Travel',
        'vacation': 'Travel',
        'trip': 'Travel',
        
        'payment': 'Income',
        'deposit': 'Income',
        'salary': 'Income',
        'payroll': 'Income',
        'direct deposit': 'Income'
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
        
        // First, try to extract using transaction patterns
        for (const pattern of PATTERNS.TRANSACTION) {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const dateStr = match[1];
                const description = match[2].trim();
                const amountStr = match[3].replace('$', '').replace(',', '').trim();
                
                const date = parseDate(dateStr);
                const amount = parseFloat(amountStr);
                
                if (date && !isNaN(amount)) {
                    transactions.push({
                        date: date,
                        description: description,
                        amount: amount,
                        type: 'expense', // Default to expense
                        category: guessCategory(description)
                    });
                }
            }
        }
        
        // If no transactions found using patterns, try line-by-line analysis
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
                    
                    if (description) {
                        transactions.push({
                            date: dateMatch.date,
                            description: description,
                            amount: amountMatch.amount,
                            type: 'expense', // Default to expense
                            category: guessCategory(description)
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
                const amountStr = match[1].replace(',', '');
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
        
        // Try MM/DD/YYYY format
        let match = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(dateStr);
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
