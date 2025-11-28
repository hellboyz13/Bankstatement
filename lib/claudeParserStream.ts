import OpenAI from 'openai';
import type { ParsedStatement, ClaudePageResponse, ParsedTransaction } from './types/parsed-statement';

const PARSING_SYSTEM_PROMPT = `Extract all transactions from this bank statement. For each transaction, provide:
- Date (YYYY-MM-DD format)
- Description
- Amount (negative for debits/payments, positive for credits/deposits)
- Balance (if shown)
- Category (groceries, transport, dining, utilities, shopping, entertainment, transfer, salary, or other)

Also identify: bank name, currency, account type (credit/debit/savings).

Format each transaction as one line: DATE | DESCRIPTION | AMOUNT | BALANCE | CATEGORY

Example:
2024-01-15 | WALMART PURCHASE | -45.50 | 1234.56 | groceries
2024-01-16 | SALARY DEPOSIT | 3000.00 | 4234.56 | salary`;

interface ProgressUpdate {
  progress: number;
  message: string;
  currentChunk?: number;
  totalChunks?: number;
  estimatedTimeRemaining?: number;
}

function parseTextToJSON(text: string): ClaudePageResponse {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  let bank_name = null;
  let currency = null;
  let account_type: 'credit' | 'debit' | 'savings' | 'unknown' = 'unknown';

  const bankMatch = text.match(/bank[:\s]+([^\n,]+)/i);
  if (bankMatch) bank_name = bankMatch[1].trim();

  const currencyMatch = text.match(/currency[:\s]+([A-Z]{3})/i);
  if (currencyMatch) currency = currencyMatch[1];

  const accountMatch = text.match(/account\s+type[:\s]+(credit|debit|savings)/i);
  if (accountMatch) account_type = accountMatch[1].toLowerCase() as any;

  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    if (!line.includes('|')) continue;

    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 3) continue;

    const [date, description, amountStr, balanceStr, category] = parts;

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount)) continue;

    const balance = balanceStr ? parseFloat(balanceStr.replace(/[^0-9.-]/g, '')) : null;

    transactions.push({
      date,
      description: description || 'Unknown',
      amount,
      currency: currency || 'USD',
      balance: !isNaN(balance!) ? balance : null,
      category: category || 'other',
    });
  }

  return {
    meta: {
      bank_name,
      country: null,
      account_type,
      currency,
    },
    transactions,
  };
}

export async function parseBankStatementWithProgress(
  pages: string[],
  onProgress: (update: ProgressUpdate) => void
): Promise<ParsedStatement> {
  const startTime = Date.now();

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const openai = new OpenAI({
    apiKey,
    timeout: 90000,
    maxRetries: 0,
    dangerouslyAllowBrowser: false,
  });

  const CHUNK_SIZE = 2;
  const chunks: string[][] = [];

  for (let i = 0; i < pages.length; i += CHUNK_SIZE) {
    chunks.push(pages.slice(i, i + CHUNK_SIZE));
  }

  const estimatedTimePerChunk = 23000; // 23 seconds per chunk based on real data
  const totalEstimatedTime = chunks.length * estimatedTimePerChunk;

  onProgress({
    progress: 10,
    message: `Processing ${chunks.length} chunk(s)...`,
    totalChunks: chunks.length,
    currentChunk: 0,
    estimatedTimeRemaining: totalEstimatedTime,
  });

  try {
    const chunkResults: ClaudePageResponse[] = [];
    let completedChunks = 0;

    // Process chunks sequentially to show accurate progress
    for (let index = 0; index < chunks.length; index++) {
      const chunk = chunks[index];
      const chunkText = chunk.join('\n\n--- PAGE BREAK ---\n\n');
      const chunkStartTime = Date.now();

      onProgress({
        progress: 10 + (index / chunks.length) * 80,
        message: `Analyzing chunk ${index + 1} of ${chunks.length}...`,
        currentChunk: index + 1,
        totalChunks: chunks.length,
        estimatedTimeRemaining: (chunks.length - index) * estimatedTimePerChunk,
      });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'user',
          content: `${PARSING_SYSTEM_PROMPT}\n\nBank statement text:\n${chunkText}`,
        }],
        temperature: 0,
      }, {
        timeout: 60000,
      });

      const responseText = completion.choices[0]?.message?.content || '';
      const parsed = parseTextToJSON(responseText);
      chunkResults.push(parsed);

      completedChunks++;
      const avgTimePerChunk = (Date.now() - startTime) / completedChunks;
      const remainingTime = (chunks.length - completedChunks) * avgTimePerChunk;

      onProgress({
        progress: 10 + (completedChunks / chunks.length) * 80,
        message: `Chunk ${completedChunks}/${chunks.length} complete (${parsed.transactions?.length || 0} transactions)`,
        currentChunk: completedChunks,
        totalChunks: chunks.length,
        estimatedTimeRemaining: Math.round(remainingTime),
      });
    }

    // Merge results
    onProgress({
      progress: 95,
      message: 'Merging results...',
      currentChunk: chunks.length,
      totalChunks: chunks.length,
    });

    const allTransactions: ParsedTransaction[] = [];
    let meta = chunkResults[0]?.meta || {
      bank_name: null,
      country: null,
      account_type: 'unknown' as const,
      currency: null,
    };

    for (const result of chunkResults) {
      if (result.transactions) {
        allTransactions.push(...result.transactions);
      }
      if (result.meta?.bank_name && !meta.bank_name) meta.bank_name = result.meta.bank_name;
      if (result.meta?.country && !meta.country) meta.country = result.meta.country;
      if (result.meta?.currency && !meta.currency) meta.currency = result.meta.currency;
      if (result.meta?.account_type && result.meta.account_type !== 'unknown') {
        meta.account_type = result.meta.account_type;
      }
    }

    const validTransactions = allTransactions.filter((txn) =>
      txn.date && txn.description && typeof txn.amount === 'number'
    );

    return {
      meta,
      transactions: validTransactions,
    };
  } catch (error) {
    throw new Error(`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
