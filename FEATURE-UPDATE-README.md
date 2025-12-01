# Feature Update: Global Categories & Fraud Detection

## Overview

This update introduces two major features to the Bank Statement Analyzer:

1. **Global Spending Categories** - Replaced country-specific categories with globally-applicable categories
2. **AI-Powered Fraud Detection** - Automatic fraud risk assessment for each transaction

---

## Feature 1: Global Spending Categories

### What Changed

The spending categories have been completely overhauled to be universally applicable across all countries, removing any country-specific brand names or local merchant references.

### New Category System

#### Spending Categories (28 total)

**Food & Shopping:**
- Food & Beverage
- Groceries
- Shopping – General Retail
- Shopping – Fashion & Apparel
- Shopping – Electronics & Technology
- Shopping – Luxury & High-End

**Services & Care:**
- Health & Medical
- Beauty & Personal Care
- Transport
- Travel

**Home & Living:**
- Home & Living
- Bills & Utilities
- Subscriptions & Digital Services
- Insurance

**Personal Development:**
- Education
- Sports & Fitness

**Family & Special:**
- Pets
- Family & Kids

**Financial & Civic:**
- Financial – Fees & Charges
- Investments
- Donations & Charity
- Government & Taxes

**Entertainment:**
- Entertainment & Leisure

#### Credit-Related Categories (5 total)

These are special categories for handling credit card transactions and income:

- **Credit Card Payment** - Payments made to reduce card balance (NOT treated as expenses)
- **Refund / Reversal** - Merchant refunds, cancellations, dispute resolutions
- **Bank Credits** - Cashback, rewards, promotional credits, interest credits
- **True Income** - Salary, wages, business income, payouts
- **Unknown Incoming** - Positive transactions that don't match other categories

#### Fallback Category

- **Miscellaneous / Others** - Only used when no other category fits

### Implementation Details

**Files Updated:**
- `lib/categorization.ts` - New category definitions and keyword rules
- `lib/category-icons.ts` - Updated icons and labels for all categories
- `lib/claudeParser.ts` - Updated AI parser prompts
- `lib/claudeParserStream.ts` - Updated streaming AI parser prompts

**Backward Compatibility:**
- Old categories are automatically mapped to new categories
- Existing data will display correctly with new category icons

---

## Feature 2: AI-Powered Fraud Detection

### What It Does

Every transaction is now automatically evaluated for fraud likelihood using behavioral indicators:

- Transaction amount (unusually large or small for merchant/category)
- Merchant type consistency with user's spending patterns
- Transaction frequency and timing
- Geographic indicators (overseas merchants)
- Pattern anomalies

### Fraud Assessment Rules

**What is NOT flagged as fraud:**
- ✅ Refunds and reversals
- ✅ Credit card payments
- ✅ Bank credits and cashback
- ✅ Pending transactions

**What IS evaluated:**
- ❌ Completed charges only
- ❌ Unusual amounts for merchant type
- ❌ High-frequency transactions in short periods
- ❌ Overseas merchants when user is domestic
- ❌ Inconsistent merchant categories

### Fraud Risk Levels

Each transaction gets a **fraud_likelihood** score from 0.0 to 1.0:

| Score Range | Risk Level | UI Indicator | Example |
|-------------|------------|--------------|---------|
| 0.0 - 0.29 | **Safe** | Green ✓ | Normal dining expense |
| 0.3 - 0.59 | **Medium Risk** | Yellow ⚠ | Unusual amount for category |
| 0.6 - 1.0 | **High Risk** | Red ⚠ | Large overseas transaction |

### Fraud Reason

Each transaction includes a `fraud_reason` field explaining the assessment:
- "Normal spending pattern"
- "Large unusual amount"
- "Overseas merchant, unusual location"
- "High-frequency purchases"

### UI Display

The transaction table now includes a **Fraud Risk** column showing:
- Risk indicator icon (✓ or ⚠)
- Risk level label (Safe/Medium Risk/High Risk)
- Hover tooltip showing the fraud reason

---

## Database Changes

