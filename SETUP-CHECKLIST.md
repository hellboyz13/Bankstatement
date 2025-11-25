# Setup Checklist

Follow these steps in order:

## ✅ Step 1: Install Dependencies
```bash
npm install
```
**Status**: In progress...

---

## ⬜ Step 2: Create Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name**: `bank-statement-analyzer` (or any name you prefer)
   - **Database Password**: Choose a strong password and **save it**
   - **Region**: Select the closest region to you
4. Click "Create new project"
5. Wait 2-3 minutes for the project to initialize

---

## ⬜ Step 3: Create Database Tables

1. In your Supabase dashboard, click **"SQL Editor"** in the left sidebar
2. Click **"New Query"**
3. Open the file `supabase-schema.sql` from this project
4. Copy ALL the SQL code (Ctrl+A, Ctrl+C)
5. Paste it into the Supabase SQL Editor
6. Click **"Run"** button (or press Ctrl+Enter)
7. You should see: ✅ "Success. No rows returned"

This creates:
- `statements` table
- `transactions` table
- Indexes for fast queries
- `transaction_summaries` view

---

## ⬜ Step 4: Get Your API Credentials

1. In Supabase dashboard, click **"Settings"** (gear icon) in the left sidebar
2. Click **"API"** under Project Settings
3. Find and copy these two values:

   **Project URL** (looks like):
   ```
   https://abcdefghijklmnop.supabase.co
   ```

   **anon public key** (long string starting with "eyJ"):
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

Keep these handy for the next step!

---

## ⬜ Step 5: Configure Environment Variables

1. In your terminal, run:
   ```bash
   cp .env.local.example .env.local
   ```

2. Open `.env.local` in your editor

3. Replace the placeholder values:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. Save the file

---

## ⬜ Step 6: Start the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.2.5
- Local:        http://localhost:3000
- Ready in 2.5s
```

---

## ⬜ Step 7: Test the Application

1. Open http://localhost:3000 in your browser
2. You should see the "Bank Statement Analyzer" dashboard
3. Try uploading a PDF bank statement
4. Check that transactions appear in the table
5. Verify charts display correctly

---

## Troubleshooting

### "Missing Supabase environment variables" Error
- Make sure `.env.local` exists
- Verify both variables are set correctly
- Restart dev server after changing `.env.local`

### "Failed to fetch" Error
- Check Supabase project is active in dashboard
- Verify API credentials are correct
- Check your internet connection

### "No transactions found" Error
- Your PDF format may not be recognized
- Check terminal logs for extracted text
- Try a different PDF from a major bank
- See TESTING.md for sample formats

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server |
| `npm run build` | Build for production |
| `npm start` | Run production build |

## Files to Check

- `.env.local` - Your API credentials (don't commit!)
- `supabase-schema.sql` - Database schema
- `QUICKSTART.md` - Detailed setup guide
- `README.md` - Full documentation

## What's Next?

Once everything is running:
1. Upload your first PDF statement
2. Explore the dashboard and filters
3. Customize categories in `lib/categorization.ts`
4. Add bank-specific parsers if needed
5. Deploy to Vercel when ready

---

**Need help?** Check QUICKSTART.md or README.md for detailed guides.
