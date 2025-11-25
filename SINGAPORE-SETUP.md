# Singapore Bank Statement Analyzer - Setup Guide

This app is configured for Singapore banks and merchants.

## ✅ What's Been Configured for Singapore

### Currency
- Default currency: **SGD** (Singapore Dollar)
- Display format: **S$** prefix
- All amounts shown with 2 decimal places

### Date Format
- **DD/MM/YYYY** format (Singapore standard)
- Also supports DD-MM-YYYY and YYYY-MM-DD

### Supported Singapore Banks
The app automatically detects these Singapore banks:
- ✅ DBS/POSB
- ✅ OCBC
- ✅ UOB
- ✅ Standard Chartered Singapore
- ✅ Citibank Singapore

### Singapore Merchants & Categories

**Food & Dining**
- Hawker centres, food courts
- NTUC FairPrice, Cold Storage, Giant, Sheng Siong
- Kopitiam, Toast Box, Ya Kun
- Old Chang Kee, BreadTalk, Four Fingers
- GrabFood, foodpanda
- Local restaurants (Chicken Rice, Dim Sum, etc.)

**Transport**
- Grab, Gojek, ComfortDelGro, CityCab
- MRT, LTA, EZ-Link, SimplyGo
- ERP, Parking.sg
- SMRT, SBS Transit
- Petrol stations: Esso, Caltex, SPC, Shell Singapore

**Shopping**
- Lazada, Shopee, Qoo10, Carousell, Zalora
- Uniqlo, H&M, Zara, Cotton On
- Guardian, Watsons, Sephora, Daiso
- Courts, Harvey Norman, Best Denki, Gain City
- Popular, Kinokuniya
- IKEA Singapore

**Bills & Utilities**
- SP Services (electricity), PUB (water)
- SingTel, StarHub, M1, Circles.Life, Gomo
- ViewQwest, MyRepublic
- AIA, Prudential, Great Eastern, Income
- HDB, Town Council fees

## 🚀 Quick Setup (10 minutes)

### 1. Verify Server is Running
Your dev server should be running on: **http://localhost:3001**

If not, run:
```bash
npm run dev
```

### 2. Set Up Supabase Database

1. Go to https://app.supabase.com and create a project
2. In SQL Editor, run the SQL from `supabase-schema.sql`
3. Get your credentials from Settings → API:
   - Project URL
   - anon/public key

### 3. Configure Environment Variables

Create `.env.local`:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Restart the Server
```bash
# Press Ctrl+C to stop the current server
npm run dev
```

### 5. Test with a Singapore Bank Statement

1. Open http://localhost:3001
2. Upload a PDF statement from DBS, OCBC, UOB, etc.
3. Transactions will be automatically:
   - Extracted with DD/MM/YYYY dates
   - Categorized using Singapore merchants
   - Displayed in SGD (S$)

## 📋 Testing the Upload

If you're getting the "Unexpected token '<'" error, it means:

**Possible causes:**
1. ❌ Supabase not configured (missing `.env.local`)
2. ❌ Database tables not created
3. ❌ Server needs restart after code changes

**Solutions:**

### Check 1: Supabase Environment Variables
```bash
# Check if .env.local exists
ls .env.local

# View the file (should show your Supabase URL and key)
cat .env.local
```

