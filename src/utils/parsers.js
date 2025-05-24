/**
 * Parser utilities for handling different file formats (CSV, PDF, Splitwise)
 */
import Papa from 'papaparse';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import { INCOME_CATEGORY_ID } from '@/constants/categories';
import { PATTERNS, parseDate, guessCategory } from "@/utils/parseUtils";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
                                const date = parseDate(row.Date || row.date || row["Tran Date"]);
                                const description = row.Description || row.description || row.PARTICULARS || 'Unknown';
                                const amount = parseFloat((row.Amount || row.amount || '0').replace(/[^0-9.-]+/g, ''));

                                const income = parseFloat(row.CR || row.Income || row.income || 0);
                                const expense = parseFloat(row.DR || row.Income || row.income || 0);
                                const bankBalance = parseFloat(row.BAL || row.Balance || row.balance || 0); // Assuming this is the balance after the transaction

                                if (!date) return null;

                                const type = expense ? 'expense' : 'income';
                                const transaction = {
                                    date,
                                    description: description.trim(),
                                    amount: type === 'expense' ? Math.abs(expense) : Math.abs(income),
                                    type,
                                    category: type === 'income' ? INCOME_CATEGORY_ID : guessCategory(description, customMappings),
                                    source: 'csv',
                                    bankBalance
                                };
                                return transaction;
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
export async function parsePDF(file, customMappings = [], cardType) {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Invalid file type. Please upload a PDF file.');
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const password = ""
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password });
        const pdf = await loadingTask.promise;
        let extractedText = "";

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).join('\n');
            extractedText += `\n\n--- Page ${pageNum} ---\n\n${text}`;
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