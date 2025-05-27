/**
 * Parser utilities for handling different file formats (CSV, PDF, Splitwise)
 */
import Papa from 'papaparse';
import { INCOME_CATEGORY_ID } from '@/constants/categories';
import { parseDate, guessCategory } from "@/utils/parseUtils";
import { parsePDFByCardType } from "./parsePDFUtils";

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

const PDF_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDF_WORKER_JS_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Ensure pdf.js and its worker are loaded
const loadPdfJs = () => {
    return new Promise((resolve, reject) => {
        if (typeof window.pdfjsLib !== 'undefined') {
            resolve();
            return;
        }

        const script = document.createElement('script');
        script.src = PDF_JS_CDN;
        script.onload = () => {
            // Set the worker source for pdf.js
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDF_WORKER_JS_CDN;
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

/**
 * Parse PDF file
 * @param {File} file - PDF file
 * @returns {Promise<Array>} Array of parsed transactions
 */
export async function parsePDF(file, customMappings = [], cardType, password = "") {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
        throw new Error('Invalid file type. Please upload a PDF file.');
    }

    try {
        await loadPdfJs();
        const pdfjsLib = window.pdfjsLib;
        let pdfPassword = password;
        let pdf;
        let extractedText = "";
        while (true) {
            try {
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password: pdfPassword });
                pdf = await loadingTask.promise;
                break;
            } catch (error) {
                if (error && error.name === "PasswordException") {
                    pdfPassword = window.prompt("This PDF is password-protected. Please enter the statement password:", "");
                    if (!pdfPassword) throw new Error("Password required to open this PDF.");
                } else {
                    throw error;
                }
            }
        }
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            const text = textContent.items.map(item => item.str).join('\n');
            extractedText += `\n\n--- Page ${pageNum} ---\n\n${text}`;
        }
        const transactions = parsePDFByCardType(extractedText, customMappings, cardType);
        return transactions;
    } catch (error) {
        if (error && error.name === "PasswordException") {
            while (true) {
                const pdfPassword = window.prompt("This PDF is password-protected. Please enter the statement password:", "");
                if (!pdfPassword) throw new Error("Password required to open this PDF.");
                try {
                    return await parsePDF(file, customMappings, cardType, pdfPassword);
                } catch (err) {
                    if (!(err && err.name === "PasswordException")) throw err;
                }
            }
        }
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