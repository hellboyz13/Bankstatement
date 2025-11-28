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

  // Combine all pages into one text block for single API call
  const startCombine = Date.now();
  const combinedText = pages.join('\n\n--- PAGE BREAK ---\n\n');
  const combineTime = Date.now() - startCombine;

  console.log(`[AI TIMING] Combined ${pages.length} pages (${combinedText.length} chars) in ${combineTime}ms`);

  try {
    const startApiCall = Date.now();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: PARSING_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: combinedText,
        },
      ],
      temperature: 0,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    });
    const apiCallTime = Date.now() - startApiCall;

    console.log(`[AI TIMING] OpenAI API call completed in ${apiCallTime}ms`);

    const startParse = Date.now();
    const responseText = completion.choices[0]?.message?.content || '';

    // Parse JSON response
    const parsedData: ClaudePageResponse = JSON.parse(responseText);

    // Validate and filter transactions
    const validTransactions = parsedData.transactions.filter((txn) =>
      txn.date && txn.description && typeof txn.amount === 'number'
    );
    const parseTime = Date.now() - startParse;

    const totalTime = Date.now() - startTime;

    console.log(`[AI TIMING] JSON parsing & validation: ${parseTime}ms`);
    console.log(`[AI TIMING] Total AI processing: ${totalTime}ms (found ${validTransactions.length} transactions)`);

    return {
      meta: parsedData.meta,
      transactions: validTransactions,
    };
  } catch (error) {
    throw new Error(`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
