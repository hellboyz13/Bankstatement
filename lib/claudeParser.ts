import OpenAI from 'openai';
import type { ParsedStatement, ClaudePageResponse, ParsedTransaction } from './types/parsed-statement';

const PARSING_SYSTEM_PROMPT = `Extract all transactions from this bank statement. For each transaction, provide:
- Date (YYYY-MM-DD format)
- Description
- Amount (negative for debits/payments, positive for credits/deposits)
- Balance (if shown)
- Category: Use ONE of these globally-applicable categories (NO country-specific brands):
  * Food & Beverage (restaurants, cafes, bars, bakeries)
  * Groceries (supermarkets, grocery stores)
  * Transport (taxi, public transport, fuel, parking, tolls)
  * Shopping – General Retail (department stores, convenience stores)
  * Shopping – Fashion & Apparel (clothing, shoes, bags, jewelry - non-luxury)
  * Shopping – Electronics & Technology (electronics, computers, phones)
  * Shopping – Luxury & High-End (designer brands, luxury boutiques)
  * Health & Medical (hospitals, clinics, pharmacies)
  * Beauty & Personal Care (salons, spas, cosmetics)
  * Entertainment & Leisure (cinemas, concerts, games, streaming)
  * Travel (flights, hotels, tours, travel agencies)
  * Bills & Utilities (electricity, water, internet, phone bills)
  * Subscriptions & Digital Services (streaming, cloud, software, apps)
  * Insurance (life, health, travel, car, home insurance)
  * Education (schools, courses, tuition)
  * Home & Living (furniture, home decor, appliances)
  * Sports & Fitness (gyms, sports equipment)
  * Pets (pet supplies, vet services)
  * Family & Kids (baby products, toys, childcare)
  * Financial – Fees & Charges (bank fees, card fees, ATM fees)
  * Investments (brokerage, stocks, crypto)
  * Donations & Charity (non-profits, charitable contributions)
  * Government & Taxes (taxes, fines, licenses, permits)
  * Credit Card Payment (payments to reduce card balance)
  * Refund / Reversal (merchant refunds, cancellations)
  * Bank Credits (cashback, rewards, promotional credits)
  * True Income (salary, wages, business income)
  * Unknown Incoming (unidentified positive transactions)
  * Miscellaneous / Others (when nothing else fits)
- Fraud Score (0.0 to 1.0): Assess fraud likelihood based on these patterns:
  * MICRO-TRANSACTION TESTING: Extremely small amounts (0.01, 0.10, 1.00 or slight variations) - FLAG as 0.7-0.9
  * RAPID-FIRE TESTING: Multiple micro transactions within minutes/seconds - FLAG as 0.8-0.95
  * CARD VALIDATION ATTEMPTS: Repeated small charges from same merchant with amount variations - FLAG as 0.75-0.9
  * DECLINE PATTERNS: Clusters of declined attempts followed by one successful low-value charge - FLAG as 0.85-0.95
  * UNUSUAL LOCATIONS: Small transactions from foreign merchants/currencies not matching history - FLAG as 0.6-0.8
  * MERCHANT CATEGORY MISMATCH: MCCs not aligning with typical usage patterns - FLAG as 0.5-0.7
  * SUSPICIOUS MERCHANT NAMES: Generic, random, or unknown merchant names - FLAG as 0.6-0.8
  * DIGITAL GOODS TESTING: Low-value digital goods transactions for card validation - FLAG as 0.7-0.85
  * MULTI-MERCHANT TESTING: Multiple micro attempts across different merchants quickly - FLAG as 0.8-0.95
  * LATE-NIGHT ACTIVITY: Any of the above occurring at unusual hours (2am-5am) - ADD 0.1-0.15 to score
  * Unusual large transaction amount for merchant/category - FLAG as 0.5-0.7
  * High-frequency normal transactions in short period - FLAG as 0.3-0.5
  * Do NOT flag refunds, card payments, or pending transactions
  * Only consider completed charges
- Fraud Reason: Brief explanation (e.g., "Micro-transaction testing pattern", "Rapid card validation attempts", "Late-night foreign merchant testing", "Normal spending pattern")

Also identify: bank name, currency, account type (credit_card/current/savings).

Format each transaction as one line: DATE | DESCRIPTION | AMOUNT | BALANCE | CATEGORY | FRAUD_SCORE | FRAUD_REASON

Examples:
2024-01-15 | Local Restaurant ABC | -45.50 | 1234.56 | Food & Beverage | 0.05 | Normal dining expense
2024-01-16 | Salary Deposit | 3000.00 | 4234.56 | True Income | 0.0 | Regular income
2024-01-17 | Refund - Store XYZ | 120.00 | 4354.56 | Refund / Reversal | 0.0 | Legitimate refund
2024-01-18 | Unknown Merchant Overseas | -850.00 | 3504.56 | Miscellaneous / Others | 0.75 | Large overseas transaction, unusual pattern`;

