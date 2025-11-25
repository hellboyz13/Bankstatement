# Quick Start Guide

Get your Bank Statement Analyzer running in 10 minutes.

## Step 1: Install Dependencies

```bash
npm install
```

This will install all required packages including Next.js, React, Supabase, and pdf-parse.

## Step 2: Set Up Supabase Database

### Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name**: Bank Statement Analyzer
   - **Database Password**: (save this somewhere safe)
   - **Region**: Choose closest to you
4. Click "Create new project" and wait 2-3 minutes

### Create Database Tables

1. In your Supabase dashboard, click "SQL Editor" in the left sidebar
2. Click "New Query"
3. Open the file `supabase-schema.sql` from this project
4. Copy all the SQL code
5. Paste it into the Supabase SQL Editor
6. Click "Run" (or press Ctrl+Enter)
7. You should see "Success. No rows returned"

### Get Your API Credentials

1. Click "Settings" (gear icon in sidebar)
2. Click "API" under Project Settings
3. Copy these two values:
   - **Project URL** (looks like: https://xxxxx.supabase.co)
   - **anon/public key** (long string starting with "eyJ...")

## Step 3: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` in your text editor

3. Replace the placeholder values with your Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

4. Save the file

## Step 4: Run the Application

```bash
npm run dev
```

The application will start at http://localhost:3000

## Step 5: Upload Your First Statement

1. Open http://localhost:3000 in your browser
2. You should see the "Bank Statement Analyzer" dashboard
3. In the "Upload Bank Statement" section:
   - (Optional) Enter your bank name
   - Click "Choose File" and select a PDF bank statement
4. The PDF will be uploaded and processed
5. Within seconds, you'll see:
   - Summary cards with income/expenses
   - Charts showing spending by category
   - A table of all transactions

## Step 6: Explore Features

### View Analytics
- Scroll up to see summary cards
- Check the pie chart for category breakdown
- View monthly trends in the line chart

### Filter Transactions
- Use the filter panel to narrow down transactions
- Filter by date range, category, or amount
- Click "Reset" to clear all filters

### Upload More Statements
- Upload additional PDFs to combine data
- The system automatically merges and deduplicates
- Analytics update to reflect all statements

## Troubleshooting

### "Missing Supabase environment variables" Error

**Problem**: `.env.local` is not configured correctly

**Fix**:
1. Make sure `.env.local` exists in the root folder
2. Verify it contains both `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Check for typos in the variable names
4. Restart the dev server after making changes

### "Failed to parse PDF" Error

**Problem**: PDF format is not recognized

**Fix**:
1. Check the server console (terminal) for the raw extracted text
2. Verify your PDF contains actual text (not scanned images)
3. Try a different PDF to isolate the issue
4. See [TESTING.md](TESTING.md) for sample PDF formats

### "No transactions found" Message

**Problem**: Parser couldn't extract transactions

**Fix**:
1. Your PDF might use a unique format
2. Check console logs for extracted text
3. You may need to add a custom parser (see README.md)
4. Test with PDFs from major banks first (Chase, BofA, etc.)

### Database Connection Errors

**Problem**: Can't connect to Supabase

**Fix**:
1. Verify your Supabase project is active (check dashboard)
2. Confirm API credentials are correct
3. Make sure you ran the SQL schema file
4. Check your internet connection

## What's Next?

Now that you have it running:

1. **Upload your real statements**: Try your actual bank PDFs
2. **Customize categories**: Edit `lib/categorization.ts` to add keywords
3. **Add bank parsers**: Create custom parsers in `lib/pdf-parser.ts`
4. **Adjust styling**: Modify Tailwind classes to match your preferences
5. **Deploy to Vercel**: Share your app online (see README.md)

## Key Files to Know

- `app/page.tsx` - Main dashboard UI
- `lib/pdf-parser.ts` - PDF parsing logic
- `lib/categorization.ts` - Category rules and keywords
- `app/api/upload/route.ts` - File upload handling
- `components/` - React UI components

## Getting Help

- **Detailed docs**: See [README.md](README.md)
- **Testing guide**: See [TESTING.md](TESTING.md)
- **Database info**: See [DATABASE.md](DATABASE.md)
- **Console logs**: Check browser console and terminal for errors

## Common Questions

**Q: Can I use this with scanned PDFs?**
A: Not directly. The parser reads text, not images. You'd need OCR (like Tesseract) to extract text first.

**Q: Does this work with all banks?**
A: The generic parser works with most common formats. You may need to add custom parsers for specific banks.

**Q: Is my data secure?**
A: Data is stored in your own Supabase database. Nothing is sent to third parties.

**Q: Can I add authentication?**
A: Yes! The code is designed to make this easy. Add NextAuth or Supabase Auth and update the RLS policies.

**Q: Can I customize categories?**
A: Absolutely. Edit `lib/categorization.ts` to add/remove categories and keywords.

**Q: How do I deploy this?**
A: Push to GitHub and deploy on Vercel (free). See the deployment section in README.md.

**Q: What if parsing fails?**
A: Check the console logs, try a different PDF, or add a custom parser for your specific bank format.

## Support

If you run into issues:
1. Check console logs (browser and terminal)
2. Review the error message
3. Consult the troubleshooting sections
4. Review the testing guide
5. Check Supabase logs in the dashboard

Happy analyzing!
