// UOB Credit Card Statement Parser
// Handles UOB credit card statement format which is different from bank account statements

import { ParsedTransaction } from './pdf-parser';
import { categorizeTransaction } from './categorization';

/**
 * Parse UOB credit card statement format
 *
 * Expected format:
 * Trans Date  Post Date  Description                          Amount
 * 01 AUG      02 AUG     GRAB*TRIP                            15.50
 * 05 AUG      06 AUG     NTUC FAIRPRICE                       45.60
 */
export function parseUOBCreditCard(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');

  // Get year from statement date
  let statementYear = new Date().getFullYear();
  for (const line of lines) {
    if (line.includes('Statement Date')) {
      const yearMatch = line.match(/20\d{2}/);
      if (yearMatch) {
        statementYear = parseInt(yearMatch[0]);
        break;
      }
    }
  }

  console.log('Statement year:', statementYear);

  // Look for transaction lines - amount may be on next line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines and headers
    if (!line || line.length < 10) continue;
    if (line.includes('Post') || line.includes('Trans') || line.includes('Description')) continue;
    if (line.includes('PREVIOUS BALANCE') || line.includes('SUB TOTAL') || line.includes('TOTAL BALANCE')) continue;
    if (line.includes('Page ') && line.includes(' of ')) continue;
    if (line.includes('continued')) continue;

    // UOB format: DD MMM DD MMM Description
    // Amount might be on same line or next line
    // Example: "28 JUL 23 JUL BUS/MRT 676443472 SINGAPORE"
    // Next line: "Ref No. : 74541835207288086824184"
    // Next line: "4.08"

    const startPattern = /^(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(\d{1,2})\s+(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\s+(.+)/i;
    const match = line.match(startPattern);

    if (match) {
      const transDay = match[3].padStart(2, '0'); // Transaction date (second date)
      const transMonth = match[4].toUpperCase();
      let restOfLine = match[5]; // Description + possibly amount

      // Check if amount is on the same line
      const samLineAmountPattern = /([\d,]+\.\d{2})(CR)?$/;
      let amountMatch = restOfLine.match(samLineAmountPattern);

      let amount: number;
      let description: string;

      if (amountMatch) {
        // Amount is on same line
        const amountStr = amountMatch[1].replace(/,/g, '');
        amount = parseFloat(amountStr);
        const isCredit = amountMatch[2] === 'CR';

        if (isCredit) {
          amount = Math.abs(amount);
        } else {
          amount = -Math.abs(amount);
        }

        description = restOfLine
          .replace(samLineAmountPattern, '')
          .replace(/MYR\s*[\d,.]+$/, '')
          .trim();
      } else {
        // Amount might be on next lines - look ahead
        description = restOfLine.trim();
        amount = 0;

        // Look at next few lines for amount
        for (let j = i + 1; j < Math.min(i + 4, lines.length); j++) {
          const nextLine = lines[j].trim();

          // Skip Ref No lines
          if (nextLine.includes('Ref No.')) continue;

          // Check if this line is just an amount
          const amountOnlyPattern = /^([\d,]+\.\d{2})(CR)?$/;
          const nextAmountMatch = nextLine.match(amountOnlyPattern);

          if (nextAmountMatch) {
            const amountStr = nextAmountMatch[1].replace(/,/g, '');
            amount = parseFloat(amountStr);
            const isCredit = nextAmountMatch[2] === 'CR';

            if (isCredit) {
              amount = Math.abs(amount);
            } else {
              amount = -Math.abs(amount);
            }
            break;
          }

          // Also check for MYR amounts (line before SGD amount)
          if (nextLine.includes('MYR')) {
            continue; // Skip MYR line, look at next
          }
        }

        if (amount === 0) continue; // No amount found, skip this transaction
      }

      if (!description || description.length < 2) continue;

      // Convert month to number
      const monthMap: Record<string, string> = {
        'JAN': '01', 'FEB': '02', 'MAR': '03', 'APR': '04',
        'MAY': '05', 'JUN': '06', 'JUL': '07', 'AUG': '08',
        'SEP': '09', 'OCT': '10', 'NOV': '11', 'DEC': '12'
      };
      const monthNum = monthMap[transMonth] || '01';

      const date = `${statementYear}-${monthNum}-${transDay}`;
      const category = categorizeTransaction(description, amount);

      transactions.push({
        date,
        description,
        amount,
        currency: 'SGD',
        balance: undefined,
        category,
      });

      console.log('Parsed transaction:', { date, description, amount });
    }
  }

  console.log(`Total transactions parsed: ${transactions.length}`);
  return transactions;
}

/**
 * Detect if this is a UOB credit card statement
 */
export function isUOBCreditCard(text: string): boolean {
  const lower = text.toLowerCase();
  return (
    (lower.includes('uob') || lower.includes('united overseas bank')) &&
    (lower.includes('credit card') || lower.includes('credit limit') || lower.includes('card.centre@uobgroup.com'))
  );
}