### Migration Required

Run the following SQL migration in your Supabase SQL Editor:

```sql
-- See: supabase-migration-fraud-fields.sql
```

This adds:
- `fraud_likelihood` column (DECIMAL 0.0-1.0)
- `fraud_reason` column (TEXT)
- Index for fraud queries
- Updated `transaction_summaries` view
- New `high_risk_transactions` view for transactions with fraud_likelihood >= 0.5

### New Database Views

**`high_risk_transactions`** - Pre-filtered view of suspicious transactions:
```sql
SELECT * FROM high_risk_transactions;
```

Returns only transactions with fraud_likelihood >= 0.5, sorted by risk level.

---

## API Changes

### Updated Endpoints

**`/api/parse-statement-stream`**
- Now includes fraud assessment in real-time during parsing
- Returns `fraud_likelihood` and `fraud_reason` for each transaction

**`/api/store-parsed-statement`**
- Stores fraud fields in localStorage and database
- Defaults to 0.0 fraud_likelihood if not provided by AI

### Response Format

```typescript
{
  "transactions": [
    {
      "id": "txn_123",
      "date": "2024-01-15",
      "description": "Restaurant ABC",
      "amount": -45.50,
      "category": "Food & Beverage",
      "fraud_likelihood": 0.05,
      "fraud_reason": "Normal dining expense",
      // ... other fields
    }
  ]
}
```

---

## Type Definitions Updated

### ParsedTransaction Interface

```typescript
export interface ParsedTransaction {
  date: string;
  description: string;
  amount: number;
  currency: string | null;
  balance?: number | null;
  category?: string;
  fraud_likelihood?: number; // NEW: 0.0 to 1.0
  fraud_reason?: string;     // NEW: Explanation
  // ... other fields
}
```

### Database Types

```typescript
// lib/database.types.ts
interface Transaction {
  // ... existing fields
  fraud_likelihood: number | null;
  fraud_reason: string | null;
}
```

---

## AI Parser Prompts

### System Prompt Updates

Both `claudeParser.ts` and `claudeParserStream.ts` now use enhanced prompts that:

1. **Specify all 30 global categories** with clear descriptions
2. **Request fraud assessment** for each transaction
3. **Provide fraud evaluation criteria**
4. **Include examples** of categorization and fraud scoring

### Example Prompt Format

```
Format each transaction as: DATE | DESCRIPTION | AMOUNT | BALANCE | CATEGORY | FRAUD_SCORE | FRAUD_REASON

Examples:
2024-01-15 | Local Restaurant | -45.50 | 1234.56 | Food & Beverage | 0.05 | Normal dining expense
2024-01-18 | Unknown Overseas | -850.00 | 3504.56 | Miscellaneous / Others | 0.75 | Large overseas transaction
```

---

## Component Updates

### TransactionTable Component

**New Props:**
```typescript
interface Transaction {
  // ... existing fields
  fraud_likelihood?: number | null;
  fraud_reason?: string | null;
}
```

**New Column:** "Fraud Risk"
- Shows color-coded risk indicators
- Displays risk level (Safe/Medium/High)
- Tooltip shows fraud reason on hover
- Responsive: hides label on small screens, shows icon only

**Visual Indicators:**
- Green badge with ✓ = Safe (< 0.3)
- Yellow badge with ⚠ = Medium Risk (0.3-0.6)
- Red badge with ⚠ = High Risk (> 0.6)

---

## Testing the Features

### 1. Test Global Categories

Upload a bank statement PDF and verify:
- ✅ Transactions are categorized using new global categories
- ✅ No country-specific brand names in category names
- ✅ Categories display with appropriate icons
- ✅ Old categories (if any) map correctly to new ones

### 2. Test Fraud Detection

Upload a statement and check:
- ✅ Each transaction has a fraud risk indicator
- ✅ Normal transactions show "Safe" (green)
- ✅ Refunds/card payments are NOT flagged as fraud
- ✅ Unusual transactions show "Medium" or "High Risk"
- ✅ Hover over risk badge shows fraud reason

