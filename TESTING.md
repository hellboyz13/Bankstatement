# Testing Guide

This document provides sample data and testing instructions for the Bank Statement Analyzer.

## Sample PDF Text Format

Here's an example of what a typical bank statement PDF might contain after text extraction:

```
CHASE BANK
Statement Period: January 1, 2025 - January 31, 2025
Account Number: ****1234

TRANSACTIONS
Date        Description                          Amount      Balance
01/03/2025  STARBUCKS COFFEE #1234              -5.67       1,494.33
01/05/2025  SALARY DEPOSIT - ACME CORP          2,500.00    3,994.33
01/06/2025  AMAZON.COM                          -45.99      3,948.34
01/08/2025  SHELL GAS STATION                   -52.30      3,896.04
01/10/2025  WHOLE FOODS MARKET                  -87.45      3,808.59
01/12/2025  UBER TRIP                           -18.50      3,790.09
01/15/2025  NETFLIX SUBSCRIPTION                -15.99      3,774.10
01/18/2025  CVS PHARMACY                        -24.76      3,749.34
01/20/2025  RESTAURANT - THE BISTRO             -67.89      3,681.45
01/22/2025  ATM WITHDRAWAL                      -100.00     3,581.45
01/25/2025  ELECTRIC COMPANY                    -125.50     3,455.95
01/28/2025  TARGET STORE                        -89.23      3,366.72
```

## How Parsing Works

Given the above text, the parser will:

1. **Detect dates**: `01/03/2025`, `01/05/2025`, etc.
2. **Extract descriptions**: `STARBUCKS COFFEE #1234`, `SALARY DEPOSIT - ACME CORP`, etc.
3. **Parse amounts**: `-5.67`, `2,500.00`, etc.
4. **Extract balances**: `1,494.33`, `3,994.33`, etc.
5. **Auto-categorize**:
   - `STARBUCKS` → Food & Dining
   - `SALARY DEPOSIT` → Salary & Income
   - `AMAZON` → Shopping
   - `SHELL GAS` → Transport
   - `NETFLIX` → Bills & Utilities
   - etc.

## Expected Output

```json
{
  "transactions": [
    {
      "date": "2025-01-03",
      "description": "STARBUCKS COFFEE #1234",
      "amount": -5.67,
      "currency": "USD",
      "balance": 1494.33,
      "category": "Food & Dining"
    },
    {
      "date": "2025-01-05",
      "description": "SALARY DEPOSIT - ACME CORP",
      "amount": 2500.00,
      "currency": "USD",
      "balance": 3994.33,
      "category": "Salary & Income"
    }
    // ... more transactions
  ],
  "startDate": "2025-01-03",
  "endDate": "2025-01-28",
  "bankName": "Chase"
}
```

## Creating Test PDFs

If you don't have real bank statements, you can create test PDFs:

### Option 1: Use a Word Processor

1. Open Microsoft Word or Google Docs
2. Copy the sample text above
3. Format it to look like a statement
4. Export/Save as PDF

### Option 2: Online PDF Generators