Should contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Check 2: Database Tables Created
Go to your Supabase dashboard → SQL Editor and run:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';
```

Should show:
- statements
- transactions

### Check 3: Restart Development Server
The code has been updated, so restart:
```bash
# Press Ctrl+C in the terminal running npm run dev
# Then run again:
npm run dev
```

### Check 4: Clear Browser Cache
Sometimes the browser caches the old code:
1. Open DevTools (F12)
2. Right-click the Refresh button
3. Select "Empty Cache and Hard Reload"

### Check 5: Check Browser Console
Open browser console (F12) and look for errors:
- Network tab: Check if API call to `/api/upload` succeeds
- Console tab: Look for error messages

### Check 6: Check Server Console
Look at your terminal where `npm run dev` is running:
- Should show any parsing errors
- Will display "Processing PDF" when upload starts
- Shows "Extracted X transactions" on success

## 🏦 Singapore Bank Statement Formats

### Common Format
```
Date        Description                          Amount      Balance
01/01/2025  NTUC FAIRPRICE                      -45.60      2,954.40
02/01/2025  GRAB SINGAPORE                      -18.50      2,935.90
03/01/2025  SALARY DEPOSIT                    3,500.00      6,435.90
```

### What Gets Extracted
- **Date**: 01/01/2025 → Parsed as DD/MM/YYYY
- **Description**: NTUC FAIRPRICE → Categorized as "Food & Dining"
- **Amount**: -45.60 → Expense (negative)
- **Balance**: 2,954.40 → Account balance after transaction
- **Currency**: Automatically set to SGD

## 🎨 Customizing for Your Needs

### Add More Singapore Merchants

Edit `lib/categorization.ts`:

```typescript
// Add to Food & Dining
keywords: [
  ...existing keywords,
  'your local cafe', 'your favorite restaurant'
],
```

### Add Your Bank

Edit `lib/pdf-parser.ts`:

```typescript
const mayBankParser: BankParser = {
  name: 'Maybank',
  detect: (text) => text.toLowerCase().includes('maybank'),
  parse: (text) => parseTransactionsFromText(text),
};

// Add to BANK_PARSERS array
const BANK_PARSERS = [
  ...existing,
  mayBankParser,
];
```

## 🐛 Troubleshooting

### Error: "Unexpected token '<'"
**Cause**: API route returning HTML error instead of JSON

**Fix**:
1. Check `.env.local` exists and has correct credentials
2. Restart dev server
3. Clear browser cache
4. Check browser and server console for detailed errors

### Error: "No transactions found"
**Cause**: PDF format not recognized

**Fix**:
1. Check server console for "PDF Raw Text (preview)"
2. Verify PDF contains actual text (not scanned image)
3. Try a different PDF from a major Singapore bank
4. Check if dates are in DD/MM/YYYY format

### Error: "Failed to parse PDF"
**Cause**: PDF extraction failed

**Fix**:
1. Ensure PDF is not password-protected
2. Try re-downloading the statement from your bank
3. Check file size (must be < 10MB)
4. Verify file is actually a PDF (not renamed Word doc)

### Wrong Categories
**Cause**: Merchant name doesn't match keywords

**Fix**:
1. Check the transaction description in the table
2. Add merchant name to `lib/categorization.ts`
3. Reload the page

### Dates Showing Incorrectly
**Cause**: Date format detection issue

**Fix**:
The parser is set to DD/MM/YYYY (Singapore format). If your bank uses MM/DD/YYYY:

Edit `lib/pdf-parser.ts` line 180:
```typescript
function parseDate(dateStr: string, useSingaporeFormat: boolean = false)
```
Change `true` to `false` for US format.

## 📱 Next Steps

1. ✅ Upload your first Singapore bank statement
2. ✅ Verify transactions are categorized correctly
3. ✅ Check the dashboard shows S$ amounts
4. ✅ Adjust merchant keywords as needed
5. 🚀 Deploy to Vercel when ready

## 🆘 Need Help?

1. Check browser console (F12) for errors
2. Check server terminal for logs
3. Verify Supabase tables exist
4. Try a simple test PDF first
5. Check the main [README.md](README.md) for more details

## 🎉 Success Checklist

- [ ] Server running on http://localhost:3001
- [ ] `.env.local` configured with Supabase credentials
- [ ] Database tables created in Supabase
- [ ] PDF uploads without errors
- [ ] Transactions show with "S$" prefix
- [ ] Singapore merchants categorized correctly
- [ ] Dashboard displays charts and data

Once all checked, you're ready to analyze your Singapore bank statements! 🇸🇬
