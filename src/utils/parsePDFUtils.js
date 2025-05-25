// Utility functions for parsing PDF statements for different credit card types
import { parseDate, guessCategory } from "./parseUtils";
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
                        date: parseDate(date, false),
                        source: 'pdf',
                        cardType: 'Swiggy HDFC'
                    };
                } catch {
                    i++;
                    continue;
                }
                if (!currentTransaction.date) {
                    i++;
                    continue;
                }
            }

            i++;
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
            i++;
            let amount = lines[i];
            if (["BANGALORE", "BENGALURU", "GURUGRAM", "GURGAON", "HYDERABAD", "MUMBAI", "PUNE", "CHENNAI", "DELHI", "DELHI (NCR)"].includes(amount)) {
                i++;
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

        i++;
    }
    return transactions;
}

// Example parser for ICICI credit card
function parseAmazonICICICreditCard(text, customMappings = []) {
    const lines = text.split('\n').map(line => line.trim()).filter(Boolean);
    const amountRegex = /^([\d,]+\.\d{2})(\s*CR)?$/;

    const transactions = [];
    let i = 0;

    while (i < lines.length) {
        const dateLine = lines[i];
        const date = parseDate(dateLine, false);
        if (date) {
            let j = i + 1;
            let description = '';
            let amount = null;
            let type = 'expense';

            // Collect description until we find a line that looks like an amount
            while (j < lines.length) {
                const line = lines[j];
                const amtMatch = line.match(amountRegex);

                if (amtMatch) {
                    amount = parseFloat(amtMatch[1].replace(/,/g, ''));
                    type = amtMatch[2] ? 'income' : 'expense';
                    break;
                } else {
                    if (description.length > 0) description += '==';
                    description += line;
                }
                j++;
            }

            if (amount !== null) {
                const descriptionArr = description.split('==');
                description = `(${descriptionArr[0]}) ${descriptionArr[1]}`;
                transactions.push({
                    source: 'pdf',
                    cardType: 'Amazon ICICI',
                    date,
                    description: description.trim(),
                    amount,
                    type,
                    category: type === 'income' ? 'Income' : guessCategory(description.trim(), customMappings)
                });
                i = j + 1; // Move to next transaction start
            } else {
                i++; // Skip if amount not found
            }
        } else {
            i++;
        }
    }

    return transactions;
}

// Generic parser for unknown credit card types
function parseSbiCashbackCreditCard(text, customMappings = []) {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    const transactions = [];
    let i = 0;
  
    // Find start of transaction section
    while (i < lines.length && !lines[i].startsWith("TRANSACTIONS FOR")) i++;
    if (i === lines.length) return transactions; // no transaction section found
    i++; // move past the header
  
    while (i < lines.length) {
      // Check if a line matches a date in DD MMM YY format
      const dateLine = lines[i];
      const date = parseDate(dateLine);
      if (date) {
        let description = "";
  
        // Gather description (1–3 lines until we hit amount)
        let descLines = [];
        i++;
        while (i < lines.length && !lines[i].match(/^\d{1,3}(,\d{3})*(\.\d{2})?$/)) {
          descLines.push(lines[i]);
          i++;
        }
  
        description = descLines.join(' ');
  
        // Amount
        if (i < lines.length) {
          const amountStr = lines[i].replace(/,/g, '');
          const amount = parseFloat(amountStr);
          i++;
          if (i < lines.length && (lines[i] === 'C' || lines[i] === 'D')) {
            const type = lines[i] === 'C' ? 'income' : 'expense';
            transactions.push({
                date,
                description,
                amount,
                type,
                source: 'pdf',
                cardType: "SBI Cashback",
                category: type === 'income'? "Income" : guessCategory(description.trim(), customMappings) // Guess category based on description or custom mappings if availabl
            });
            i++;
          }
        }
      } else {
        i++;
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