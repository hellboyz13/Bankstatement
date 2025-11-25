import { Transaction } from './database.types';

/**
 * Check if two transactions are duplicates
 * Criteria: same date, amount, and description (case-insensitive)
 */
export function areDuplicates(t1: Transaction, t2: Transaction): boolean {
  return (
    t1.date === t2.date &&
    Math.abs(t1.amount - t2.amount) < 0.01 && // Float comparison with tolerance
    t1.description.toLowerCase().trim() === t2.description.toLowerCase().trim()
  );
}

/**
 * Find duplicate transactions in an array
 * Returns a Set of transaction IDs that are duplicates
 */
export function findDuplicates(transactions: Transaction[]): Set<string> {
  const duplicateIds = new Set<string>();
  const seen = new Map<string, string>(); // key -> first occurrence ID

  for (const transaction of transactions) {
    // Create a composite key for duplicate detection
    const key = createDuplicateKey(transaction);

    if (seen.has(key)) {
      // This is a duplicate
      duplicateIds.add(transaction.id);
    } else {
      // First occurrence
      seen.set(key, transaction.id);
    }
  }

  return duplicateIds;
}

/**
 * Create a unique key for duplicate detection
 */
function createDuplicateKey(transaction: Transaction): string {
  return `${transaction.date}|${transaction.amount.toFixed(2)}|${transaction.description.toLowerCase().trim()}`;
}

/**
 * Remove duplicates from an array of transactions
 * Keeps the first occurrence
 */
export function removeDuplicates(transactions: Transaction[]): Transaction[] {
  const seen = new Set<string>();
  const unique: Transaction[] = [];

  for (const transaction of transactions) {
    const key = createDuplicateKey(transaction);

    if (!seen.has(key)) {
      seen.add(key);
      unique.push(transaction);
    }
  }

  return unique;
}

/**
 * Merge transactions from multiple statements, removing duplicates
 */
export function mergeStatements(
  ...statementTransactions: Transaction[][]
): Transaction[] {
  const allTransactions = statementTransactions.flat();
  return removeDuplicates(allTransactions);
}
