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
        if (text.includes('State Bank of India') || text.includes('SBI')) {
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
        
        // Debug: Log first 15 lines to see if we can find transaction section markers
        console.log('Looking for transaction section markers in PDF content:');
        for (let i = 0; i < Math.min(lines.length, 15); i++) {
            if (lines[i].trim().length > 5) {
                console.log(`Line ${i}: ${lines[i].trim().substring(0, 100)}`);
            }
        }
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            
            // Skip short or empty lines
            if (line.trim().length < 5) continue;
            
            // Look for transaction section markers - more lenient now for Indian bank statements
            if (line.match(/transaction detail|statement of account|transaction history|date.*description.*amount|date.*particulars|tran.?date|description|debit|credit|particulars|dr|cr|withdrawal|deposit/i)) {
                transactionSection = true;
                console.log(`Found transaction section marker at line ${i}: ${line.trim().substring(0, 100)}`);
                continue;
            }
            
            // If we're in the transaction section and line has date-like pattern
            if (transactionSection && line.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/)) {
                console.log(`Potential transaction line ${i}: ${line.trim().substring(0, 100)}`);
                
                // Extract date
                const dateMatch = extractDate(line);
                
                if (dateMatch) {
                    console.log(`Date match found: ${dateMatch}`);
                    
                    // For multiline transaction descriptions, try to combine next lines
                    let fullLine = line;
                    const nextLine = lines[i + 1] ? lines[i + 1].trim() : '';
                    
                    // If next line doesn't have a date and isn't a header, it's part of this transaction
                    if (nextLine && !nextLine.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/) && !nextLine.match(/page|balance|total/i)) {
                        fullLine += ' ' + nextLine;
                        i++; // Skip next line as we've included it
                    }
                    
                    // Extract amount and type (DR/CR)
                    const amountInfo = extractAmount(fullLine);
                    console.log(`Amount extracted: ${amountInfo.amount}, Type: ${amountInfo.type}`);
                    
                    if (amountInfo.amount) {
                        // Create transaction object
                        const transaction = {
                            id: Date.now() + Math.random().toString(36).substring(2, 10),
                            date: parseDate(dateMatch),
                            description: fullLine.replace(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/, '')
                                         .replace(/₹\s?\d+,?\d*\.\d{2}|Rs\.\s?\d+,?\d*\.\d{2}|INR\s?\d+,?\d*\.\d{2}|\d+,?\d*\.\d{2}\s?INR|\d+,?\d*\.\d{2}/g, '')
                                         .replace(/(dr|cr)$/i, '')
                                         .trim(),
                            amount: Math.abs(amountInfo.amount),
                            type: amountInfo.type,
                            source: 'pdf'  // Add source information
                        };
                        
                        // Guess category
                        transaction.category = guessCategory(transaction.description);
                        
                        // Add to transactions array if valid
                        if (transaction.date && transaction.amount > 0) {
                            console.log(`Valid transaction found: ${transaction.date} - ${transaction.description} - ${transaction.amount}`);
                            transactions.push(transaction);
                        } else {
                            console.log(`Invalid transaction: missing date or amount`);
                        }
                    }
                }
            }
        }
        
        // If no transactions found, try an alternative approach specifically for SBI format
        if (transactions.length === 0 && bankFormat === 'SBI') {
            console.log('Trying alternative SBI transaction parsing...');
            
            // SBI typically has transaction sections starting with patterns like
            // "Date", "Description", "Debit", "Credit", "Balance"
            let tableHeaders = false;
            
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i].trim();
                
                // Look for table headers
                if (line.match(/Date|Tran Date|Value Date|Description|Particulars|Debit|Credit|Balance|Amount/i) && 
                    !tableHeaders && line.length > 10) {
                    tableHeaders = true;
                    console.log(`Found SBI table headers at line ${i}: ${line}`);
                    continue;
                }
                
                // If we found headers and this line has a date pattern
                if (tableHeaders && line.match(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/)) {
                    console.log(`SBI transaction line: ${line}`);
                    
                    // For SBI, dates are usually DD-MM-YYYY or DD/MM/YYYY
                    const dateMatch = line.match(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/);
                    
                    if (dateMatch) {
                        // Extract amount (SBI often separates debit and credit in different columns)
                        let amount = 0;
                        let type = 'expense';
                        
                        // Look for numbers that could be amounts (with decimal points)
                        const amountMatches = line.match(/\d+,?\d*\.\d{2}/g);
                        
                        if (amountMatches && amountMatches.length > 0) {
                            // Take the last amount as it's often the transaction amount
                            // (first might be balance)
                            amount = parseFloat(amountMatches[amountMatches.length - 1].replace(/,/g, ''));
                            
                            // Determine if credit or debit - in SBI, usually indicated by position or CR/DR
                            if (line.includes('CR') || line.includes('CREDIT') || line.toLowerCase().includes('credit')) {
                                type = 'income';
                            } else if (line.includes('DR') || line.includes('DEBIT') || line.toLowerCase().includes('debit')) {
                                type = 'expense';
                            }
                            
                            // Create transaction
                            const transaction = {
                                id: Date.now() + Math.random().toString(36).substring(2, 10),
                                date: parseDate(dateMatch[0]),
                                description: line.replace(/\d{2}[\/-]\d{2}[\/-]\d{2,4}/, '')
                                             .replace(/\d+,?\d*\.\d{2}/g, '')
                                             .replace(/(CR|DR|CREDIT|DEBIT)/gi, '')
                                             .trim(),
                                amount: amount,
                                type: type,
                                source: 'pdf'
                            };
                            
                            // Guess category
                            transaction.category = guessCategory(transaction.description);
                            
                            // Add to transactions array if valid
                            if (transaction.date && transaction.amount > 0) {
                                console.log(`Valid SBI transaction found: ${transaction.date} - ${transaction.description} - ${transaction.amount}`);
                                transactions.push(transaction);
                            }
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
        
        // Handle Indian format - DD/MM/YYYY
        let match = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/.exec(dateStr);
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
        
        // Try other common formats
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date;
        }
        
        // Fallback to null
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
        
        // Default category if no match found
        return 'Other';
    }
    
    // Return public API
    return {
        parsePDF
    };
})();
