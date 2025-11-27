import Anthropic from '@anthropic-ai/sdk';
import type { ParsedStatement, ClaudePageResponse, ParsedTransaction } from './types/parsed-statement';

const PARSING_SYSTEM_PROMPT = `You are a bank statement parser with intelligent categorization capabilities.
You receive raw text that has been extracted from a bank PDF statement.
Your job is to turn messy text from any bank into clean JSON transaction data that follows a strict schema.

Output must always be valid JSON and nothing else.

Rules:
- Ignore headers, titles, page numbers, disclaimers, summaries and marketing text
- Only return real transaction rows
- Preserve full merchant descriptions even if they span several lines
- Normalize amounts and dates
- Use negative amounts for debits and positive amounts for credits
- If you are unsure about a field, omit that field rather than guessing
- If there are no transactions on the page, return { "meta": {"bank_name": null, "country": null, "account_type": "unknown", "currency": null }, "transactions": [] }

JSON schema:
{
  "meta": {
    "bank_name": "string or null",
    "country": "string or null",
    "account_type": "current | savings | credit_card | unknown",
    "currency": "string or null"
  },
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "posting_date": "YYYY-MM-DD or null",
      "description": "string",
      "amount": 0.0,
      "currency": "string or null",
      "type": "debit | credit | payment | fee | interest | refund | unknown",
      "balance": 0.0,
      "raw_lines": ["original line 1", "original line 2"],
      "category": "string",
      "category_confidence": 0.0
    }
  ]
}

Field rules:
- Never assume a specific bank. Infer bank_name, country and currency from the text when possible, otherwise set them to null.
- date: main transaction date. Normalize formats like 12 Jan 2024, 12/01/24, 2024-01-12 to YYYY-MM-DD.
- posting_date: posting or value date if present, else null.
- description: full human readable description, including wrapped lines.
- amount:
  - Debit negative, credit positive
  - Handle formats such as 1,234.56, (123.45), 123.45 DR, CR 123.45
- balance: running balance on that row if present, else omit or null.
- type:
  - fee for charges clearly labeled as fees
  - interest for interest
  - payment for credit card payments
  - refund for reversals
  - otherwise debit or credit based on sign
- raw_lines: include the original extracted lines that belong to this transaction.

INTELLIGENT CATEGORIZATION RULES:
- category: Assign ONE category from this list: "Food & Dining", "Transport", "Shopping", "Bills & Utilities", "Salary & Income", "Healthcare", "Entertainment", "Travel", "Education", "Transfers", "Miscellaneous"
- category_confidence: A number between 0.0 and 1.0 indicating your confidence in the category assignment
- Use your world knowledge and reasoning to understand what each merchant actually is before categorizing
- DO NOT rely on simple keyword matching - think about the merchant's actual business type
- Examples of proper reasoning:
  * "WatchBook" is a watch retailer (Shopping), NOT a bookstore (Education)
  * "Grab" in Singapore is primarily a ride-hailing service (Transport), not food delivery, unless the description clearly indicates "GrabFood"
  * "Apple" could be Apple Store (Shopping) or Apple Music/iCloud (Bills & Utilities) - use context
  * "Shell" is a petrol station (Transport), not shopping
  * "Netflix" is entertainment subscription (Bills & Utilities), not Entertainment purchases
- Consider location context: Singapore merchants like "NTUC", "Sheng Siong" are supermarkets (Food & Dining)
- Consider brand recognition: Use your knowledge of global and regional brands
- Assign high confidence (0.8-1.0) when you clearly recognize the merchant
- Assign medium confidence (0.5-0.7) when you can infer from context
- Assign low confidence (0.2-0.4) when the description is ambiguous
- Always provide both category and category_confidence for every transaction

Layout handling:
- Support tables like Date | Description | Debit | Credit | Balance.
- Support multi line blocks such as:
  12 JAN STORE NAME
  CITY COUNTRY
  -23.50
- Combine related lines into one transaction.
- Skip summary lines like "Previous balance", "New balance", "Total fees this period".

Output rules:
- Return only JSON text, no markdown and no code fences.
- All items in transactions must have at least date, description, amount, category, and category_confidence.
- If a row does not contain a valid date and amount, skip it.`;

/**
 * Parse bank statement pages using Claude AI
 * @param pages - Array of strings, one per PDF page
 * @returns Unified ParsedStatement with all transactions
 */
export async function parseBankStatementWithClaude(pages: string[]): Promise<ParsedStatement> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const anthropic = new Anthropic({
    apiKey,
  });

  const allTransactions: ParsedTransaction[] = [];
  let mergedMeta: ParsedStatement['meta'] = {
    bank_name: null,
    country: null,
    account_type: 'unknown',
    currency: null,
  };

  console.log(`[ClaudeParser] Processing ${pages.length} pages`);

  for (let i = 0; i < pages.length; i++) {
    const pageText = pages[i];
    console.log(`[ClaudeParser] Processing page ${i + 1}/${pages.length}`);

    try {
      const message = await anthropic.messages.create({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 4096,
        system: PARSING_SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: `Parse this bank statement page:\n\n${pageText}`,
          },
        ],
      });

      // Extract text content from response
      const responseText = message.content
        .filter((block) => block.type === 'text')
        .map((block) => ('text' in block ? block.text : ''))
        .join('');

      console.log(`[ClaudeParser] Page ${i + 1} response:`, responseText.substring(0, 200));

      // Parse JSON response
      const pageData: ClaudePageResponse = JSON.parse(responseText);

      // Merge metadata (use first non-null values)
      if (pageData.meta.bank_name && !mergedMeta.bank_name) {
        mergedMeta.bank_name = pageData.meta.bank_name;
      }
      if (pageData.meta.country && !mergedMeta.country) {
        mergedMeta.country = pageData.meta.country;
      }
      if (pageData.meta.currency && !mergedMeta.currency) {
        mergedMeta.currency = pageData.meta.currency;
      }
      if (pageData.meta.account_type !== 'unknown' && mergedMeta.account_type === 'unknown') {
        mergedMeta.account_type = pageData.meta.account_type;
      }

      // Add transactions from this page
      allTransactions.push(...pageData.transactions);

      console.log(`[ClaudeParser] Page ${i + 1}: Found ${pageData.transactions.length} transactions`);
    } catch (error) {
      console.error(`[ClaudeParser] Error processing page ${i + 1}:`, error);
      // Continue processing other pages even if one fails
    }
  }

  // Validate and filter transactions
  const validTransactions = allTransactions.filter((txn) => {
    return txn.date && txn.description && typeof txn.amount === 'number';
  });

  console.log(
    `[ClaudeParser] Total transactions: ${validTransactions.length} (filtered from ${allTransactions.length})`
  );

  return {
    meta: mergedMeta,
    transactions: validTransactions,
  };
}
