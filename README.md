# Bank Statement Analyzer

A modern web application for uploading PDF bank statements, automatically extracting and categorizing transactions, and visualizing spending patterns.

## Features

- **PDF Upload**: Drag-and-drop interface for uploading bank statement PDFs
- **Automatic Extraction**: Parse transactions from PDFs with support for multiple bank formats
- **Smart Categorization**: Rule-based keyword matching to categorize transactions
- **Rich Analytics**: View income, expenses, and spending patterns with interactive charts
- **Multi-Statement Support**: Upload multiple statements and combine into a unified view
- **Duplicate Detection**: Automatically identify and handle duplicate transactions
- **Advanced Filtering**: Filter transactions by date, category, and amount

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Next.js API Routes (Serverless)
- **Database**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **PDF Processing**: pdf-parse

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)

### 1. Clone and Install

```bash
cd BankStatement
npm install
```

### 2. Set Up Supabase

1. Go to [Supabase](https://app.supabase.com) and create a new project
2. Once your project is ready, go to **Settings** → **API**
3. Copy your **Project URL** and **anon/public key**
4. Go to **SQL Editor** in Supabase
5. Copy the contents of `supabase-schema.sql` and run it to create the database tables

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add your Supabase credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Uploading Statements

1. Click "Choose File" and select a PDF bank statement
2. Optionally enter the bank name
3. Click upload - the system will:
   - Extract all transactions
   - Auto-categorize each transaction
   - Store everything in the database
   - Update the dashboard

### Viewing Analytics

The dashboard displays:
- **Summary cards**: Total income, expenses, net savings, transaction count
- **Pie chart**: Spending breakdown by category
- **Bar chart**: Expenses per category
- **Line chart**: Monthly income and expense trends

### Filtering Transactions

Use the filter panel to narrow down transactions:
- **Date range**: Start and end dates
- **Category**: Filter by spending category
- **Amount range**: Min and max transaction amounts

### Combining Multiple Statements

Simply upload additional PDF statements. The system will:
- Store each statement separately
- Combine all transactions in the dashboard
- Detect and handle duplicates automatically

## Project Structure

```
BankStatement/
├── app/
│   ├── api/              # API routes
│   │   ├── upload/       # PDF upload endpoint
│   │   ├── transactions/ # Get transactions
│   │   ├── statements/   # Get statements
│   │   └── analytics/    # Get analytics data
│   ├── globals.css       # Global styles
│   ├── layout.tsx        # Root layout
│   └── page.tsx          # Main dashboard page
├── components/
│   ├── FileUpload.tsx           # File upload component
│   ├── TransactionFilters.tsx   # Filter controls
│   ├── TransactionTable.tsx     # Transaction data table
│   └── AnalyticsCharts.tsx      # Charts and visualizations
├── lib/
│   ├── supabase.ts             # Supabase client
│   ├── database.types.ts       # TypeScript types
│   ├── pdf-parser.ts           # PDF parsing logic
│   ├── categorization.ts       # Transaction categorization
│   └── duplicate-detection.ts  # Duplicate handling
├── supabase-schema.sql  # Database schema
└── README.md            # This file
```

## How It Works

### PDF Parsing

The parser extracts transactions using pattern matching:

1. **Date Detection**: Matches common date formats (MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD)
2. **Amount Extraction**: Handles various formats ($123.45, (123.45), -123.45)
3. **Description Parsing**: Extracts merchant/description text
4. **Balance Tracking**: Captures account balance if available

### Categorization

Transactions are categorized using keyword matching:

- Keywords in the description are matched against predefined rules
- Each category has a list of associated keywords
- Income is detected by positive amounts + income keywords
- Default category is "Miscellaneous" if no match found

See [lib/categorization.ts](lib/categorization.ts) for the full rule set.

### Duplicate Detection

Duplicates are identified by matching:
- Transaction date
- Amount (within 0.01 tolerance)
- Description (case-insensitive)

When viewing combined statements, only unique transactions are shown.

## Customization

### Adding Bank-Specific Parsers

Edit [lib/pdf-parser.ts](lib/pdf-parser.ts) and add a new parser:

```typescript
const myBankParser: BankParser = {
  name: 'MyBank',
  detect: (text: string) => text.toLowerCase().includes('mybank'),
  parse: (text: string) => {
    // Custom parsing logic
    return transactions;
  },
};

// Add to registry
const BANK_PARSERS: BankParser[] = [chaseParser, myBankParser];
```

### Customizing Categories

Edit [lib/categorization.ts](lib/categorization.ts):

1. Add new category to `TransactionCategory` type
2. Add keywords to `CATEGORY_RULES`
3. Add color to `getCategoryColor()`

### Using LLM for Better Categorization

The categorization file includes instructions for integrating Claude API. To enable:

1. Install SDK: `npm install @anthropic-ai/sdk`
2. Add `ANTHROPIC_API_KEY` to `.env.local`
3. Uncomment and adapt the `categorizeWithLLM()` function
4. Update the upload route to use LLM categorization

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [Vercel](https://vercel.com) and import your repository
3. Add environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

Your app will be live at `https://your-app.vercel.app`

### Important Notes

- The free Vercel tier includes generous limits
- API routes have a 10-second timeout (sufficient for most PDFs)
- Large PDFs (>10MB) may hit memory limits - adjust if needed

## Troubleshooting

### No Transactions Found

If PDF parsing fails:

1. Check console logs for raw PDF text
2. Verify date and amount formats match expected patterns
3. Consider adding a bank-specific parser
4. Test with a different PDF to isolate the issue

### Database Connection Errors

- Verify `.env.local` has correct Supabase credentials
- Ensure database schema was created successfully
- Check Supabase dashboard for connection issues

### Parsing Errors

- Different banks format PDFs differently
- Generic parser works for most common formats
- Add custom parsers for specific banks (see Customization)

## Debugging Tips

### View Raw PDF Text

Check the server console after upload - it logs the first 500 characters of extracted text.

### Test Parsing Logic

Create a test file:

```typescript
import { parsePDFStatement } from '@/lib/pdf-parser';
import fs from 'fs';

const buffer = fs.readFileSync('test-statement.pdf');
const result = await parsePDFStatement(buffer);
console.log(result);
```

### Database Queries

Use Supabase SQL Editor to run queries directly:

```sql
-- View all transactions
SELECT * FROM transaction_summaries ORDER BY date DESC;

-- Check for duplicates
SELECT date, amount, description, COUNT(*)
FROM transactions
GROUP BY date, amount, description
HAVING COUNT(*) > 1;
```

## Future Enhancements

- [ ] User authentication and multi-user support
- [ ] Export transactions to CSV/Excel
- [ ] Budget tracking and alerts
- [ ] Recurring transaction detection
- [ ] Mobile app (React Native)
- [ ] AI-powered categorization with Claude
- [ ] Receipt photo uploads
- [ ] Merchant name normalization
- [ ] Custom category creation

## License

MIT

## Support

For issues or questions, please check:
- [DATABASE.md](DATABASE.md) for schema details
- Console logs for error messages
- Supabase dashboard for database issues
