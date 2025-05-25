// Utility functions and constants for parsing dates, categories, and patterns
import { OTHER_CATEGORY_ID, INCOME_CATEGORY_ID } from '@/constants/categories';

// Regular expression patterns for different types of bank statements
export const PATTERNS = {
    DATE: [
        /(\d{1,2}\/\d{1,2}\/\d{2,4})/g,
        /(\d{1,2}-\d{1,2}-\d{2,4})/g,
        /(\d{2}\.\d{2}\.\d{2,4})/g,
        /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[\s\.]\d{1,2},?\s\d{2,4}/gi,
        /(\d{2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{2,4})/gi,
        /(\d{2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{2,4})/gi,
        /(\d{2}-\d{2}-\d{4})/g,
        /(\d{2}\/\d{2}\/\d{4})/g
    ],
    AMOUNT: [
        /₹\s?(\d+,?\d*\.\d{2})/g,
        /Rs\.\s?(\d+,?\d*\.\d{2})/g,
        /INR\s?(\d+,?\d*\.\d{2})/g,
        /(\d+,?\d*\.\d{2})\s?INR/g,
        /(\d+,?\d*\.\d{2})\s?[CD]$/g,
        /(\d+,?\d*\.\d{2})/g,
        /(\d+,\d+\.\d{2})/g,
        /(\d{1,3}(?:,\d{3})+(?:\.\d{2})?)/g,
        /([0-9.]+)/g
    ]
};

/**
 * Parse date string to Date object
 * @param {string} dateStr - Date string in various formats
 * @returns {Date|null} Parsed date or null if invalid
 */
export function parseDate(dateStr, useJSParser = true) {
    if (!dateStr) return null;
    if (useJSParser) {
        const parsed = Date.parse(dateStr);
        if (!isNaN(parsed)) {
            return new Date(parsed);
        }
    }
    const formats = [
        { regex: /^(\d{1,2})\/?(\d{1,2})\/?(\d{4})$/, fn: (m) => new Date(m[3], m[2] - 1, m[1]) },
        { regex: /^(\d{1,2})-?(\d{1,2})-?(\d{4})$/, fn: (m) => new Date(m[3], m[2] - 1, m[1]) },
        {
            regex: /^(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$/i,
            fn: (m) => new Date(m[3], new Date(Date.parse(m[2] + " 1, 2000")).getMonth(), m[1])
        }
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
 * @param {object} customMappings - Custom category mappings
 * @returns {string} Guessed category
 */
export function guessCategory(description, customMappings = {}) {
    // You may want to import your category constants here if needed
    if (!description) return OTHER_CATEGORY_ID;
    const descriptionLower = description.toLowerCase();
    if (/salary|income|credit received|deposit|refund|cashback/i.test(descriptionLower)) {
        return INCOME_CATEGORY_ID;
    }
    for (const [category, patterns] of Object.entries(customMappings)) {
        if (patterns.some(pattern => descriptionLower.includes(pattern.toLowerCase()))) {
            return category;
        }
    }
    return OTHER_CATEGORY_ID;
}