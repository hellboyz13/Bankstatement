// Enhanced categorization using online merchant lookup
import { categorizeTransaction, TransactionCategory } from './categorization';

/**
 * Extract clean merchant name from transaction description
 */
export function extractMerchantName(description: string): string {
  let clean = description;

  // Remove reference numbers
  clean = clean.replace(/Ref No\.\s*:\s*\d+/gi, '');
  clean = clean.replace(/\d{10,}/g, ''); // Remove long numbers (IDs)

  // Remove country/location info at the end
  clean = clean.replace(/\s+(SINGAPORE|SG|SGP)$/i, '');

  // Remove extra whitespace
  clean = clean.trim().replace(/\s+/g, ' ');

  // Take first part before special characters (usually merchant name)
  const parts = clean.split(/[\*\/]/);
  clean = parts[0].trim();

  return clean;
}

/**
 * Categorize transaction with enhanced online lookup
 * Falls back to keyword-based if online lookup fails
 */
export async function enhanceCategorization(
  description: string,
  amount: number,
  currentCategory: TransactionCategory
): Promise<TransactionCategory> {
  // If already categorized as something other than Miscellaneous, keep it
  if (currentCategory !== 'Miscellaneous') {
    return currentCategory;
  }

  // Extract merchant name
  const merchantName = extractMerchantName(description);

  if (!merchantName || merchantName.length < 3) {
    return currentCategory;
  }

  // Call the categorize-merchant API
  try {
    const response = await fetch('http://localhost:3000/api/categorize-merchant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchantName }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`Enhanced category for "${merchantName}": ${data.category} (${data.source})`);
      return data.category;
    }
  } catch (error) {
    console.error('Enhanced categorization failed:', error);
  }

  return currentCategory;
}

/**
 * Batch enhance multiple transactions
 * Processes transactions in parallel with rate limiting
 */
export async function batchEnhanceCategorization(
  transactions: Array<{ description: string; amount: number; category: TransactionCategory }>
): Promise<TransactionCategory[]> {
  const BATCH_SIZE = 5;
  const results: TransactionCategory[] = [];

  // Process in batches to avoid overwhelming the API
  for (let i = 0; i < transactions.length; i += BATCH_SIZE) {
    const batch = transactions.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(t =>
        enhanceCategorization(t.description, t.amount, t.category)
      )
    );
    results.push(...batchResults);
  }

  return results;
}
