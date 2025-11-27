# AI Bank Statement Parser

## Overview

This implementation adds a universal PDF bank statement parsing pipeline using OpenAI's GPT-4o-mini that can handle statements from **any bank worldwide**.

## Features

✅ **Universal Bank Support** - Works with statements from any bank, any country
✅ **Intelligent Parsing** - AI understands context, not just patterns
✅ **Multi-line Transactions** - Handles wrapped descriptions and complex layouts
✅ **Smart AI Categorization** - Uses GPT-4o-mini to intelligently categorize transactions with confidence scores
✅ **Metadata Extraction** - Detects bank name, country, account type, currency
✅ **Fallback Support** - Toggle between AI parser and legacy pattern-based parser

---

## Architecture

### 1. **API Route: `/api/parse-statement`**
- Accepts PDF file via POST (multipart form data)
- Extracts text per page using `pdf-parse`
- Sends each page to Claude AI for parsing
- Returns merged list of transactions

**File:** `app/api/parse-statement/route.ts`

### 2. **Claude Parser Utility**
- Main parsing logic using Anthropic SDK
- Processes each page with a detailed system prompt
- Merges results from all pages
- Validates and filters transactions

**File:** `lib/claudeParser.ts`

### 3. **Storage API: `/api/store-parsed-statement`**
- Accepts parsed statement data
- Stores in local memory (same as legacy parser)
- Auto-categorizes transactions
- Returns formatted response

**File:** `app/api/store-parsed-statement/route.ts`

### 4. **TypeScript Types**
- Strict type definitions for parsed statements
- Ensures type safety across the pipeline

**File:** `lib/types/parsed-statement.ts`

### 5. **Frontend Toggle**
- Added toggle in FileUpload component
- Switch between AI parser and legacy parser
- Default: AI parser enabled

**File:** `components/FileUpload.tsx`

---

## How It Works

### Flow Diagram

```
1. User uploads PDF
   ↓
2. Frontend checks parser toggle
   ↓
3a. [AI Parser Path]
    PDF → /api/parse-statement
        ↓
    Extract text per page
        ↓
    Send to Claude AI (each page)
        ↓
    Claude returns JSON per page
        ↓
    Merge all pages
        ↓
    Send to /api/store-parsed-statement
        ↓
    Store in memory + categorize
        ↓
    Return to frontend

3b. [Legacy Parser Path]
    PDF → /api/upload-local
        ↓
    Pattern-based parsing
        ↓
    Store in memory
        ↓
    Return to frontend
```

---

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
OPENAI_API_KEY=your_api_key_here
```

**Getting an API Key:**
1. Sign up at https://platform.openai.com/
2. Navigate to API Keys section
3. Create a new API key
4. Copy and paste into `.env.local`

---

## Claude AI Parsing System Prompt

The parser uses a comprehensive system prompt that instructs Claude to:

- **Ignore** headers, footers, page numbers, disclaimers
- **Extract** only real transaction rows
- **Normalize** dates to YYYY-MM-DD format
- **Handle** various amount formats (negatives, parentheses, DR/CR notation)
- **Preserve** full merchant descriptions (multi-line support)
- **Detect** bank metadata (name, country, currency, account type)
- **Categorize** transaction types (debit, credit, payment, fee, interest, refund)
- **Intelligently categorize** transactions using AI reasoning, not keyword matching
- **Provide confidence scores** for each category assignment (0.0-1.0)
- **Return** strict JSON schema (no markdown, no code fences)

### Intelligent Categorization

The AI uses **world knowledge and context** to categorize transactions accurately:

**Categories Available:**
- Food & Dining
- Transport
- Shopping
- Bills & Utilities
- Salary & Income
- Healthcare
- Entertainment
- Travel
- Education
- Transfers
- Miscellaneous

**Smart Reasoning Examples:**
- "WatchBook" → Shopping (0.9) - Recognized as watch retailer, NOT bookstore
- "Grab" → Transport (0.85) - Ride-hailing service unless "GrabFood" appears
- "NTUC FairPrice" → Food & Dining (0.95) - Singapore supermarket
- "Shell Singapore" → Transport (0.9) - Petrol station
- "Netflix" → Bills & Utilities (0.95) - Subscription service

**Confidence Scoring:**
- **High (0.8-1.0):** Clear merchant recognition (e.g., "McDonald's", "Grab")
- **Medium (0.5-0.7):** Inferred from context (e.g., unknown local store)
- **Low (0.2-0.4):** Ambiguous description (e.g., "Payment REF123")

### Supported Layouts

✅ **Table format**:
```
Date       Description          Debit    Credit   Balance
01/12/24   STORE NAME          50.00              1,234.56
```

✅ **Multi-line format**:
```
12 JAN  STORE NAME
        CITY, COUNTRY
        -23.50
