/**
 * PDF Parser module for extracting transaction data from PDF files
 * Uses PDF.js for PDF parsing
 */
const PDFParser = (function() {
    // Set PDF.js worker path
    if (typeof pdfjsLib !== 'undefined') {
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js';
    }
    
    // Regular expression patterns for different types of bank statements
    const PATTERNS = {
        // Date patterns (various formats)
        DATE: [
            /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,                         // MM/DD/YYYY or M/D/YY
            /(\d{1,2}-\d{1,2}-\d{2,4})/g,                           // MM-DD-YYYY or M-D-YY
            /(\d{2}\.\d{2}\.\d{2,4})/g,                             // DD.MM.YYYY or MM.DD.YYYY
            /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.]\d{1,2},?\s\d{2,4}/gi,  // Month DD, YYYY
            /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/gi,   // DD MMM YY/YYYY (Indian format)
            /(\d{2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})/gi,  // DD Month YYYY
            /(\d{2}-\d{2}-\d{4})/g,                                 // DD-MM-YYYY (common in Indian bank statements)
            /(\d{2}\/\d{2}\/\d{4})/g                                // DD/MM/YYYY (another common Indian format)
        ],
        
        // Amount patterns
        AMOUNT: [
            /₹\s?(\d+,?\d*\.\d{2})/g,                              // ₹123.45 or ₹ 1,234.56
            /Rs\.\s?(\d+,?\d*\.\d{2})/g,                            // Rs. 123.45 or Rs. 1,234.56
            /INR\s?(\d+,?\d*\.\d{2})/g,                             // INR 123.45 or INR 1,234.56
            /(\d+,?\d*\.\d{2})\s?INR/g,                             // 123.45 INR or 1,234.56 INR
            /(\d+,?\d*\.\d{2})\s?[CD]$/g,                           // 1,234.56 C or 1,234.56 D (Credit/Debit indicator)
            /(\d+,?\d*\.\d{2})/g,                                   // 123.45 or 1,234.56 (decimal amount)
            /(\d+,\d+\.\d{2})/g,                                    // 1,234.56 (with comma thousand separator)
            /(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/g,                    // 1,234 or 1,234.56 (comma-separated thousands)
            /([0-9.]+)/g                                            // Any number with or without decimal places
        ],
        
        // Transaction patterns (combinations of date, description, and amount)
        TRANSACTION: [
            // Common pattern for most statements with rupee symbol
            /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(₹\s?\d+,?\d*\.\d{2})/g,
            
            // Pattern with Rs. notation
            /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+(Rs\.\s?\d+,?\d*\.\d{2})/g,
            
            // DD MMM YYYY format with rupee symbol
            /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})\s+(.+?)\s+(₹\s?\d+,?\d*\.\d{2})/gi,
            
            // DD MMM YYYY format with Rs. notation
            /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})\s+(.+?)\s+(Rs\.\s?\d+,?\d*\.\d{2})/gi,
            
            // Indian bank statement format (DD-MM-YYYY, description, amount)
            /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+(\d+,?\d*\.\d{2})/g,
            
            // Indian credit card format with credit/debit indicator
            /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})\s+(.+?)\s+(\d+,?\d*\.\d{2})\s+([CD])/gi,
            
            // DD-MM-YYYY format with just numbers and description
            /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+(\d+\.\d{2})/g
        ],
        
        // SBI credit card statement specific pattern
        SBI_STATEMENT: /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})\s+(.+?)\s+(\d+,?\d*\.\d{2})\s+([CD])/gi,
        
        // Axis Bank statement pattern - more specific to capture column structure
        AXIS_BANK_STATEMENT: /(\d{2}-\d{2}-\d{4})\s+(.*?)(?=\s+\d+\.\d{2})/g,
        
        // HDFC Bank statement pattern (common in Indian banks)
        HDFC_BANK_STATEMENT: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(\d+(?:,\d{3})*\.\d{2})\s+(?:Cr\.?|Dr\.?)/gi,
        
        // ICICI Bank statement pattern
        ICICI_BANK_STATEMENT: /(\d{2}-\d{2}-\d{4})\s+(.+?)\s+(?:(?:CR|DR)\s+)?(\d+(?:,\d{3})*\.\d{2})/gi
    };
    
    // Common merchant keywords to help with category identification
    const MERCHANT_CATEGORIES = {
        // Indian specific merchants - Shopping
        'nykaa': 'Shopping',
        'myntra': 'Shopping',
        'reliance retail': 'Shopping',
        'reliance digital': 'Shopping',
        'reliance trends': 'Shopping',
        'reliance fresh': 'Groceries',
        'jiomart': 'Groceries',
        'amazon': 'Shopping',
        'amazon pay': 'Shopping',
        'flipkart': 'Shopping',
        'meesho': 'Shopping',
        'ajio': 'Shopping',
        'snapdeal': 'Shopping',
        'tata cliq': 'Shopping',
        'shoppers stop': 'Shopping',
        'lifestyle': 'Shopping',
        'pantaloons': 'Shopping',
        'westside': 'Shopping',
        'max': 'Shopping',
        'croma': 'Shopping',
        'vijay sales': 'Shopping',
        
        // Indian specific merchants - Food & Dining
        'swiggy': 'Food & Dining',
        'zomato': 'Food & Dining',
        'food panda': 'Food & Dining',
        'fasoos': 'Food & Dining',
        'box8': 'Food & Dining',
        'dominos': 'Food & Dining',
        'pizza hut': 'Food & Dining',
        'mcdonald': 'Food & Dining',
        'mcdonalds': 'Food & Dining',
        'burger king': 'Food & Dining',
        'kfc': 'Food & Dining',
        'subway': 'Food & Dining',
        'cafe coffee day': 'Food & Dining',
        'ccd': 'Food & Dining',
        'starbucks': 'Food & Dining',
        'barista': 'Food & Dining',
        'chaayos': 'Food & Dining',
        'haldiram': 'Food & Dining',
        
        // Indian specific merchants - Groceries
        'bigbasket': 'Groceries',
        'dmart': 'Groceries',
        'blinkit': 'Groceries',
        'grofers': 'Groceries',
        'nature basket': 'Groceries',
        'spencers': 'Groceries',
        'more retail': 'Groceries',
        'nilgiris': 'Groceries',
        'smart bazar': 'Groceries',
        'big bazar': 'Groceries',
        'metro cash': 'Groceries',
        'easyday': 'Groceries',
        
        // Indian specific merchants - Travel
        'air india': 'Travel',
        'indigo': 'Travel',
        'spicejet': 'Travel',
        'vistara': 'Travel',
        'air asia': 'Travel',
        'go air': 'Travel',
        'goair': 'Travel',
        'akasa air': 'Travel',
        'alliance air': 'Travel',
        'mmt': 'Travel',
        'makemytrip': 'Travel',
        'goibibo': 'Travel',
        'cleartrip': 'Travel',
        'yatra': 'Travel',
        'ixigo': 'Travel',
        'easeMyTrip': 'Travel',
        'redbus': 'Travel',
        'abhibus': 'Travel',
        'oyo': 'Travel',
        'treebo': 'Travel',
        'fabhotels': 'Travel',
        
        // Indian specific merchants - Utilities
        'bharti airtel': 'Utilities',
        'airtel': 'Utilities',
        'jio': 'Utilities',
        'vi': 'Utilities',
        'vodafone idea': 'Utilities',
        'vodafone': 'Utilities',
        'idea': 'Utilities',
        'bsnl': 'Utilities',
        'tata power': 'Utilities',
        'adani electricity': 'Utilities',
        'mahadiscom': 'Utilities',
        'bescom': 'Utilities',
        'msedcl': 'Utilities',
        'torrent power': 'Utilities',
        'tneb': 'Utilities',
        'kptcl': 'Utilities',
        'reliance energy': 'Utilities',
        'tata sky': 'Entertainment',
        'dish tv': 'Entertainment',
        'sun direct': 'Entertainment',
        'd2h': 'Entertainment',
        'airtel dth': 'Entertainment',
        
        // Indian specific merchants - Banking & Finance
        'hdfc': 'Banking & Finance',
        'icici': 'Banking & Finance',
        'sbi': 'Banking & Finance',
        'axis': 'Banking & Finance',
        'kotak': 'Banking & Finance',
        'pnb': 'Banking & Finance',
        'punjab national bank': 'Banking & Finance',
        'bank of baroda': 'Banking & Finance',
        'bob': 'Banking & Finance',
        'canara bank': 'Banking & Finance',
        'union bank': 'Banking & Finance',
        'idbi': 'Banking & Finance',
        'yes bank': 'Banking & Finance',
        'idfc': 'Banking & Finance',
        'indusind': 'Banking & Finance',
        'indian bank': 'Banking & Finance',
        'allahabad bank': 'Banking & Finance',
        'federal bank': 'Banking & Finance',
        'south indian bank': 'Banking & Finance',
        'karnataka bank': 'Banking & Finance',
        'rbl': 'Banking & Finance',
        'dcb': 'Banking & Finance',
        'citi': 'Banking & Finance',
        'hsbc': 'Banking & Finance',
        'standard chartered': 'Banking & Finance',
        'sc bank': 'Banking & Finance',
        'bajaj finserv': 'Banking & Finance',
        'sbi card': 'Banking & Finance',
        'hdfc card': 'Banking & Finance',
        
        // Indian specific merchants - Transportation
        'ola': 'Transportation',
        'uber': 'Transportation',
        'rapido': 'Transportation',
        'meru': 'Transportation',
        'irctc': 'Transportation',
        'indian railways': 'Transportation',
        'metro rail': 'Transportation',
        'dmrc': 'Transportation',
        'bmtc': 'Transportation',
        'best': 'Transportation',
        'msrtc': 'Transportation',
        'ksrtc': 'Transportation',
        'tsrtc': 'Transportation',
        'apsrtc': 'Transportation',
        'tnstc': 'Transportation',
        'fastag': 'Transportation',
        'paytm fastag': 'Transportation',
        
        // Indian specific merchants - Payment Apps
        'paytm': 'Banking & Finance',
        'phonepe': 'Banking & Finance',
        'gpay': 'Banking & Finance',
        'google pay': 'Banking & Finance',
        'amazon pay': 'Banking & Finance',
        'mobikwik': 'Banking & Finance',
        'freecharge': 'Banking & Finance',
        'upi': 'Banking & Finance',
        'bhim': 'Banking & Finance',
        
        // Indian specific merchants - Entertainment
        'bookmyshow': 'Entertainment',
        'pvr': 'Entertainment',
        'inox': 'Entertainment',
        'netflix': 'Entertainment',
        'hotstar': 'Entertainment',
        'disney': 'Entertainment',
        'amazon prime': 'Entertainment',
        'sony liv': 'Entertainment',
        'zee5': 'Entertainment',
        'voot': 'Entertainment',
        'jiocinema': 'Entertainment',
        'altbalaji': 'Entertainment',
        'eros': 'Entertainment',
        
        // Indian specific merchants - Health
        'lenskart': 'Health',
        'apollo': 'Health',
        'apollo pharmacy': 'Health',
        'medlife': 'Health',
        'pharmeasy': 'Health',
        'netmeds': 'Health',
        'practo': 'Health',
        'cult fit': 'Health',
        'cult': 'Health',
        'medplus': 'Health',
        'wellness forever': 'Health',
        'thyrocare': 'Health',
        'dr lal': 'Health',
        'dr lal path labs': 'Health',
        'metropolis': 'Health',
        'max healthcare': 'Health',
        'fortis': 'Health',
        'manipal': 'Health',
        'apollo hospitals': 'Health',
        'aiims': 'Health',
        
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
            
            // Extract text from all pages with better preservation of table structure
            let extractedText = '';
            
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const textContent = await page.getTextContent();
                
                // Process text items to better preserve tabular format
                let lastY = null;
                let lineText = '';
                
                // Sort items by vertical position (y) to group by lines
                const sortedItems = textContent.items.sort((a, b) => {
                    return b.transform[5] - a.transform[5]; // Sort by Y position
                });
                
                // Group text by lines based on Y position
                for (const item of sortedItems) {
                    const currentY = Math.round(item.transform[5]);
                    
                    // If this is a new line
                    if (lastY !== null && Math.abs(currentY - lastY) > 5) {
                        extractedText += lineText.trim() + '\n';
                        lineText = '';
                    }
                    
                    // Add text to current line
                    lineText += item.str + ' ';
                    lastY = currentY;
                }
                
                // Add the last line
                if (lineText.trim()) {
                    extractedText += lineText.trim() + '\n';
                }
                
                // Add page break
                extractedText += '\n';
            }
            
            // Log a more extensive sample of the extracted text for debugging
            console.log('Extracted text sample:', extractedText.substring(0, 500) + '...');
            
            // Log a few complete lines from the middle of the document to see transaction format
            const lines = extractedText.split('\n');
            if (lines.length > 20) {
                console.log('Sample transaction lines:');
                for (let i = 20; i < Math.min(25, lines.length); i++) {
                    console.log(`Line ${i}: ${lines[i]}`);
                }
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
        
        // Check for HDFC Bank statement pattern
        if (transactions.length === 0) {
            const isHDFCStatement = text.includes("HDFC BANK") || 
                                    text.includes("HDFC Bank") || 
                                    text.includes("hdfc bank") ||
                                    text.includes("HDFC CREDIT CARD") ||
                                    (text.includes("Date") && text.includes("Narration") && 
                                    (text.includes("Withdrawal Amt") || text.includes("Deposit Amt")));
                                    
            if (isHDFCStatement) {
                console.log("Detected HDFC Bank statement format");
                
                // Process HDFC statement - typically has Date, Narration, Withdrawal, Deposit format
                const hdfcPattern = PATTERNS.HDFC_BANK_STATEMENT;
                let match;
                
                while ((match = hdfcPattern.exec(text)) !== null) {
                    const dateStr = match[1];
                    const description = match[2].trim();
                    // Clean amount string - remove commas and currency symbols
                    const amountStr = match[3].replace(/[,₹]/g, '').trim();
                    
                    const date = parseDate(dateStr);
                    const amount = parseFloat(amountStr);
                    
                    // Determine if it's a credit (Cr) or debit (Dr) transaction
                    const hasCredit = match[0].includes('Cr') || match[0].includes('CR');
                    const transactionType = hasCredit ? 'income' : 'expense';
                    
                    if (date && !isNaN(amount)) {
                        transactions.push({
                            date: date,
                            description: description,
                            amount: amount,
                            type: transactionType,
                            category: transactionType === 'income' ? 'Income' : guessCategory(description)
                        });
                    }
                }
                
                // If no transactions found, try line-by-line analysis
                if (transactions.length === 0) {
                    console.log("Trying alternative HDFC parsing method");
                    
                    for (let i = 0; i < lines.length; i++) {
                        const line = lines[i].trim();
                        if (line === '') continue;
                        
                        // Look for date pattern DD/MM/YYYY (common in HDFC statements)
                        const dateMatch = /(\d{2}\/\d{2}\/\d{4})/.exec(line);
                        if (!dateMatch) continue;
                        
                        const dateStr = dateMatch[1];
                        const date = parseDate(dateStr);
                        
                        if (!date) continue;
                        
                        // Extract description and amount
                        const parts = line.split(/\s{2,}/); // Split by multiple spaces
                        
                        if (parts.length >= 3) {
                            const description = parts[1].trim();
                            let amount = 0;
                            let transactionType = 'expense';
                            
                            // Find the amount - usually the last part with a decimal
                            for (let j = 2; j < parts.length; j++) {
                                const amountMatch = /(\d+,?\d*\.\d{2})/.exec(parts[j]);
                                if (amountMatch) {
                                    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
                                    
                                    // Check if this is a credit (CR/Cr) or withdrawal amount
                                    const isCreditPart = parts[j].includes('Cr') || 
                                                        parts[j].includes('CR') || 
                                                        j === parts.length - 1; // Last column is typically balance
                                    
                                    transactionType = isCreditPart ? 'income' : 'expense';
                                    break;
                                }
                            }
                            
                            if (amount > 0) {
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
                
                console.log("Found " + transactions.length + " transactions in HDFC Bank statement");
            }
        }
        
        // Check for Axis Bank statement pattern
        if (transactions.length === 0) {
            // Check if it's an Axis Bank statement by looking for text markers
            const isAxisStatement = text.includes("Statement of Axis Account") || 
                                   text.includes("Axis Bank") || 
                                   (text.includes("Tran Date") && text.includes("Particulars") && text.includes("Debit") && text.includes("Credit"));
            
            if (isAxisStatement) {
                console.log("Detected Axis Bank statement format");
                
                // Instead of relying on regex patterns, let's process the document line by line
                // to ensure we get complete transaction details
                for (let i = 0; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (line === '') continue;
                    
                    // Look for date pattern DD-MM-YYYY (common in Axis statements)
                    const dateMatch = /(\d{2}-\d{2}-\d{4})/.exec(line);
                    if (!dateMatch) continue;
                    
                    const dateStr = dateMatch[1];
                    const date = parseDate(dateStr);
                    
                    if (!date) continue;
                    
                    // Log the entire line for debugging
                    console.log("Found transaction line:", line);
                    
                    // Get the next line as well (sometimes descriptions continue on next line)
                    let fullDescription = "";
                    let amount = 0;
                    let transactionType = 'expense';
                    
                    // Extract data from this line
                    const dateEndIndex = line.indexOf(dateStr) + dateStr.length;
                    let remainingText = line.substring(dateEndIndex).trim();
                    
                    // Look for amount pattern (typically at the end of the line)
                    const amountMatch = /(\d+\.\d{2})/.exec(remainingText);
                    if (amountMatch) {
                        const amountStr = amountMatch[0];
                        const amountIndex = remainingText.lastIndexOf(amountStr);
                        
                        // Get description - everything between date and amount
                        if (amountIndex > 0) {
                            fullDescription = remainingText.substring(0, amountIndex).trim();
                            amount = parseFloat(amountStr);
                            
                            // Check context to determine if expense or income
                            // For Axis Bank, we check if the amount appears after "Debit" or "Credit" column headers
                            if (remainingText.includes("Credit") || remainingText.includes("CR") || 
                                remainingText.includes(" Cr") || remainingText.toLowerCase().includes("credit")) {
                                transactionType = 'income';
                            } else {
                                transactionType = 'expense';
                            }
                        }
                    }
                    
                    // If we have a valid date and amount, add the transaction
                    if (date && amount > 0) {
                        // Clean up the description
                        fullDescription = fullDescription.replace(/\s+/g, ' ').trim();
                        
                        // Check if description is empty, try to use any text from remaining part
                        if (!fullDescription && remainingText) {
                            fullDescription = remainingText.replace(/\s+/g, ' ').trim();
                        }
                        
                        // Check if description is empty and next line doesn't have a date
                        if ((!fullDescription || fullDescription.length < 3) && i + 1 < lines.length && !lines[i + 1].match(/\d{2}-\d{2}-\d{4}/)) {
                            fullDescription = lines[i + 1].trim();
                            i++; // Skip the next line
                        }
                        
                        // If we have a description, create the transaction
                        if (fullDescription) {
                            // Log the full description for debugging
                            console.log("Extracted full description:", fullDescription);
                            
                            transactions.push({
                                date: date,
                                description: fullDescription,
                                amount: amount,
                                type: transactionType,
                                category: transactionType === 'income' ? 'Income' : guessCategory(fullDescription)
                            });
                        }
                    }
                }
                
                // If we still found no transactions, try with the legacy pattern as fallback
                if (transactions.length === 0) {
                    console.log("Fallback to pattern-based extraction for Axis Bank");
                    const axisPattern = PATTERNS.AXIS_BANK_STATEMENT;
                    let match;
                
                while ((match = axisPattern.exec(text)) !== null) {
                    const dateStr = match[1];
                    const date = parseDate(dateStr);
                    
                    if (!date) continue;
                    
                    // Get the full line where this match was found
                    const matchIndex = text.indexOf(match[0]);
                    const lineStartIndex = text.lastIndexOf('\n', matchIndex) + 1;
                    const lineEndIndex = text.indexOf('\n', matchIndex);
                    const line = text.substring(lineStartIndex, lineEndIndex > 0 ? lineEndIndex : text.length);
                    
                    // Extract the description between the date and amounts
                    const dateEndIndex = line.indexOf(dateStr) + dateStr.length;
                    let description = "";
                    let amount = 0;
                    let transactionType = 'expense';
                    
                    // Get the description from the regex match - it should contain the full text
                    // between the date and amount (our improved regex handles this)
                    description = match[2].trim();
                    
                    // Look for debit amount (expense)
                    const debitMatch = /(\d+\.\d{2})/.exec(line.substring(dateEndIndex));
                    
                    if (debitMatch) {
                        // Get the amount from the match
                        amount = parseFloat(debitMatch[0]);
                        transactionType = 'expense';
                    } else {
                        // If no debit, look for credit amount (income)
                        const creditMatch = /(\d+\.\d{2})/.exec(line.substring(dateEndIndex));
                        if (creditMatch) {
                            amount = parseFloat(creditMatch[0]);
                            transactionType = 'income';
                        }
                    }
                    
                    // If description is still empty, try to extract it from the line
                    if (!description) {
                        const debitMatch = /(\d+\.\d{2})/.exec(line.substring(dateEndIndex));
                        if (debitMatch) {
                            const debitStartIndex = line.indexOf(debitMatch[0], dateEndIndex);
                            description = line.substring(dateEndIndex, debitStartIndex).trim();
                        } else {
                            const creditMatch = /(\d+\.\d{2})/.exec(line.substring(dateEndIndex));
                            if (creditMatch) {
                                const creditStartIndex = line.indexOf(creditMatch[0], dateEndIndex);
                                description = line.substring(dateEndIndex, creditStartIndex).trim();
                            }
                        }
                    }
                    
                    // Clean up the description
                    description = description.replace(/\s+/g, ' ').trim();
                    
                    if (amount > 0 && description) {
                        // Log the full description for debugging
                        console.log("Axis Bank transaction:", description);
                        
                        transactions.push({
                            date: date,
                            description: description,
                            amount: amount,
                            type: transactionType,
                            category: transactionType === 'income' ? 'Income' : guessCategory(description)
                        });
                    }
                }
                
                // If still no transactions found, try a more general approach
                if (transactions.length === 0) {
                    console.log("Trying alternative Axis Bank parsing method");
                    
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
                        
                        console.log("Found date in line:", dateStr, line);
                        
                        // Look for amount patterns in this line
                        const amountMatches = line.match(/\d+\.\d{2}/g) || [];
                        
                        if (amountMatches.length > 0) {
                            // Extract description (typically after the date)
                            const dateIndex = line.indexOf(dateStr);
                            const dateEndIndex = dateIndex + dateStr.length;
                            let description = "";
                            let amount = 0;
                            let transactionType = 'expense';
                            
                            // Check the position of the amount in the line to determine if it's debit or credit
                            // In Axis statements, debit is typically before credit
                            const firstAmountIndex = line.indexOf(amountMatches[0]);
                            const secondAmountIndex = amountMatches.length > 1 ? 
                                line.indexOf(amountMatches[1], firstAmountIndex + amountMatches[0].length) : -1;
                            
                            // If there are two amounts, the first is debit and the second is credit
                            if (secondAmountIndex > -1) {
                                // Extract description
                                description = line.substring(dateEndIndex, firstAmountIndex).trim();
                                
                                // Check if the debit or credit amount is non-zero
                                const debitAmount = parseFloat(amountMatches[0]);
                                const creditAmount = parseFloat(amountMatches[1]);
                                
                                if (debitAmount > 0) {
                                    amount = debitAmount;
                                    transactionType = 'expense';
                                } else if (creditAmount > 0) {
                                    amount = creditAmount;
                                    transactionType = 'income';
                                }
                            } else {
                                // If there's only one amount, try to determine if it's debit or credit
                                description = line.substring(dateEndIndex, firstAmountIndex).trim();
                                amount = parseFloat(amountMatches[0]);
                                
                                // Check if the line or next line has any credit/debit indicators
                                const fullContext = line + (i + 1 < lines.length ? ' ' + lines[i + 1] : '');
                                if (fullContext.includes('credit') || fullContext.includes('Credit') || 
                                    fullContext.includes('deposit') || fullContext.includes('Deposit')) {
                                    transactionType = 'income';
                                } else {
                                    transactionType = 'expense';
                                }
                            }
                            
                            // Clean up description by removing any extra spaces
                            description = description.replace(/\s+/g, ' ').trim();
                            
                            // Sometimes description continues on next line, so check
                            if (description === '' && i + 1 < lines.length && !lines[i + 1].match(/\d{2}-\d{2}-\d{4}/)) {
                                description = lines[i + 1].trim();
                                i++; // Skip the next line
                            }
                            
                            if (amount > 0) {
                                transactions.push({
                                    date: date,
                                    description: description,
                                    amount: amount,
                                    type: transactionType,
                                    category: transactionType === 'income' ? 'Income' : guessCategory(description)
                                });
                                
                                console.log("Added transaction:", description, amount, transactionType);
                            }
                        }
                    }
                }
                
                console.log("Found " + transactions.length + " transactions in Axis Bank statement");
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
        // Make the function prioritize Indian date formats (DD-MM-YYYY, DD/MM/YYYY)
        
        // Try DD-MM-YYYY format (common in Indian bank statements like Axis Bank)
        let match = /(\d{2})-(\d{2})-(\d{4})/.exec(dateStr);
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // Months are 0-indexed in JavaScript
            const year = parseInt(match[3]);
            
            // Validate the day and month (to ensure it's actually DD-MM-YYYY)
            if (day > 0 && day <= 31 && month >= 0 && month < 12) {
                return new Date(year, month, day);
            }
        }
        
        // Try DD/MM/YYYY format (Indian format)
        match = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/.exec(dateStr);
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
        
        // As last resort, try the native Date parsing
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }

        return null;
    }
    
    // Guess category based on transaction description
    function guessCategory(description) {
        if (!description) return 'Other';
        
        const descriptionLower = description.toLowerCase();
        
        // First check exact keywords for Indian merchants (which are more specific)
        for (const [keyword, category] of Object.entries(MERCHANT_CATEGORIES)) {
            // Use word boundary for more accurate matching (to avoid partial matches)
            if (descriptionLower.includes(keyword.toLowerCase())) {
                return category;
            }
        }
        
        // Indian transaction patterns
        if (descriptionLower.includes('upi')) return 'Banking & Finance';
        if (descriptionLower.includes('imps')) return 'Banking & Finance';
        if (descriptionLower.includes('neft')) return 'Banking & Finance';
        if (descriptionLower.includes('rtgs')) return 'Banking & Finance';
        if (descriptionLower.includes('emi')) return 'Banking & Finance';
        if (descriptionLower.includes('loan')) return 'Banking & Finance';
        if (descriptionLower.includes('credit card')) return 'Banking & Finance';
        if (descriptionLower.includes('atm')) return 'Banking & Finance';
        
        // More payment contexts
        if (descriptionLower.includes('payment')) {
            if (descriptionLower.includes('electricity') || 
                descriptionLower.includes('water') || 
                descriptionLower.includes('gas') || 
                descriptionLower.includes('bill')) {
                return 'Utilities';
            }
            if (descriptionLower.includes('rent')) return 'Housing';
            if (descriptionLower.includes('school') || 
                descriptionLower.includes('college') || 
                descriptionLower.includes('university')) {
                return 'Education';
            }
        }
        
        // Analyze transaction patterns for Indian banks (eg: "POS XYZ MERCHANT")
        if (descriptionLower.includes('pos ')) {
            // POS transactions - try to extract merchant name
            const posWords = descriptionLower.split(' ');
            const posIndex = posWords.indexOf('pos');
            if (posIndex >= 0 && posIndex < posWords.length - 1) {
                // Try to categorize based on the merchant after "POS"
                const merchantName = posWords.slice(posIndex + 1).join(' ');
                return categorizeMerchant(merchantName);
            }
        }
        
        // Try UPI reference patterns (common in Indian transactions)
        if (descriptionLower.includes('upi-')) {
            // Extract UPI reference (after UPI-)
            const upiParts = descriptionLower.split('upi-');
            if (upiParts.length > 1) {
                return categorizeMerchant(upiParts[1]);
            }
        }
        
        // Common expense indicators
        if (descriptionLower.includes('recharge')) return 'Utilities';
        if (descriptionLower.includes('dth')) return 'Entertainment';
        if (descriptionLower.includes('broadband')) return 'Utilities';
        if (descriptionLower.includes('mobile')) return 'Utilities';
        if (descriptionLower.includes('insurance')) return 'Insurance';
        if (descriptionLower.includes('mutual fund')) return 'Investments';
        if (descriptionLower.includes('investment')) return 'Investments';
        
        // Additional helper function for analyzing merchant names
        function categorizeMerchant(merchant) {
            if (!merchant) return 'Other';
            const merchantLower = merchant.toLowerCase();
            
            // Re-check against our merchant database
            for (const [keyword, category] of Object.entries(MERCHANT_CATEGORIES)) {
                if (merchantLower.includes(keyword.toLowerCase())) {
                    return category;
                }
            }
            
            // Common patterns
            if (/rest|food|cafe|hotel/i.test(merchantLower)) return 'Food & Dining';
            if (/mart|super|grocer|fresh|kirana/i.test(merchantLower)) return 'Groceries';
            if (/med|pharm|hosp|clinic|doctor/i.test(merchantLower)) return 'Health';
            if (/cloth|wear|apparel|mart|shop/i.test(merchantLower)) return 'Shopping';
            if (/air|flight|train|bus|taxi|uber|ola/i.test(merchantLower)) return 'Travel';
            
            return 'Other';
        }
        
        // Default category if no match found
        return 'Other';
    }
    
    // Return public API
    return {
        parsePDF
    };
})();
