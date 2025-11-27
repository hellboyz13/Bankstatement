# Bank Statement Support Documentation

## Currently Supported Banks

### ✅ Fully Tested & Working
- **UOB Credit Card** - Custom parser with multi-line transaction support

### 🔄 Generic Parser Support (Should Work)
The following banks use the generic parser which handles most common statement formats:
- DBS/POSB
- OCBC
- UOB (Bank Account)
- Standard Chartered
- Citibank

### 🌍 International Banks (Generic Support)
The parser will attempt to parse statements from any bank with these features:
- Date in line (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
- Description text
- Amount with standard formatting ($, commas, decimals)
- Optional balance column

---

## Supported Formats

### Date Formats
- `DD/MM/YYYY` (Singapore standard)
- `MM/DD/YYYY` (US format)
- `YYYY-MM-DD` (ISO format)
- `DD-MM-YYYY` (with dashes)

### Amount Formats
- `$123.45` - Positive amount with currency symbol
- `-$123.45` - Negative amount
- `($123.45)` - Negative amount in parentheses
- `1,234.56` - Amount with thousands separator
- `123.45 CR` - Credit notation

### Expected Line Structure
```
Date    Description                              Amount      Balance
01/02/2024  GRAB*TRIP ABC123                     -15.50     1,234.56
```

---

## How to Test New Bank Statements

If you're uploading a statement from a bank that's not explicitly listed:

### 1. **Check Console Logs**
The parser logs the raw PDF text to console. You can check:
- Are dates being detected?
- Are amounts being detected?
- What's the line structure?

### 2. **Common Issues & Solutions**

#### Issue: "No transactions found"
**Possible Causes:**
- PDF is image-based (scanned document) - not text-based
- Unusual date format not in our supported list
- Multi-line transactions where date, description, and amount are on separate lines

**Solution:**
- Check console logs for "PDF Raw Text"
- Ensure PDF is text-based (you can copy-paste text from it)
- Share the format with us to add custom parser

#### Issue: "Wrong amounts" or "Missing transactions"
**Possible Causes:**
- Amount is in different column position
- Description contains numbers that look like amounts
- Balance column is being read as amount

**Solution:**
- Check the transaction structure in PDF
- May need bank-specific parser

#### Issue: "Wrong dates"
**Possible Causes:**
- Different date format than expected
- Date column name contains dates

**Solution:**
- Check if dates are in DD/MM/YYYY or MM/DD/YYYY
- Parser assumes Singapore format (DD/MM/YYYY) by default

### 3. **Request Custom Parser**

If your bank statement has a unique format, we can create a custom parser. Please provide:

1. **Sample PDF** (with sensitive data redacted)
2. **Bank Name**
3. **Transaction Format** example:
   ```
   Trans Date | Post Date | Description | Amount SGD | Amount MYR
   01 JAN     | 02 JAN    | GRAB TRIP   | 15.50      | -
   ```

---

## Adding Support for New Banks

### For Developers:

To add a new bank-specific parser:

1. **Create parser in `lib/pdf-parser.ts`:**

```typescript
const newBankParser: BankParser = {
  name: 'Bank Name',
  detect: (text: string) => text.toLowerCase().includes('bank keyword'),
  parse: (text: string) => {
    // Custom parsing logic
    return parseCustomFormat(text);
  },
};
```

2. **Add to BANK_PARSERS array:**
```typescript
const BANK_PARSERS: BankParser[] = [
  newBankParser,  // Add new parser
  dbsParser,
  ocbcParser,
  // ... existing parsers
];
```

3. **Create separate parser file if complex:**
```typescript
// lib/bank-name-parser.ts
export function parseBankName(text: string): ParsedTransaction[] {
  // Custom parsing logic
}

export function isBankName(text: string): boolean {
  return text.toLowerCase().includes('bank keyword');
}
```

---

## Testing Checklist

When testing a new bank statement:

- [ ] Upload PDF and check console for "Detected: [Bank Name]"
- [ ] Verify transaction count matches your statement
- [ ] Spot-check 3-5 transactions for accuracy:
  - [ ] Date is correct
  - [ ] Description is readable
  - [ ] Amount is correct (positive/negative)
  - [ ] Balance (if shown) is correct
- [ ] Check date range in dashboard matches statement period
- [ ] Verify all transactions appear in table
- [ ] Test filters (date range, category)

---

## Known Limitations

1. **Image-based PDFs**: Cannot parse scanned documents that don't have text layer
2. **Multi-page Complex Layouts**: Some banks use complex multi-column layouts that may not parse correctly
3. **Foreign Currency**: Currently defaults to SGD, may need manual review for multi-currency statements
4. **Statement Summaries**: Only transaction details are parsed, not summary sections

---

## Getting Help

If you encounter issues with a specific bank:

1. Check console logs (F12 → Console tab)
2. Look for error messages
3. Note which bank and statement type
4. Share the transaction format structure
5. We can create a custom parser for that bank

---

## Supported Transaction Types

The categorization system automatically categorizes transactions:

- 🍔 Food & Dining (restaurants, cafes, food delivery)
- 🏠 Bills & Utilities (water, electricity, internet)
- 🛒 Shopping (retail, online shopping, groceries)
- 🚗 Transportation (public transport, grab, fuel)
- 💰 Transfer (bank transfers, peer payments)
- 📱 Subscription (recurring payments, memberships)
- 💳 Payment (credit card payments, loan repayments)
- ✈️ Travel (hotels, flights, travel expenses)
- 🎬 Entertainment (movies, games, leisure)
- 🏥 Healthcare (medical, pharmacy, insurance)
- 💵 Income (salary, refunds, cashback)
- 📝 Other (uncategorized)
