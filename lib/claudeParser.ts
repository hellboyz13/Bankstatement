import OpenAI from 'openai';
import type { ParsedStatement, ClaudePageResponse, ParsedTransaction } from './types/parsed-statement';

const PARSING_SYSTEM_PROMPT = `Parse bank statement text into JSON. Extract ALL transactions with dates and amounts. Be lenient.

Output schema:
{
  "meta": {
    "bank_name": "string|null",
    "country": "string|null",
    "account_type": "current|savings|credit_card|unknown",
    "currency": "string|null"
  },
  "transactions": [{
    "date": "YYYY-MM-DD",
    "posting_date": "YYYY-MM-DD|null",
    "description": "string",
    "amount": 0.0,
    "currency": "string|null",
    "type": "debit|credit|payment|fee|interest|refund|unknown",
    "balance": 0.0,
    "category": "string",
    "category_confidence": 0.0
  }]
}

Rules:
- Normalize dates to YYYY-MM-DD
- Debits negative, credits positive
- Categories: "Food & Dining", "Transport", "Shopping", "Bills & Utilities", "Salary & Income", "Healthcare", "Entertainment", "Travel", "Education", "Transfers", "Miscellaneous"
- Use merchant knowledge for smart categorization (e.g., Grab=Transport, NTUC=Food & Dining, Netflix=Bills & Utilities)
- Return only valid JSON, no markdown`;

/**
 * Parse bank statement pages using GPT-4o-mini
 * @param pages - Array of strings, one per PDF page
 * @returns Unified ParsedStatement with all transactions
 */
export async function parseBankStatementWithClaude(pages: string[]): Promise<ParsedStatement> {
  const startTime = Date.now();

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  const openai = new OpenAI({
    apiKey,
  });

  // Process pages in parallel chunks to avoid timeout
  const CHUNK_SIZE = 2; // Process 2 pages at a time
  const chunks: string[][] = [];

  for (let i = 0; i < pages.length; i += CHUNK_SIZE) {
    chunks.push(pages.slice(i, i + CHUNK_SIZE));
  }

  console.log(`[AI TIMING] Processing ${pages.length} pages in ${chunks.length} parallel chunks`);

  try {
    const startApiCall = Date.now();

    // Process all chunks in parallel
    const chunkPromises = chunks.map(async (chunk, index) => {
      const chunkText = chunk.join('\n\n--- PAGE BREAK ---\n\n');
      console.log(`[AI TIMING] Chunk ${index + 1}/${chunks.length}: ${chunkText.length} chars`);

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: PARSING_SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: chunkText,
          },
        ],
        temperature: 0,
        max_completion_tokens: 8000,
        response_format: { type: "json_object" },
      }, {
        timeout: 30000, // 30 second timeout per chunk
      });

      const responseText = completion.choices[0]?.message?.content || '';
      return JSON.parse(responseText) as ClaudePageResponse;
    });

    // Wait for all chunks to complete
    const chunkResults = await Promise.all(chunkPromises);
    const apiCallTime = Date.now() - startApiCall;

    console.log(`[AI TIMING] All ${chunks.length} chunks completed in ${apiCallTime}ms`);

    // Merge all chunk results
    const startMerge = Date.now();
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
      // Update meta with first non-null values found
      if (result.meta?.bank_name && !meta.bank_name) meta.bank_name = result.meta.bank_name;
      if (result.meta?.country && !meta.country) meta.country = result.meta.country;
      if (result.meta?.currency && !meta.currency) meta.currency = result.meta.currency;
      if (result.meta?.account_type && result.meta.account_type !== 'unknown') {
        meta.account_type = result.meta.account_type;
      }
    }

    // Validate and filter transactions
    const validTransactions = allTransactions.filter((txn) =>
      txn.date && txn.description && typeof txn.amount === 'number'
    );
    const mergeTime = Date.now() - startMerge;

    const totalTime = Date.now() - startTime;

    console.log(`[AI TIMING] Merged ${validTransactions.length} transactions in ${mergeTime}ms`);
    console.log(`[AI TIMING] Total AI processing: ${totalTime}ms`);

    return {
      meta,
      transactions: validTransactions,
    };
  } catch (error) {
    throw new Error(`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
