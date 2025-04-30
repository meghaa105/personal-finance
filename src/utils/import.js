
import { parseCSV, parsePDF, parseSplitwise } from './parsers';

/**
 * Import transactions from various file formats
 * @param {File} file - The file to import
 * @param {string} type - File type ('csv', 'pdf', 'splitwise')
 * @param {Object} options - Additional import options
 * @returns {Promise<Array>} Array of parsed transactions
 */
export async function importTransactions(file, type, options = {}) {
    try {
        switch (type.toLowerCase()) {
            case 'csv':
                return await parseCSV(file);
            case 'pdf':
                return await parsePDF(file);
            case 'splitwise':
                return await parseSplitwise(file, options.filterUser);
            default:
                throw new Error(`Unsupported file type: ${type}`);
        }
    } catch (error) {
        console.error('Import error:', error);
        throw error;
    }
}