// Utility functions for parsing PDF statements for different credit card types
import { PATTERNS, parseDate, guessCategory } from "./parseUtils";
import { CREDIT_CARD_OPTIONS, CREDIT_CARD_OPTIONS_MAP } from "../constants/creditCardOptions";

// Example parser for HDFC credit card
function parseSwiggyHDFCCreditCard(text, customMappings = []) {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const transactions = [];
    let inTransactionSection = false;
    let currentTransaction = null;
    let i = 0;
    while (i < lines.length) {
        const line = lines[i];
        // Detect end of transaction section
        if (line.includes('Important Information')) {
            break;
        }
        // Detect start of transaction section
        if (!inTransactionSection && line === 'Domestic Transactions') {
            inTransactionSection = true;
            i += 5; // Skip headers (section + 3 header lines)
            continue;
        }
        if (!inTransactionSection) {
            i++;
            continue;
        }
        // Check if line matches a date pattern
        if (inTransactionSection) {
            let date = line;
            if (date) {
                // Start a new transaction
                try {
                    currentTransaction = {
                        date: parseDate(date),
                        source: 'pdf',
                        cardType: 'Swiggy HDFC'
                    };
                } catch {
                    i ++;
                    continue;
                }
                if (!currentTransaction.date) {
                    i ++;
                    continue;
                }
            }
            
            i ++;
            let description = lines[i];
            if (description) {
                try {
                    // Append to description
                    currentTransaction.description = (description || 'Unknown Swiggy HDFC Credit Card Exprense.');
                    
                    currentTransaction.category = currentTransaction.type === 'income' ? 'Income' : guessCategory(currentTransaction.description, customMappings);
                } catch {
                    continue;
                }
            }

            // If in transaction and currentTransaction exists
            i ++;
            let amount = lines[i];
            if (["BANGALORE", "BENGALURU", "GURUGRAM", "GURGAON", "HYDERABAD", "MUMBAI", "PUNE", "CHENNAI", "DELHI", "DELHI (NCR)"].includes(amount)) {
                i ++;
                amount = lines[i];
            }
            if (amount) {
                try {
                    if (/ Cr$/.test(amount)) {
                        currentTransaction.type = 'income';
                    } else {
                        currentTransaction.type = 'expense';
                    }
                    // currentTransaction.amount = parseFloat(amount);
                    currentTransaction.amount = Math.abs(parseFloat(amount.replace(' Cr', '').replace(/,/g, ''))) || 0;
                } catch {
                    continue;
                }
            }

            transactions.push(currentTransaction);
            currentTransaction = null;
        }

        i ++;
    }
    // Push the last transaction if pending
    // if (currentTransaction) {
    //     currentTransaction.category = currentTransaction.type === 'income' ? 'Income' : guessCategory(currentTransaction.description, customMappings);
    //     currentTransaction.amount = Math.abs(currentTransaction.amount);
    //     currentTransaction.source = 'pdf';
    //     currentTransaction.cardType = 'HDFC';
    //     transactions.push(currentTransaction);
    // }
    console.log({ transactions });
    return transactions;
}

// Example parser for ICICI credit card
function parseAmazonICICICreditCard(text, customMappings = []) {
    return [];
}

// Generic parser for unknown credit card types
function parseSbiCashbackCreditCard(text, customMappings = [], cardType = 'Generic') {
    const transactions = [];
    const lines = text.split('\n');
    for (const line of lines) {
        let dateMatch = null;
        for (const pattern of PATTERNS.DATE) {
            const match = pattern.exec(line);
            if (match) {
                dateMatch = match[0];
                break;
            }
        }
        if (!dateMatch) continue;
        let amountMatch = null;
        for (const pattern of PATTERNS.AMOUNT) {
            const match = pattern.exec(line);
            if (match) {
                amountMatch = match[0].replace(/[^0-9.-]+/g, '');
                break;
            }
        }
        if (!amountMatch) continue;
        const description = line.replace(dateMatch, '').replace(amountMatch, '').trim();
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
                source: 'pdf',
                cardType
            });
        }
    }
    return transactions;
}

// General function to select parser based on cardType
export function parsePDFByCardType(text, customMappings = [], cardType) {
    console.log({ text });
    const allowedTypes = CREDIT_CARD_OPTIONS.map(opt => opt.value.toLowerCase());
    if (!cardType || !allowedTypes.includes((cardType || '').toLowerCase())) {
        return [];
    }
    switch ((cardType || '').toLowerCase()) {
        case CREDIT_CARD_OPTIONS_MAP.swiggy_hdfc:
            return parseSwiggyHDFCCreditCard(text, customMappings);
        case CREDIT_CARD_OPTIONS_MAP.amazon_icici:
            return parseAmazonICICICreditCard(text, customMappings);
        case CREDIT_CARD_OPTIONS_MAP.sbi_cashback:
            return parseSbiCashbackCreditCard(text, customMappings);
        default:
            return [];
    }
}