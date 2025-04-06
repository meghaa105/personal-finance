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
            /(\d{1,2}\.\d{1,2}\.\d{2,4})/g,                             // DD.MM.YYYY or MM.DD.YYYY
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
            /(\d+,?\d*\.\d{2})/g                                    // Simple amount pattern (123.45)
        ],

        // Transaction patterns for specific banks
        BANKS: {
            // SBI Bank
            SBI: {
                header: /State Bank of India|SBI/i,
                transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(\d+\.\d{2})\s+(DR|CR)/i,
                transactionLine: /(\d{2}\/\d{2}\/\d{4})|(\d{2}-\d{2}-\d{4}).*?((?:Rs\.|₹|INR)?\s*\d+,?\d*\.\d{2})/i
            },
            // HDFC Bank
            HDFC: {
                header: /HDFC Bank|HDFC/i,
                transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(\d+\.\d{2})\s+(DR|CR)/i,
                transactionLine: /(\d{2}\/\d{2}\/\d{4})|(\d{2}-\d{2}-\d{4}).*?((?:Rs\.|₹|INR)?\s*\d+,?\d*\.\d{2})/i
            },
            // Axis Bank
            AXIS: {
                header: /Axis Bank|AXIS/i,
                transaction: /(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+(\d+\.\d{2})\s+(DR|CR)/i,
                transactionLine: /(\d{2}\/\d{2}\/\d{4})|(\d{2}-\d{2}-\d{4}).*?((?:Rs\.|₹|INR)?\s*\d+,?\d*\.\d{2})/i
            },
            // Generic Indian bank
            GENERIC: {
                transaction: /(\d{2}\/\d{2}\/\d{4})|(\d{2}-\d{2}-\d{4}).*?((?:Rs\.|₹|INR)?\s*\d+,?\d*\.\d{2})/i,
                withdrawalKeywords: /withdrawal|debit|purchase|payment|dr/i,
                depositKeywords: /deposit|credit|refund|salary|cr/i
            },
            // SBI Card
            SBI_CARD: {
                header: /CARD CASHBACK SUMMARY|SBI Card/i,
                transactionLine: /(\d{2}\s+[A-Za-z]{3}\s+\d{2})\s+.*?(\d+,?\d*\.\d{2})\s+([CD])/i
            }
        }
    };

    // Parse PDF file
    async function parsePDF(file) {
        try {
            // Read the file as ArrayBuffer
            const data = await readFileAsArrayBuffer(file);

            // Load the PDF document using PDF.js
            const pdf = await pdfjsLib.getDocument({data}).promise;

            console.log(`PDF loaded with ${pdf.numPages} pages`);

            // Extract text from each page
            let fullText = '';
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const content = await page.getTextContent();

                // Join all items with proper spacing
                const pageText = content.items.map(item => item.str).join(' ');
                fullText += pageText + '\n';
            }

            console.log('Extracted text from PDF');

            // Extract transactions from text
            const transactions = extractTransactions(fullText);

            return {
                success: true,
                transactions,
                rawText: fullText
            };
        } catch (error) {
            console.error('Error parsing PDF:', error);
            throw error;
        }
    }

    // Read file as ArrayBuffer
    function readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = function(event) {
                resolve(event.target.result);
            };

            reader.onerror = function(event) {
                reject(new Error('Failed to read file'));
            };

            reader.readAsArrayBuffer(file);
        });
    }

    // Extract transactions from text
    function extractTransactions(text) {
        const transactions = [];

        // Try to detect bank format
        let bankFormat = 'GENERIC';
        if (text.includes('CARD CASHBACK SUMMARY') || text.includes('SBI Card')) {
            bankFormat = 'SBI_CARD';
            console.log('Detected SBI Card statement');

            // Split into lines and process each line
            const lines = text.split('\n');
            let inTransactionSection = false;

            for (let line of lines) {
                line = line.trim();

                // Skip empty lines
                if (!line) continue;

                // Check for transaction section start
                if (line.includes('Transaction Details') || line.includes('TRANSACTIONS FOR')) {
                    inTransactionSection = true;
                    continue;
                }

                if (inTransactionSection) {
                    // Match date pattern DD MMM YY and transaction details (more flexible pattern)
                    const dateMatch = line.match(/(\d{2}\s+[A-Za-z]{3}\s+\d{2})/);
                    if (dateMatch) {
                        // Look for amounts with type indicator
                        const amountMatches = line.match(/(\d+(?:,\d+)*\.\d{2})\s*([CD])/g);
                        if (amountMatches) {
                            // Get the last amount match as it's typically the transaction amount
                            const lastAmountMatch = amountMatches[amountMatches.length - 1];
                            const [_, amountStr, typeChar] = lastAmountMatch.match(/(\d+(?:,\d+)*\.\d{2})\s*([CD])/);

                            // Clean up the description by removing the date and all amounts
                            let description = line;
                            description = description.replace(dateMatch[0], '');
                            amountMatches.forEach(match => {
                                description = description.replace(match, '');
                            });

                            // Remove multiple spaces and trim
                            description = description.replace(/\s+/g, ' ').trim();

                            // Parse amount and determine type
                            const amount = parseFloat(amountStr.replace(/,/g, ''));
                            const type = typeChar === 'C' ? 'income' : 'expense';

                            // Create transaction object
                            const transaction = {
                                id: Date.now() + Math.random().toString(36).substring(2, 10),
                                date: parseDate(dateMatch[0]),
                                description: description,
                                amount: amount,
                                type: type,
                                source: 'pdf'
                            };

                            // Guess category
                            transaction.category = guessCategory(transaction.description);

                            transactions.push(transaction);
                        }
                    }
                }
            }
        } else if (text.includes('State Bank of India') || text.includes('SBI')) {
            bankFormat = 'SBI';
            console.log('Detected SBI Bank statement');
        } else if (text.includes('HDFC Bank') || text.includes('HDFC')) {
            bankFormat = 'HDFC';
            console.log('Detected HDFC Bank statement');
        } else if (text.includes('Axis Bank') || text.includes('AXIS')) {
            bankFormat = 'AXIS';
            console.log('Detected Axis Bank statement');
        } else {
            console.log('Using generic transaction extraction');
        }

        // Split text into lines
        const lines = text.split('\n');
        let transactionSection = false;

        // Debug: Log more lines to see if we can find transaction section markers
        console.log('Looking for transaction section markers in PDF content:');
        for (let i = 0; i < Math.min(lines.length, 50); i++) {
            if (lines[i].trim().length > 5) {
                console.log(`Line ${i}: ${lines[i].trim().substring(0, 100)}`);
            }
        }

        // More aggressive search for transaction section markers in Indian bank statements
        // First pass: just look for any date patterns to identify transactions
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            // Skip short or empty lines
            if (line.length < 5) continue;

            // Look for ANY date pattern in Indian format (DD/MM/YYYY or DD-MM-YYYY)
            const dateMatch = line.match(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/);

            // If line has a date and some amount-like numbers
            if (dateMatch && line.match(/\d+,?\d*\.\d{2}/)) {
                console.log(`Found potential transaction with date pattern at line ${i}: ${line}`);

                // Extract amount looking for any number with decimal point
                const amountMatches = line.match(/\d+,?\d*\.\d{2}/g);
                if (amountMatches && amountMatches.length > 0) {
                    let amount = parseFloat(amountMatches[amountMatches.length - 1].replace(/,/g, ''));

                    // Determine transaction type based on context
                    let type = 'expense'; // Default
                    if (line.match(/cr|credit|deposit|salary|interest earned|refund/i)) {
                        type = 'income';
                    }

                    // Create description by removing date and amounts
                    let description = line.replace(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/, '')
                                         .replace(/\d+,?\d*\.\d{2}/g, '')
                                         .replace(/(cr|dr|credit|debit)/gi, '')
                                         .trim();

                    // Sometimes the next line contains additional description information
                    const nextLine = i < lines.length - 1 ? lines[i + 1].trim() : '';
                    if (nextLine && !nextLine.match(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/) && 
                        !nextLine.match(/page|balance|total/i) && 
                        nextLine.length > 3 && 
                        nextLine.length < 100) {
                        description += ' ' + nextLine;
                        i++; // Skip next line
                    }

                    // Create transaction
                    const transaction = {
                        id: Date.now() + Math.random().toString(36).substring(2, 10),
                        date: parseDate(dateMatch[0]),
                        description: description,
                        amount: amount,
                        type: type,
                        source: 'pdf'
                    };

                    // Guess category
                    transaction.category = guessCategory(transaction.description);

                    console.log(`Created transaction: ${JSON.stringify(transaction)}`);

                    // Add if valid
                    if (transaction.date && transaction.amount > 0) {
                        transactions.push(transaction);
                    }
                }
            }
        }

        // If we still don't have transactions, try traditional section markers approach
        if (transactions.length === 0) {
            console.log('No transactions found with direct date matching, trying section markers...');

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Skip short or empty lines
                if (line.length < 5) continue;

                // Look for transaction section markers with broader patterns
                if (line.match(/transaction|statement|history|date|particulars|tran.*date|description|debit|credit|particulars|dr|cr|withdrawal|deposit|balance|amount/i)) {
                    transactionSection = true;
                    console.log(`Found transaction section marker at line ${i}: ${line}`);

                    // Process next lines until end of section or file
                    for (let j = i + 1; j < lines.length; j++) {
                        const transLine = lines[j].trim();

                        // Skip short lines
                        if (transLine.length < 5) continue;

                        // Check for end of transaction section
                        if (transLine.match(/page|total|closing|opening|balance carried|balance brought|summary|grand total/i) && 
                            transLine.length < 50) {
                            console.log(`End of transaction section at line ${j}: ${transLine}`);
                            break;
                        }

                        // Look for date pattern in this line
                        const dateMatch = transLine.match(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/);

                        if (dateMatch) {
                            console.log(`Found date in transaction section: ${dateMatch[0]} in line: ${transLine}`);

                            // Look for amount with better pattern matching for Indian bank format
                            const amountMatches = transLine.match(/(?:Rs\.?|₹)?\s*(\d+(?:,\d+)*(?:\.\d{2})?)/g);

                            if (amountMatches && amountMatches.length > 0) {
                                // Clean and parse amount
                                const cleanAmount = amountMatches[amountMatches.length - 1]
                                    .replace(/[₹Rs\.,]/g, '')
                                    .trim();
                                let amount = parseFloat(cleanAmount);

                                // Extract description more accurately
                                let description = transLine
                                    .replace(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/, '') // Remove date
                                    .replace(/(?:Rs\.?|₹)?\s*\d+(?:,\d+)*(?:\.\d{2})?/g, '') // Remove amounts
                                    .replace(/\s+/g, ' ') // Normalize spaces
                                    .trim();


                                // Determine transaction type
                                let type = 'expense'; // Default
                                if (transLine.match(/cr|credit|deposit|salary|interest earned|refund/i)) {
                                    type = 'income';
                                }

                                // Create transaction
                                const transaction = {
                                    id: Date.now() + Math.random().toString(36).substring(2, 10),
                                    date: parseDate(dateMatch[0]),
                                    description: description,
                                    amount: amount,
                                    type: type,
                                    source: 'pdf'
                                };

                                // Guess category
                                transaction.category = guessCategory(transaction.description);

                                // Add if valid
                                if (transaction.date && transaction.amount > 0) {
                                    console.log(`Valid transaction in section: ${transaction.date} - ${transaction.description} - ${transaction.amount}`);
                                    transactions.push(transaction);
                                }
                            }
                        }
                    }

                    break; // We've processed the transaction section, no need to continue the main loop
                }
            }
        }

        // Special handling for SBI statements as a last resort
        if (transactions.length === 0 && bankFormat === 'SBI') {
            console.log('Trying SBI-specific transaction parsing...');

            // For SBI statements, try a more aggressive approach
            // Look for lines that match a date pattern followed by an amount
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();

                // Skip short lines or lines that are likely headers
                if (line.length < 10 || line.match(/^(date|description|amount|balance|opening|closing)/i)) continue;

                // Look for SBI date formats (DD-MM-YYYY or DD/MM/YYYY)
                const dateMatch = line.match(/\d{2}[\/-]\d{2}[\/-]\d{4}/);
                if (dateMatch) {
                    console.log(`SBI date pattern found: ${dateMatch[0]} in line: ${line}`);

                    // Look for all amounts in the line
                    const amounts = [];
                    let m;
                    const amountRegex = /\d{1,3}(?:,\d{3})*\.\d{2}/g;
                    while ((m = amountRegex.exec(line)) !== null) {
                        // This is necessary to avoid infinite loops with zero-width matches
                        if (m.index === amountRegex.lastIndex) {
                            amountRegex.lastIndex++;
                        }
                        amounts.push(parseFloat(m[0].replace(/,/g, '')));
                    }

                    if (amounts.length > 0) {
                        // Use the highest amount as the transaction amount
                        const amount = Math.max(...amounts);

                        // Simple type detection
                        let type = 'expense';
                        if (line.match(/credit|salary|interest|refund|cr/i)) {
                            type = 'income';
                        }

                        // Create a clean description
                        let description = line.replace(/\d{2}[\/-]\d{2}[\/-]\d{4}/, '')
                                             .replace(/\d{1,3}(?:,\d{3})*\.\d{2}/g, '')
                                             .replace(/(dr|cr|debit|credit)/gi, '')
                                             .trim();

                        // Create transaction
                        const transaction = {
                            id: Date.now() + Math.random().toString(36).substring(2, 10),
                            date: parseDate(dateMatch[0]),
                            description: description,
                            amount: amount,
                            type: type,
                            source: 'pdf'
                        };

                        // Guess category
                        transaction.category = guessCategory(transaction.description);

                        console.log(`Created SBI transaction: ${JSON.stringify(transaction)}`);

                        if (transaction.date && transaction.amount > 0) {
                            transactions.push(transaction);
                        }
                    }
                }
            }
        }

        console.log(`Extracted ${transactions.length} transactions from PDF`);
        return transactions;
    }

    // Extract date from text
    function extractDate(text) {
        for (const pattern of PATTERNS.DATE) {
            const match = pattern.exec(text);
            if (match) {
                return match[0];
            }
            // Reset lastIndex for global regex
            pattern.lastIndex = 0;
        }
        return null;
    }

    // Extract amount and determine if debit or credit
    function extractAmount(text) {
        let amount = 0;
        let type = 'expense'; // Default to expense

        // Look for DR/CR markers common in Indian banks
        if (text.match(/\bdr\b|\bdebit\b/i)) {
            type = 'expense';
        } else if (text.match(/\bcr\b|\bcredit\b/i)) {
            type = 'income';
        }

        // Extract numeric amount
        for (const pattern of PATTERNS.AMOUNT) {
            const match = pattern.exec(text);
            if (match) {
                // Clean and parse the amount string
                let amountStr = match[1] || match[0];
                amountStr = amountStr.replace(/[₹Rs\.INR,]/g, '').trim();
                amount = parseFloat(amountStr);
                break;
            }
            // Reset lastIndex for global regex
            pattern.lastIndex = 0;
        }

        // Determine transaction type based on contextual clues if not already set
        if (type === 'expense' && text.match(/deposit|credit|salary|interest earned|refund/i)) {
            type = 'income';
        } else if (type === 'income' && text.match(/withdrawal|debit|payment|purchase|fee|charge/i)) {
            type = 'expense';
        }

        return {
            amount,
            type
        };
    }

    // Parse date string to Date object
    function parseDate(dateStr) {
        if (!dateStr) return null;

        console.log(`Attempting to parse date: ${dateStr}`);

        // Handle Indian format - DD/MM/YYYY or DD-MM-YYYY (most common in Indian bank statements)
        let match = /^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})$/.exec(dateStr);
        if (match) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1; // Months are 0-indexed in JavaScript
            let year = parseInt(match[3]);

            // Adjust two-digit years
            if (year < 100) {
                year = year < 50 ? 2000 + year : 1900 + year;
            }

            const parsedDate = new Date(year, month, day);
            console.log(`Parsed Indian format date: ${parsedDate.toISOString()}`);
            return parsedDate;
        }

        // Try to handle text month formats like "DD MMM YYYY" (e.g., "15 Jan 2023")
        match = /(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(\d{2,4})/i.exec(dateStr);
        if (match) {
            const day = parseInt(match[1]);
            const monthStr = match[2].toLowerCase();
            let year = parseInt(match[3]);

            // Map month string to number
            const monthMap = {
                'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
                'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
            };

            const month = monthMap[monthStr.substring(0, 3)];

            // Adjust two-digit years
            if (year < 100) {
                year = year < 50 ? 2000 + year : 1900 + year;
            }

            const parsedDate = new Date(year, month, day);
            console.log(`Parsed text month format date: ${parsedDate.toISOString()}`);
            return parsedDate;
        }

        // Try other common formats as a last resort
        try {
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                console.log(`Parsed using standard Date constructor: ${date.toISOString()}`);
                return date;
            }
        } catch (e) {
            console.log(`Error parsing date with Date constructor: ${e.message}`);
        }

        console.log(`Failed to parse date: ${dateStr}`);
        // Fallback to current date if unable to parse (better than null for debugging)
        return new Date();
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

        // Default category if no match found
        return 'Other';
    }

    // Return public API
    return {
        parsePDF
    };
})();