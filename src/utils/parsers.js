/**
 * Parser utilities for handling different file formats (CSV, PDF, Splitwise)
 */
import Papa from 'papaparse';
import { OTHER_CATEGORY_ID, INCOME_CATEGORY_ID } from '@/constants/categories';

// Regular expression patterns for different types of bank statements
const PATTERNS = {
    // Date patterns (various formats)
    DATE: [
        /(\d{1,2}\/\d{1,2}\/\d{2,4})/g, // MM/DD/YYYY or M/D/YY
        /(\d{1,2}-\d{1,2}-\d{2,4})/g, // MM-DD-YYYY or M-D-YY
        /(\d{2}\.\d{2}\.\d{2,4})/g, // DD.MM.YYYY or MM.DD.YYYY
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.]\d{1,2},?\s\d{2,4}/gi, // Month DD, YYYY
        /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/gi, // DD MMM YY/YYYY (Indian format)
        /(\d{2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})/gi, // DD Month YYYY
        /(\d{2}-\d{2}-\d{4})/g, // DD-MM-YYYY (common in Indian bank statements)
        /(\d{2}\/\d{2}\/\d{4})/g, // DD/MM/YYYY (another common Indian format)
    ],

    // Amount patterns
    AMOUNT: [
        /₹\s?(\d+,?\d*\.\d{2})/g, // ₹123.45 or ₹ 1,234.56
        /Rs\.\s?(\d+,?\d*\.\d{2})/g, // Rs. 123.45 or Rs. 1,234.56
        /INR\s?(\d+,?\d*\.\d{2})/g, // INR 123.45 or INR 1,234.56
        /(\d+,?\d*\.\d{2})\s?INR/g, // 123.45 INR or 1,234.56 INR
        /(\d+,?\d*\.\d{2})\s?[CD]$/g, // 1,234.56 C or 1,234.56 D (Credit/Debit indicator)
        /(\d+,?\d*\.\d{2})/g, // 123.45 or 1,234.56 (decimal amount)
        /(\d+,\d+\.\d{2})/g, // 1,234.56 (with comma thousand separator)
        /(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/g, // 1,234 or 1,234.56 (comma-separated thousands)
        /([0-9.]+)/g, // Any number with or without decimal places
    ],
};

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string in various formats
 * @returns {Date|null} Parsed date or null if invalid
 */
function parseDate(dateStr) {
    if (!dateStr) return null;

    // Try parsing with Date.parse first
    const parsed = Date.parse(dateStr);
    if (!isNaN(parsed)) {
        return new Date(parsed);
    }

    // Try different date formats
    const formats = [
        // MM/DD/YYYY
        { regex: /^(\d{1,2})\/?(\d{1,2})\/?(\d{4})$/, fn: (m) => new Date(m[3], m[1] - 1, m[2]) },
        // DD-MM-YYYY
        { regex: /^(\d{1,2})-?(\d{1,2})-?(\d{4})$/, fn: (m) => new Date(m[3], m[2] - 1, m[1]) },
        // DD MMM YYYY
        { regex: /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i,
          fn: (m) => new Date(m[3], new Date(Date.parse(m[2] + " 1, 2000")).getMonth(), m[1]) },
    ];

    for (const format of formats) {
        const match = dateStr.match(format.regex);
        if (match) {
            const date = format.fn(match);
            if (date instanceof Date && !isNaN(date)) {
                return date;
            }
        }
    }

    return null;
}

/**
 * Guess transaction category based on description
 * @param {string} description - Transaction description
 * @returns {string} Guessed category
 */
function guessCategory(description, customMappings = {}) {
    if (!description) return OTHER_CATEGORY_ID;

    const descriptionLower = description.toLowerCase();

    // Check for income indicators
    if (/salary|income|credit received|deposit|refund|cashback/i.test(descriptionLower)) {
        return INCOME_CATEGORY_ID;
    }

    // Check custom mappings first
    for (const [category, patterns] of Object.entries(customMappings)) {
        if (patterns.some(pattern => descriptionLower.includes(pattern.toLowerCase()))) {
            return category;
        }
    }

    return OTHER_CATEGORY_ID;
}

/**
 * Parse CSV file
 * @param {File} file - CSV file
 * @returns {Promise<Array>} Array of parsed transactions
 */
