// Dynamic import for pdf-parse (CommonJS module)
import { categorizeTransaction } from './categorization';
import { parseUOBCreditCard, isUOBCreditCard } from './uob-credit-card-parser';

// Use dynamic import for pdf-parse
const getPdfParse = async () => {
  const pdfParse = await import('pdf-parse');
  return pdfParse.default;
};

export interface ParsedTransaction {
  date: string; // ISO date string (YYYY-MM-DD)
  description: string;
  amount: number;
  currency: string;
  balance?: number;
  category: string;
}

export interface ParsedStatement {
  transactions: ParsedTransaction[];
  bankName?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Parse PDF buffer and extract transactions
 */
export async function parsePDFStatement(
  buffer: Buffer
): Promise<ParsedStatement> {
  try {
    // Extract text from PDF
    const pdf = await getPdfParse();
    const data = await pdf(buffer);
    const text = data.text;

    // Check if this is a UOB credit card statement
    let transactions: ParsedTransaction[];
    if (isUOBCreditCard(text)) {
      transactions = parseUOBCreditCard(text);
    } else {
      // Use generic parser for bank account statements
      transactions = parseTransactionsFromText(text);
    }

    if (transactions.length === 0) {
      throw new Error('No transactions found in PDF');
    }

    // Extract date range
    const dates = transactions.map(t => new Date(t.date));
    const startDate = new Date(Math.min(...dates.map(d => d.getTime())))
      .toISOString()
      .split('T')[0];
    const endDate = new Date(Math.max(...dates.map(d => d.getTime())))
      .toISOString()
      .split('T')[0];

    return {
      transactions,
      startDate,
      endDate,
      bankName: extractBankName(text),
    };
  } catch (error) {
    throw new Error(
      `Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Extract bank name from statement text (best effort)
 */
function extractBankName(text: string): string | undefined {
  const bankKeywords = [
    'Chase',
    'Bank of America',
    'Wells Fargo',
    'Citibank',
    'Capital One',
    'HSBC',
    'Barclays',
    'American Express',
  ];

  const lowerText = text.toLowerCase();
  for (const bank of bankKeywords) {
    if (lowerText.includes(bank.toLowerCase())) {
      return bank;
    }
  }

  return undefined;
}

/**
 * Generic transaction parser
 * Looks for common patterns in bank statements
 *
 * Expected patterns:
 * - Date formats: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD
 * - Amount formats: -$123.45, $123.45, 123.45, (123.45)
 * - Line structure: Date Description Amount [Balance]
 */
function parseTransactionsFromText(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split('\n');

  // Regex patterns
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}\/\d{4})/g, // MM/DD/YYYY or DD/MM/YYYY
    /(\d{4}-\d{2}-\d{2})/g, // YYYY-MM-DD
    /(\d{2}-\d{2}-\d{4})/g, // DD-MM-YYYY
  ];

  // Amount pattern: matches currency amounts with optional negative sign or parentheses
  const amountPattern = /[-]?\$?\s*[\d,]+\.\d{2}|\(\s*\$?\s*[\d,]+\.\d{2}\s*\)/g;

  for (const line of lines) {
    // Try to find a date in the line
    let dateMatch: RegExpMatchArray | null = null;
    let matchedPattern: RegExp | null = null;

    for (const pattern of datePatterns) {
      dateMatch = line.match(pattern);
      if (dateMatch) {
        matchedPattern = pattern;
        break;
      }
    }

    if (!dateMatch || !matchedPattern) continue;

    // Extract date
    const dateStr = dateMatch[0];
    const parsedDate = parseDate(dateStr);
    if (!parsedDate) continue;

    // Find amounts in the line
    const amounts = line.match(amountPattern);
    if (!amounts || amounts.length === 0) continue;

    // Extract description (text between date and first amount)
    const dateIndex = line.indexOf(dateStr);
    const firstAmountIndex = line.indexOf(amounts[0]);

    if (firstAmountIndex <= dateIndex) continue;

    const description = line
      .substring(dateIndex + dateStr.length, firstAmountIndex)
      .trim();

    if (!description || description.length < 2) continue;

    // Parse amount (first number is usually the transaction amount)
    const amount = parseAmount(amounts[0]);

    // Parse balance (if second number exists, it's usually the balance)
    const balance = amounts.length > 1 ? parseAmount(amounts[1]) : undefined;

    // Categorize transaction
    const category = categorizeTransaction(description, amount);

    transactions.push({
      date: parsedDate,
      description,
      amount,
      currency: 'SGD', // Singapore Dollar
      balance,
      category,
    });
  }

  return transactions;
}

/**
 * Parse date string to ISO format (YYYY-MM-DD)
 */
function parseDate(dateStr: string, useSingaporeFormat: boolean = true): string | null {
  try {
    // Try DD/MM/YYYY or MM/DD/YYYY
    if (dateStr.includes('/')) {
      const parts = dateStr.split('/');
      if (parts.length !== 3) return null;

      const first = parseInt(parts[0]);
      const second = parseInt(parts[1]);
      const year = parseInt(parts[2]);

      // Singapore uses DD/MM/YYYY format
      if (useSingaporeFormat) {
        // DD/MM/YYYY format (Singapore standard)
        return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
      } else {
        // US format: MM/DD/YYYY
        if (first > 12) {
          // Must be DD/MM/YYYY
          return `${year}-${String(second).padStart(2, '0')}-${String(first).padStart(2, '0')}`;
        }
        return `${year}-${String(first).padStart(2, '0')}-${String(second).padStart(2, '0')}`;
      }
    }

    // Try YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      return dateStr;
    }

    // Try DD-MM-YYYY (Singapore format with dashes)
    if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
      const parts = dateStr.split('-');
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parse amount string to number
 * Handles: -$123.45, $123.45, 123.45, (123.45), 1,234.56
 */
function parseAmount(amountStr: string): number {
  // Remove currency symbols and whitespace
  let cleaned = amountStr.replace(/[$\s]/g, '');

  // Handle parentheses (indicates negative)
  const isNegative = cleaned.includes('(') || cleaned.startsWith('-');

  // Remove parentheses and negative signs
  cleaned = cleaned.replace(/[(),-]/g, '');

  // Remove commas for thousands separator
  cleaned = cleaned.replace(/,/g, '');

  const num = parseFloat(cleaned);
  return isNegative ? -Math.abs(num) : num;
}

/**
 * Bank-specific parsers
 * You can add custom parsers for specific bank statement formats here
 */

export interface BankParser {
  name: string;
  detect: (text: string) => boolean;
  parse: (text: string) => ParsedTransaction[];
}

// Singapore Banks Parsers

// DBS/POSB Parser
const dbsParser: BankParser = {
  name: 'DBS',
  detect: (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes('dbs') || lower.includes('posb');
  },
  parse: (text: string) => {
    return parseTransactionsFromText(text);
  },
};

// OCBC Parser
const ocbcParser: BankParser = {
  name: 'OCBC',
  detect: (text: string) => text.toLowerCase().includes('ocbc'),
  parse: (text: string) => {
    return parseTransactionsFromText(text);
  },
};

// UOB Parser
const uobParser: BankParser = {
  name: 'UOB',
  detect: (text: string) => {
    const lower = text.toLowerCase();
    return lower.includes('uob') || lower.includes('united overseas bank');
  },
  parse: (text: string) => {
    return parseTransactionsFromText(text);
  },
};

// Standard Chartered Parser
const standardCharteredParser: BankParser = {
  name: 'Standard Chartered',
  detect: (text: string) => text.toLowerCase().includes('standard chartered'),
  parse: (text: string) => {
    return parseTransactionsFromText(text);
  },
};

// Citibank Singapore Parser
const citiParser: BankParser = {
  name: 'Citibank',
  detect: (text: string) => text.toLowerCase().includes('citibank'),
  parse: (text: string) => {
    return parseTransactionsFromText(text);
  },
};

// Registry of bank-specific parsers (Singapore banks first)
const BANK_PARSERS: BankParser[] = [
  dbsParser,
  ocbcParser,
  uobParser,
  standardCharteredParser,
  citiParser,
];

/**
 * Try to use a bank-specific parser if available
 */
export function parseWithBankParser(text: string): ParsedTransaction[] | null {
  for (const parser of BANK_PARSERS) {
    if (parser.detect(text)) {
      return parser.parse(text);
    }
  }
  return null;
}