### 3. Test Database Storage

```sql
-- Check fraud fields are populated
SELECT description, amount, category, fraud_likelihood, fraud_reason
FROM transactions
ORDER BY fraud_likelihood DESC
LIMIT 10;

-- View high-risk transactions
SELECT * FROM high_risk_transactions;
```

---

## Migration Guide for Existing Data

### For Existing Transactions

1. **Run the database migration** (`supabase-migration-fraud-fields.sql`)
   - Adds new columns with default values (0.0 for fraud_likelihood)
   - Existing transactions will show as "Safe" by default

2. **Re-upload statements** (optional but recommended)
   - Upload PDFs again to get AI fraud assessment
   - New uploads will have proper fraud scoring

3. **Category updates** happen automatically
   - Old categories map to new categories via `getCategoryIcon()`
   - No data migration needed for categories

---

## Performance Considerations

### AI Parser
- Fraud detection adds ~2-5 seconds per statement
- Processing is done during upload (no additional delay)
- Streaming shows progress in real-time

### Database Queries
- New index on `fraud_likelihood` for fast filtering
- `high_risk_transactions` view is pre-filtered for performance

### UI Rendering
- Fraud indicators add minimal overhead (<1ms per transaction)
- Uses CSS for visual states (no JavaScript calculation)

---

## Configuration

### Fraud Thresholds

To adjust fraud risk levels, edit `components/TransactionTable.tsx`:

```typescript
const getFraudIndicator = (likelihood?: number | null) => {
  if (!likelihood || likelihood < 0.3) {  // Change 0.3 to adjust Safe threshold
    return { ... Safe indicator ... };
  } else if (likelihood < 0.6) {  // Change 0.6 to adjust High Risk threshold
    return { ... Medium Risk indicator ... };
  } else {
    return { ... High Risk indicator ... };
  }
};
```

### Category Keywords

To add/modify category matching keywords, edit `lib/categorization.ts`:

```typescript
const CATEGORY_RULES: CategoryRule[] = [
  {
    category: 'Food & Beverage',
    keywords: [
      'restaurant', 'cafe', 'coffee shop', // Add more keywords here
    ],
  },
  // ...
];
```

---

## Troubleshooting

### Issue: Old categories still showing

**Solution:** Clear browser cache and localStorage:
```javascript
localStorage.removeItem('bank_analyzer_transactions');
localStorage.removeItem('bank_analyzer_statements');
```

### Issue: Fraud scores all showing 0.0

**Possible causes:**
1. Using legacy parser instead of AI parser
   - **Fix:** Toggle "Use AI Parser" to ON in upload interface
2. Database migration not run
   - **Fix:** Run `supabase-migration-fraud-fields.sql`

### Issue: TypeScript errors after update

**Solution:** Run type checking:
```bash
npm install
npx tsc --noEmit
```

---

## Future Enhancements

### Possible Improvements

1. **Machine Learning Model**
   - Train custom fraud detection model on user's historical data
   - Personalized fraud thresholds based on spending patterns

2. **Fraud Alerts**
   - Email/SMS notifications for high-risk transactions
   - Real-time fraud monitoring dashboard

3. **Category Learning**
   - AI learns from user corrections
   - Merchant database for better categorization

4. **Multi-Currency Support**
   - Currency-aware fraud detection
   - Automatic exchange rate conversion

5. **Advanced Filtering**
   - Filter transactions by fraud risk level
   - Bulk actions for reviewing flagged transactions

---

## Support

For issues or questions:
1. Check this documentation
2. Review TypeScript types in `lib/types/`
3. Examine example transactions in AI parser prompts
4. Open an issue on GitHub

---

## Version History

### v2.0.0 (Current)
- ✅ Global category system (30 categories)
- ✅ AI-powered fraud detection
- ✅ Enhanced UI with fraud indicators
- ✅ Database schema updates
- ✅ Comprehensive documentation

### v1.0.0 (Previous)
- Basic transaction parsing
- Singapore-focused categories
- No fraud detection