export async function parseCSV(file, customMappings = []) {
    return new Promise((resolve, reject) => {
        if (!file || !file.name.toLowerCase().endsWith('.csv')) {
            reject(new Error('Invalid file type. Please upload a CSV file.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                Papa.parse(event.target.result, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        const transactions = results.data
                            .filter(row => row && typeof row === 'object')
                            .map(row => {
                                const date = parseDate(row.Date || row.date);
                                const description = row.Description || row.description || 'Unknown';
                                const amount = parseFloat((row.Amount || row.amount || '0').replace(/[^0-9.-]+/g, ''));

                                if (!date || isNaN(amount)) return null;

                                const type = amount < 0 ? 'expense' : 'income';
                                return {
                                    date,
                                    description: description.trim(),
                                    amount: Math.abs(amount),
                                    type,
                                    category: type === 'income' ? 'Income' : guessCategory(description, customMappings),
                                    source: 'csv'
                                };
                            })
                            .filter(t => t !== null);

                        resolve(transactions);
                    },
                    error: (error) => reject(new Error(`Failed to parse CSV: ${error.message}`))
                });
            } catch (error) {
                reject(new Error(`Failed to process CSV: ${error.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Parse PDF file
 * @param {File} file - PDF file
 * @returns {Promise<Array>} Array of parsed transactions
 */
export async function parsePDF(file, customMappings = []) {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Invalid file type. Please upload a PDF file.');
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        let extractedText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map(item => item.str)
                .join(' ');
            extractedText += pageText + "\n";
        }

        // Extract transactions using patterns
        const transactions = [];
        const lines = extractedText.split('\n');

        for (const line of lines) {
            // Skip empty lines
            if (!line.trim()) continue;

            // Try to match date
            let dateMatch = null;
            for (const pattern of PATTERNS.DATE) {
                const match = pattern.exec(line);
                if (match) {
                    dateMatch = match[0];
                    break;
                }
            }

            if (!dateMatch) continue;

            // Try to match amount
            let amountMatch = null;
            for (const pattern of PATTERNS.AMOUNT) {
                const match = pattern.exec(line);
                if (match) {
                    amountMatch = match[0].replace(/[^0-9.-]+/g, '');
                    break;
                }
            }

            if (!amountMatch) continue;

            // Extract description (text between date and amount)
            const description = line
                .replace(dateMatch, '')
                .replace(amountMatch, '')
                .trim();

            if (!description) continue;

            const date = parseDate(dateMatch);
            const amount = parseFloat(amountMatch);

            if (date && !isNaN(amount)) {
                const type = amount < 0 ? 'expense' : 'income';
                transactions.push({
                    date,
                    description,
                    amount: Math.abs(amount),
                    type,
                    category: type === 'income' ? 'Income' : guessCategory(description, customMappings),
                    source: 'pdf'
                });
            }
        }

        return transactions;
    } catch (error) {
        throw new Error(`Failed to parse PDF: ${error.message}`);
    }
}

/**
 * Parse Splitwise CSV file
 * @param {File} file - Splitwise CSV file
 * @returns {Promise<Array>} Array of parsed transactions
 */
export async function parseSplitwise(file, customMappings = []) {
    return new Promise((resolve, reject) => {
        if (!file || !file.name.toLowerCase().endsWith('.csv')) {
            reject(new Error('Invalid file type. Please upload a Splitwise CSV file.'));
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                Papa.parse(event.target.result, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (results) => {
                        // Validate Splitwise format
                        const headers = results.meta.fields || [];
                        const requiredHeaders = ['Date', 'Description', 'Category', 'Cost', 'Currency', 'Megha Agarwal'];
                        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

                        if (missingHeaders.length > 0) {
                            reject(new Error(`Invalid Splitwise CSV format. Missing headers: ${missingHeaders.join(', ')}`));
                            return;
                        }

                        const transactions = results.data
                            .filter(row => row && typeof row === 'object')
                            .filter(row => {
                                const meghaShare = parseFloat(row['Megha Agarwal'] || '0');
                                if (meghaShare === 0) return false;
                                return true;
                            })
                            .map(row => {
                                try {
                                    const date = parseDate(row.Date);
                                    if (!date) return null;

                                    const description = row.Description?.trim() || 'Unknown Splitwise Transaction';
                                    if (!description) return null;

                                    let amount = 0;
                                    if (row.Cost) {
                                        amount = Math.abs(parseFloat(row.Cost));
                                    }

                                    if (isNaN(amount) || amount === 0) return null;

                                    const category = guessCategory(description, customMappings);

                                    const isIncome = category === "Income" || /received|refund|credit/i.test(description);
                                    const isExpense = /paid|spent|debit|expense|upi|transfer to/i.test(description);
                                    const type = isIncome ? "income" : isExpense ? "expense" : "expense";
                                    return {
                                        date,
                                        description,
                                        amount,
                                        type,
                                        category,
                                        source: 'splitwise',
                                        currency: row.Currency || 'INR'
                                    };
                                } catch (error) {
                                    console.error('Error processing Splitwise row:', error);
                                    return null;
                                }
                            })
                            .filter(t => t !== null);

                        if (transactions.length === 0) {
                            reject(new Error('No valid transactions found in the file'));
                            return;
                        }

                        resolve(transactions);
                    },
                    error: (error) => reject(new Error(`Failed to parse Splitwise CSV: ${error.message}`))
                });
            } catch (error) {
                reject(new Error(`Failed to process Splitwise file: ${error.message}`));
            }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}