Use online tools like:
- [PDF Escape](https://www.pdfescape.com)
- [Sejda](https://www.sejda.com)
- [SmallPDF](https://smallpdf.com)

### Option 3: Command Line (Linux/Mac)

```bash
# Install wkhtmltopdf
# Ubuntu: sudo apt-get install wkhtmltopdf
# Mac: brew install wkhtmltopdf

# Create HTML file with sample data
cat > test-statement.html <<EOF
<html>
<body>
<h1>CHASE BANK</h1>
<p>Statement Period: January 1, 2025 - January 31, 2025</p>
<table>
<tr><th>Date</th><th>Description</th><th>Amount</th><th>Balance</th></tr>
<tr><td>01/03/2025</td><td>STARBUCKS</td><td>-5.67</td><td>1494.33</td></tr>
<tr><td>01/05/2025</td><td>SALARY DEPOSIT</td><td>2500.00</td><td>3994.33</td></tr>
</table>
</body>
</html>
EOF

# Convert to PDF
wkhtmltopdf test-statement.html test-statement.pdf
```

## Testing the Upload Feature

1. Start the dev server: `npm run dev`
2. Open http://localhost:3000
3. Upload your test PDF
4. Check the browser console for:
   - Upload progress
   - Extracted text preview
   - Transaction count
5. Check the server console (terminal) for:
   - Raw PDF text
   - Parsing results
   - Database insertion logs

## Testing Different Formats

### Date Formats

Test various date formats by creating PDFs with:

```
01/15/2025  (MM/DD/YYYY) - US format
15/01/2025  (DD/MM/YYYY) - European format
2025-01-15  (YYYY-MM-DD) - ISO format
```

### Amount Formats

```
$123.45     - Dollar sign prefix
123.45      - Plain decimal
-$123.45    - Negative with dollar sign
($123.45)   - Parentheses for negative
1,234.56    - Thousands separator
```

### Different Banks

Create PDFs with headers like:
- "Bank of America"
- "Wells Fargo"
- "Citibank"
- "Capital One"

The system should detect the bank name automatically.

## Testing Categorization

Upload a PDF with these descriptions to test categories:

| Description | Expected Category |
|------------|------------------|
| STARBUCKS COFFEE | Food & Dining |
| UBER TRIP | Transport |
| AMAZON.COM | Shopping |
| NETFLIX | Bills & Utilities |
| SALARY DEPOSIT | Salary & Income |
| CVS PHARMACY | Healthcare |
| SPOTIFY | Entertainment |
| HOTEL.COM | Travel |
| COURSERA | Education |
| PAYPAL TRANSFER | Transfers |
| UNKNOWN MERCHANT | Miscellaneous |

## Testing Duplicate Detection

1. Upload the same PDF twice
2. Query the database to verify duplicates were detected
3. Check the dashboard - it should show each transaction once

You can test this with SQL:

```sql
-- Count total transactions
SELECT COUNT(*) FROM transactions;

-- Find potential duplicates
SELECT date, amount, description, COUNT(*) as count
FROM transactions
GROUP BY date, amount, description
HAVING COUNT(*) > 1;
```

## Testing Filters

Test the filter functionality:

1. **Date Range**: Set start/end dates and verify only matching transactions appear
2. **Category**: Select a category and verify filtering
3. **Amount Range**: Set min/max amounts
4. **Reset**: Click reset and verify all filters clear

## Testing Analytics

After uploading statements, verify:

1. **Summary Cards**: Show correct totals
2. **Pie Chart**: Displays category breakdown
3. **Bar Chart**: Shows expenses by category
4. **Line Chart**: Displays monthly trends

## Common Issues and Solutions

### Issue: No Transactions Found

**Cause**: PDF format not recognized

**Solution**:
1. Check console for raw text
2. Verify text contains dates and amounts
3. Add custom parser if needed

### Issue: Wrong Categories

**Cause**: Keywords don't match

**Solution**:
1. Check transaction description
2. Update keywords in `lib/categorization.ts`
3. Consider LLM integration for better accuracy

### Issue: Dates Parsed Incorrectly

**Cause**: Date format ambiguity (MM/DD vs DD/MM)

**Solution**:
1. Add bank detection logic
2. Specify format per bank
3. Update `parseDate()` in `lib/pdf-parser.ts`

### Issue: Amounts Missing Negative Sign

**Cause**: Parser didn't detect expense indicator

**Solution**:
1. Check if PDF uses parentheses: `(123.45)`
2. Look for separate debit/credit columns
3. Update `parseAmount()` logic

## API Testing with cURL

### Upload a PDF

```bash
curl -X POST http://localhost:3000/api/upload \
  -F "file=@test-statement.pdf" \
  -F "bankName=Chase"
```

### Get Transactions

```bash
curl "http://localhost:3000/api/transactions?startDate=2025-01-01&endDate=2025-01-31"
```

### Get Analytics

```bash
curl "http://localhost:3000/api/analytics?startDate=2025-01-01&endDate=2025-12-31"
```

### Get Statements

```bash
curl "http://localhost:3000/api/statements"
```

## Performance Testing

Test with various PDF sizes:

- **Small**: 1-2 pages, ~50 transactions
- **Medium**: 5-10 pages, ~200 transactions
- **Large**: 20+ pages, ~500 transactions

Monitor:
- Upload time
- Parsing time
- Database insertion time
- Memory usage

## Database Testing

Use Supabase SQL Editor to run test queries:

```sql
-- Get transaction count by category
SELECT category, COUNT(*), SUM(amount)
FROM transactions
WHERE amount < 0
GROUP BY category
ORDER BY SUM(amount);

-- Find largest expenses
SELECT date, description, amount
FROM transactions
WHERE amount < 0
ORDER BY amount
LIMIT 10;

-- Monthly summary
SELECT
  DATE_TRUNC('month', date) as month,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) as income,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) as expenses
FROM transactions
GROUP BY DATE_TRUNC('month', date)
ORDER BY month;
```

## Debugging Checklist

- [ ] Check browser console for errors
- [ ] Check server console for parsing logs
- [ ] Verify Supabase credentials in `.env.local`
- [ ] Confirm database schema is created
- [ ] Test with multiple PDF formats
- [ ] Verify network requests in browser DevTools
- [ ] Check Supabase logs in dashboard
- [ ] Test with and without bank name
- [ ] Verify date range filters work
- [ ] Confirm charts render correctly

## Next Steps

After basic testing works:

1. Test with your real bank statements
2. Add custom parsers for your banks
3. Adjust categorization keywords
4. Test duplicate detection with overlapping statements
5. Verify analytics calculations are accurate