/**
 * Parse plain text AI response into structured JSON
 */
function parseTextToJSON(text: string): ClaudePageResponse {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  // Extract metadata from first few lines
  let bank_name = null;
  let currency = null;
  let account_type: 'credit' | 'debit' | 'savings' | 'unknown' = 'unknown';

  const bankMatch = text.match(/bank[:\s]+([^\n,]+)/i);
  if (bankMatch) bank_name = bankMatch[1].trim();

  const currencyMatch = text.match(/currency[:\s]+([A-Z]{3})/i);
  if (currencyMatch) currency = currencyMatch[1];

  const accountMatch = text.match(/account\s+type[:\s]+(credit|debit|savings)/i);
  if (accountMatch) account_type = accountMatch[1].toLowerCase() as any;

  // Parse transactions (lines with pipe separators)
  const transactions: ParsedTransaction[] = [];

  for (const line of lines) {
    if (!line.includes('|')) continue;

    const parts = line.split('|').map(p => p.trim());
    if (parts.length < 3) continue;

    const [date, description, amountStr, balanceStr, category, fraudScoreStr, fraudReason] = parts;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;

    const amount = parseFloat(amountStr.replace(/[^0-9.-]/g, ''));
    if (isNaN(amount)) continue;

    const balance = balanceStr ? parseFloat(balanceStr.replace(/[^0-9.-]/g, '')) : null;
    const fraudScore = fraudScoreStr ? parseFloat(fraudScoreStr.replace(/[^0-9.]/g, '')) : 0.0;

    transactions.push({
      date,
      description: description || 'Unknown',
      amount,
      currency: currency || 'USD',
      balance: !isNaN(balance!) ? balance : null,
      category: category || 'Miscellaneous / Others',
      fraud_likelihood: !isNaN(fraudScore) ? Math.min(Math.max(fraudScore, 0), 1) : 0.0,
      fraud_reason: fraudReason || 'Normal transaction',
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

/**
 * Parse bank statement pages using GPT-4o-mini
 * @param pages - Array of strings, one per PDF page
 * @returns Unified ParsedStatement with all transactions
 */
export async function parseBankStatementWithClaude(pages: string[]): Promise<ParsedStatement> {
  console.log('\n========================================');
  console.log('[DEBUG] parseBankStatementWithClaude() called');
  console.log('[DEBUG] Input: pages array with', pages.length, 'pages');
  console.log('[DEBUG] Total input size:', pages.join('').length, 'characters');
  console.log('========================================\n');

  const startTime = Date.now();

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.error('[DEBUG] ERROR: OPENAI_API_KEY not found in environment');
    throw new Error('OPENAI_API_KEY environment variable is not set');
  }

  console.log('[DEBUG] Environment check:');
  console.log('  - OPENAI_API_KEY found:', apiKey ? 'YES' : 'NO');
  console.log('  - API key length:', apiKey?.length, 'chars');
  console.log('  - API key prefix:', apiKey?.substring(0, 10) + '...');
  console.log('  - Node environment:', process.env.NODE_ENV);
  console.log('');

  console.log('[AI TIMING] Initializing OpenAI client...');

  console.log('[DEBUG] Creating OpenAI client with config:');
  console.log('  - Model: gpt-4o-mini');
  console.log('  - Timeout: 90000ms (90 seconds)');
  console.log('  - Max retries: 0 (disabled)');
  console.log('  - Server mode: true');
  console.log('');

  const openai = new OpenAI({
    apiKey,
    timeout: 90000, // Global 90 second timeout (increased for slow connections)
    maxRetries: 0, // Disable retries - fail fast
    dangerouslyAllowBrowser: false, // Ensure we're in server mode
  });
  console.log('[AI TIMING] ✓ OpenAI client initialized successfully\n');
  console.log('[DEBUG] SKIPPING WARMUP - Going directly to parsing for maximum speed\n');

  // Process pages in parallel chunks to avoid timeout
  const CHUNK_SIZE = 2; // Process 2 pages at a time
  const chunks: string[][] = [];

  console.log('[DEBUG] ========================================');
  console.log('[DEBUG] Preparing chunks for parallel processing...');
  console.log('[DEBUG] Chunk configuration: CHUNK_SIZE =', CHUNK_SIZE, 'pages per chunk');

  for (let i = 0; i < pages.length; i += CHUNK_SIZE) {
    const chunk = pages.slice(i, i + CHUNK_SIZE);
    chunks.push(chunk);
    console.log(`[DEBUG] Chunk ${chunks.length}: pages ${i + 1}-${Math.min(i + CHUNK_SIZE, pages.length)} (${chunk.length} pages, ${chunk.join('').length} chars)`);
  }

  console.log(`[AI TIMING] Processing ${pages.length} pages in ${chunks.length} parallel chunks`);
  console.log('[DEBUG] Strategy: All chunks will be processed simultaneously for maximum speed');
  console.log('[DEBUG] ========================================\n');

  try {
    const startApiCall = Date.now();
    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] Starting parallel chunk processing...');
    console.log('[DEBUG] Total API call budget: 90000ms (90 seconds global timeout)');
    console.log('[DEBUG] Per-chunk timeout: 60000ms (60 seconds)');
    console.log('[DEBUG] Max completion tokens: UNLIMITED (no restrictions)');
    console.log('[DEBUG] Output format: Plain text with pipe separators (faster than JSON)');
    console.log('[DEBUG] ========================================\n');

    // Process all chunks in parallel
    const chunkPromises = chunks.map(async (chunk, index) => {
      const chunkText = chunk.join('\n\n--- PAGE BREAK ---\n\n');
      console.log(`[DEBUG] ----------------------------------------`);
      console.log(`[DEBUG] Chunk ${index + 1}/${chunks.length} - Starting processing`);
      console.log(`[AI TIMING] Chunk ${index + 1}/${chunks.length}: ${chunkText.length} chars`);
      console.log(`[DEBUG] Chunk ${index + 1} contains ${chunk.length} page(s)`);

      const chunkStart = Date.now(); // Move outside try block so catch can access it

      try {
        console.log(`[DEBUG] Chunk ${index + 1} - Sending request to OpenAI API...`);

        const completion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'user',
              content: `${PARSING_SYSTEM_PROMPT}\n\nBank statement text:\n${chunkText}`,
            },
          ],
          temperature: 0,
          // No max_completion_tokens - let AI generate freely without limits
        }, {
          timeout: 60000, // Increased to 60 seconds to accommodate slower connections
        });
        const chunkTime = Date.now() - chunkStart;

        console.log(`[AI TIMING] ✓ Chunk ${index + 1} completed in ${chunkTime}ms`);
        console.log(`[DEBUG] Chunk ${index + 1} finish_reason: ${completion.choices[0]?.finish_reason}`);
        console.log(`[DEBUG] Chunk ${index + 1} tokens used: ${completion.usage?.total_tokens || 'unknown'} (prompt: ${completion.usage?.prompt_tokens || '?'}, completion: ${completion.usage?.completion_tokens || '?'})`);

        const responseText = completion.choices[0]?.message?.content || '';
        console.log(`[DEBUG] Chunk ${index + 1} raw response length: ${responseText.length} chars`);
        console.log(`[DEBUG] Chunk ${index + 1} raw response preview: ${responseText.substring(0, 200)}...`);

        console.log(`[DEBUG] Chunk ${index + 1} - Parsing plain text response into JSON...`);
        const parsed = parseTextToJSON(responseText);
        console.log(`[DEBUG] Chunk ${index + 1} - Successfully parsed ${parsed.transactions?.length || 0} transactions`);
        console.log(`[DEBUG] Chunk ${index + 1} - Meta: bank=${parsed.meta?.bank_name || 'unknown'}, currency=${parsed.meta?.currency || 'unknown'}`);
        console.log(`[DEBUG] ----------------------------------------\n`);

        return parsed;
      } catch (chunkError) {
        const chunkTime = Date.now() - chunkStart;
        console.error(`[DEBUG] ========================================`);
        console.error(`[AI TIMING] ✗ Chunk ${index + 1} FAILED after ${chunkTime}ms`);
        console.error(`[DEBUG] Chunk ${index + 1} error:`, chunkError instanceof Error ? chunkError.message : chunkError);
        console.error(`[DEBUG] Chunk ${index + 1} error type:`, chunkError instanceof Error ? chunkError.constructor.name : typeof chunkError);
        if (chunkError instanceof Error && chunkError.stack) {
          console.error(`[DEBUG] Chunk ${index + 1} error stack:`, chunkError.stack);
        }
        console.error(`[DEBUG] ========================================\n`);
        throw chunkError;
      }
    });

    // Wait for all chunks to complete
    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] Waiting for all parallel chunks to complete...');
    const chunkResults = await Promise.all(chunkPromises);
    const apiCallTime = Date.now() - startApiCall;

    console.log(`[AI TIMING] ✓ All ${chunks.length} chunks completed in ${apiCallTime}ms`);
    console.log('[DEBUG] Average time per chunk:', Math.round(apiCallTime / chunks.length), 'ms');
    console.log('[DEBUG] ========================================\n');

    // Merge all chunk results
    const startMerge = Date.now();
    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] Starting merge phase...');
    console.log('[DEBUG] Combining results from', chunkResults.length, 'chunks');

    const allTransactions: ParsedTransaction[] = [];
    let meta = chunkResults[0]?.meta || {
      bank_name: null,
      country: null,
      account_type: 'unknown' as const,
      currency: null,
    };

    console.log('[DEBUG] Initial meta from chunk 1:', JSON.stringify(meta));

    for (let i = 0; i < chunkResults.length; i++) {
      const result = chunkResults[i];
      const beforeCount = allTransactions.length;

      if (result.transactions) {
        allTransactions.push(...result.transactions);
        console.log(`[DEBUG] Chunk ${i + 1}: Added ${result.transactions.length} transactions (total now: ${allTransactions.length})`);
      } else {
        console.log(`[DEBUG] Chunk ${i + 1}: No transactions found`);
      }

      // Update meta with first non-null values found
      if (result.meta?.bank_name && !meta.bank_name) {
        meta.bank_name = result.meta.bank_name;
        console.log(`[DEBUG] Updated bank_name from chunk ${i + 1}:`, meta.bank_name);
      }
      if (result.meta?.country && !meta.country) {
        meta.country = result.meta.country;
        console.log(`[DEBUG] Updated country from chunk ${i + 1}:`, meta.country);
      }
      if (result.meta?.currency && !meta.currency) {
        meta.currency = result.meta.currency;
        console.log(`[DEBUG] Updated currency from chunk ${i + 1}:`, meta.currency);
      }
      if (result.meta?.account_type && result.meta.account_type !== 'unknown') {
        meta.account_type = result.meta.account_type;
        console.log(`[DEBUG] Updated account_type from chunk ${i + 1}:`, meta.account_type);
      }
    }

    console.log('[DEBUG] Total transactions before validation:', allTransactions.length);

    // Validate and filter transactions
    const validTransactions = allTransactions.filter((txn, index) => {
      const isValid = txn.date && txn.description && typeof txn.amount === 'number';
      if (!isValid) {
        console.log(`[DEBUG] Invalid transaction at index ${index}:`, JSON.stringify(txn));
      }
      return isValid;
    });

    const invalidCount = allTransactions.length - validTransactions.length;
    if (invalidCount > 0) {
      console.log(`[DEBUG] Filtered out ${invalidCount} invalid transactions`);
    }

    const mergeTime = Date.now() - startMerge;
    const totalTime = Date.now() - startTime;

    console.log(`[AI TIMING] Merged ${validTransactions.length} transactions in ${mergeTime}ms`);
    console.log('[DEBUG] Final meta:', JSON.stringify(meta));
    console.log('[DEBUG] ========================================\n');

    console.log('[DEBUG] ========================================');
    console.log('[DEBUG] FINAL SUMMARY');
    console.log('[DEBUG] ========================================');
    console.log(`[AI TIMING] Total AI processing: ${totalTime}ms`);
    console.log(`[DEBUG] - Initialization: ~${apiCallTime < totalTime ? totalTime - apiCallTime - mergeTime : 0}ms`);
    console.log(`[DEBUG] - API calls (parallel): ${apiCallTime}ms`);
    console.log(`[DEBUG] - Merging results: ${mergeTime}ms`);
    console.log(`[DEBUG] Total pages processed: ${pages.length}`);
    console.log(`[DEBUG] Total chunks processed: ${chunks.length}`);
    console.log(`[DEBUG] Total valid transactions: ${validTransactions.length}`);
    console.log(`[DEBUG] Average processing time per page: ${Math.round(totalTime / pages.length)}ms`);
    console.log('[DEBUG] ========================================\n');

    return {
      meta,
      transactions: validTransactions,
    };
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('\n========================================');
    console.error('[DEBUG] FATAL ERROR OCCURRED');
    console.error('========================================');
    console.error('[AI TIMING] FATAL ERROR after', totalTime, 'ms');
    console.error('[DEBUG] Error message:', error instanceof Error ? error.message : String(error));
    console.error('[DEBUG] Error type:', error instanceof Error ? error.constructor.name : typeof error);

    if (error instanceof Error) {
      console.error('[DEBUG] Error stack trace:');
      console.error(error.stack);
    }

    // Try to extract more context from the error
    if (error && typeof error === 'object') {
      const errorObj = error as any;
      if (errorObj.code) console.error('[DEBUG] Error code:', errorObj.code);
      if (errorObj.status) console.error('[DEBUG] HTTP status:', errorObj.status);
      if (errorObj.response) console.error('[DEBUG] Response data:', JSON.stringify(errorObj.response).substring(0, 500));
    }

    console.error('========================================\n');
    throw new Error(`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
