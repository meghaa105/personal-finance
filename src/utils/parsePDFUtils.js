// Utility functions for parsing PDF statements for different credit card types
import { PATTERNS, parseDate, guessCategory } from "./parseUtils";
import { CREDIT_CARD_OPTIONS, CREDIT_CARD_OPTIONS_MAP } from "../constants/creditCardOptions";

// Example parser for HDFC credit card
function parseSwiggyHDFCCreditCard(text, customMappings = []) {
    const transactions = [];
    const lines = text.split('\n');
    for (const line of lines) {
        // Example: 12/03/2024 AMAZON 1,234.56
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
                cardType: 'HDFC'
            });
        }
    }
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