```

✅ **Various date formats**:
- `12 Jan 2024`, `12/01/24`, `2024-01-12`, `01-12-2024`

✅ **Various amount formats**:
- `1,234.56`, `(123.45)`, `123.45 DR`, `CR 123.45`, `-$50.00`

---

## JSON Schema

### Response Format

```typescript
{
  "meta": {
    "bank_name": "DBS Bank" | null,
    "country": "Singapore" | null,
    "account_type": "current" | "savings" | "credit_card" | "unknown",
    "currency": "SGD" | null
  },
  "transactions": [
    {
      "date": "2024-01-12",           // YYYY-MM-DD
      "posting_date": "2024-01-13" | null,
      "description": "GRAB*TRIP ABC123",
      "amount": -15.50,                // negative = debit
      "currency": "SGD" | null,
      "type": "debit" | "credit" | "payment" | "fee" | "interest" | "refund" | "unknown",
      "balance": 1234.56 | null,
      "raw_lines": ["original line 1", "line 2"],
      "category": "Transport",         // AI-assigned category
      "category_confidence": 0.95      // Confidence score (0.0-1.0)
    }
  ]
}
```

---

## Usage

### 1. **Upload with AI Parser (Default)**

The toggle is ON by default. Just upload a PDF:

1. Go to Dashboard
2. Click "Choose File"
3. Select PDF bank statement
4. Wait for AI processing (may take 10-30 seconds)
5. View transactions in table

### 2. **Upload with Legacy Parser**

Toggle OFF the "🤖 Use AI Parser (Claude)" switch:

1. Click the toggle to disable
2. Upload PDF
3. Uses pattern-based parser (faster but less accurate)

### 3. **Comparing Results**

Test both parsers with the same file:
1. Upload with AI parser ON
2. Clear results
3. Toggle AI parser OFF
4. Upload same file
5. Compare accuracy

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "ANTHROPIC_API_KEY not set" | Missing API key | Add to `.env.local` |
| "No transactions found" | Empty or image-based PDF | Ensure PDF has text layer |
| "Failed to parse AI response" | Invalid JSON from Claude | Contact support, may be API issue |
| "Configuration error" | API key invalid | Check API key is correct |

### Troubleshooting

**1. Check Console Logs**

Open browser console (F12) and look for:
- `[ClaudeParser] Processing X pages`
- `[ClaudeParser] Page X: Found Y transactions`
- Any error messages

**2. Verify PDF Text Extraction**

Look for console log:
- `[ParseStatement] Extracted X pages from PDF`
- `[ParseStatement] First page preview: ...`

If preview shows garbage or empty, PDF might be image-based.

**3. Test with Known Good File**

Try with a simple bank statement first before complex ones.

---

## Performance

### Speed

- **Legacy Parser**: ~1-2 seconds per file
- **AI Parser**: ~5-30 seconds per file (depends on page count)

### Cost

OpenAI API pricing (as of 2024):
- Model: `gpt-4o-mini`
- Input: ~$0.15 per million tokens
- Output: ~$0.60 per million tokens

**Estimated cost per statement:**
- 1-5 pages: ~$0.0005 - $0.003 (less than a penny)
- 10 pages: ~$0.006
- 20 pages: ~$0.012

**Very cost-effective:** GPT-4o-mini is one of the cheapest AI models while maintaining high accuracy

### Optimization Tips

1. Use legacy parser for known bank formats
2. Cache parsed results (save sessions)
3. Batch process multiple statements

---

## Comparison: AI vs Legacy Parser

| Feature | AI Parser (Claude) | Legacy Parser |
|---------|-------------------|---------------|
| **Supported Banks** | ✅ Universal (all banks) | ⚠️ Limited (pattern-based) |
| **Multi-line Transactions** | ✅ Yes | ❌ No |
| **Complex Layouts** | ✅ Handles well | ⚠️ May fail |
| **Date Format Flexibility** | ✅ Any format | ⚠️ Pre-defined formats |
| **Amount Format Flexibility** | ✅ Any format | ⚠️ Pre-defined formats |
| **Metadata Extraction** | ✅ Auto-detects | ❌ Manual/hardcoded |
| **Speed** | ⚠️ Slower (5-30s) | ✅ Fast (1-2s) |
| **Cost** | ⚠️ ~$0.01-0.20/file | ✅ Free |
| **Accuracy** | ✅ Very High | ⚠️ Moderate |
| **Requires API Key** | ✅ Yes | ❌ No |

---

## Files Changed

### New Files Created

1. `lib/claudeParser.ts` - Main Claude parsing logic
2. `lib/types/parsed-statement.ts` - TypeScript types
3. `app/api/parse-statement/route.ts` - PDF parsing API
4. `app/api/store-parsed-statement/route.ts` - Storage API
5. `CLAUDE_PARSER_README.md` - This documentation

### Modified Files

1. `components/FileUpload.tsx` - Added parser toggle, updated upload logic
2. `package.json` - Added `@anthropic-ai/sdk` dependency

### Dependencies Added

```json
{
  "@anthropic-ai/sdk": "^0.30.1"
}
```

---

## Testing Checklist

- [ ] Set `ANTHROPIC_API_KEY` in `.env.local`
- [ ] Build succeeds (`npm run build`)
- [ ] Upload PDF with AI parser enabled
- [ ] Check console for Claude API calls
- [ ] Verify transactions appear in table
- [ ] Toggle to legacy parser
- [ ] Upload same PDF
- [ ] Compare results
- [ ] Test with different bank statements
- [ ] Check date range extraction
- [ ] Verify balance calculations
- [ ] Test session saving functionality

---

## Future Enhancements

1. **Caching** - Cache parsed results to avoid re-parsing
2. **Batch Processing** - Process multiple files in parallel
3. **Custom Rules** - Allow users to define custom parsing rules
4. **Confidence Scores** - Show AI confidence for each transaction
5. **Manual Corrections** - Allow users to fix parsing errors
6. **Training Data** - Collect anonymized data to improve accuracy
7. **Model Selection** - Allow choosing different Claude models
8. **OCR Integration** - Add OCR for image-based PDFs

---

## Support

For issues or questions:

1. Check console logs for errors
2. Verify API key is set correctly
3. Test with legacy parser to isolate issue
4. Check [BANK_STATEMENT_SUPPORT.md](BANK_STATEMENT_SUPPORT.md) for troubleshooting

---

## License

Part of Bank Statement Analyzer project.
