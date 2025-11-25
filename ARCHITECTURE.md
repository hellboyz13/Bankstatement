# Architecture Overview

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser (Client)                     │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  Upload UI │  │  Dashboard   │  │  Filters & Table │    │
│  │ Component  │  │   Charts     │  │    Component     │    │
│  └─────┬──────┘  └──────┬───────┘  └────────┬─────────┘    │
└────────┼─────────────────┼──────────────────┼──────────────┘
         │                 │                  │
         │ POST /api/upload│ GET /api/*       │
         ▼                 ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js API Routes                        │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐    │
│  │  /upload   │  │ /transactions│  │   /analytics     │    │
│  │  ┌──────┐  │  │  ┌────────┐  │  │  ┌────────────┐ │    │
│  │  │ PDF  │  │  │  │ Filter │  │  │  │ Aggregate  │ │    │
│  │  │Parser│  │  │  │ Query  │  │  │  │   Query    │ │    │
│  │  └───┬──┘  │  │  └────┬───┘  │  │  └─────┬──────┘ │    │
│  └──────┼─────┘  └───────┼──────┘  └────────┼────────┘    │
└─────────┼─────────────────┼──────────────────┼──────────────┘
          │                 │                  │
          │ Categorize      │                  │
          ▼                 │                  │
    ┌──────────┐            │                  │
    │Category  │            │                  │
    │ Engine   │            │                  │
    └────┬─────┘            │                  │
         │                  │                  │
         │ Save             │ Read             │ Read
         ▼                  ▼                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase (PostgreSQL)                       │
│  ┌──────────────┐              ┌────────────────────┐       │
│  │  statements  │              │   transactions     │       │
│  │─────────────│              │───────────────────│       │
│  │ id          │◄─────────────│ statement_id      │       │
│  │ bank_name   │              │ date              │       │
│  │ uploaded_at │              │ description       │       │
│  │ start_date  │              │ amount            │       │
│  │ end_date    │              │ category          │       │
│  └─────────────┘              └───────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow

### Upload Flow

```
User selects PDF → FileUpload component → FormData with PDF buffer
                                            ↓
                                    POST /api/upload
                                            ↓
                                    Validate file type & size
                                            ↓
                                    pdf-parse extracts text
                                            ↓
                            Parse transactions (dates, amounts, descriptions)
                                            ↓
                            Categorize each transaction (keyword matching)
                                            ↓
                                Create statement record in DB
                                            ↓
                            Insert all transactions with categories
                                            ↓
                            Return success + transaction count
                                            ↓
                            Dashboard refreshes and shows new data
```

### Query Flow

```
User applies filters → TransactionFilters component → Update state
                                                         ↓
                                        Build query parameters
                                                         ↓
                                    GET /api/transactions?filters
                                                         ↓
                                    Supabase query with WHERE clauses
                                                         ↓
                                        Return filtered results
                                                         ↓
                                    TransactionTable displays data
```

### Analytics Flow

```
Dashboard loads → Fetch analytics data
                        ↓
            GET /api/analytics?dateRange
                        ↓
            Query all transactions in range
                        ↓
        Calculate: income, expenses, by category, by month
                        ↓
            Return aggregated data
                        ↓
    AnalyticsCharts renders pie/bar/line charts
```

## Component Structure

```
app/
├── page.tsx (Main Dashboard)
│   ├── FileUpload
│   │   └── Handles PDF upload
│   ├── AnalyticsCharts
│   │   ├── Summary Cards
│   │   ├── Pie Chart (by category)
│   │   ├── Bar Chart (by category)
│   │   └── Line Chart (monthly trends)
│   ├── TransactionFilters
│   │   └── Date, category, amount filters
│   └── TransactionTable
│       └── Paginated transaction list
```

## Library Organization

```
lib/
├── supabase.ts
│   └── Database client initialization
├── database.types.ts
│   └── TypeScript types from schema
├── pdf-parser.ts
│   ├── parsePDFStatement() - Main entry point
│   ├── parseTransactionsFromText() - Generic parser
│   ├── parseDate() - Date format handling
│   ├── parseAmount() - Amount parsing
│   └── BankParser interface - Custom parsers
├── categorization.ts
│   ├── categorizeTransaction() - Keyword matching
│   ├── CATEGORY_RULES - Rule definitions
│   └── getCategoryColor() - Chart colors
└── duplicate-detection.ts
    ├── areDuplicates() - Compare two transactions
    ├── findDuplicates() - Find all duplicates
    └── removeDuplicates() - Deduplicate array
```

## API Routes

### POST /api/upload
- **Input**: FormData with PDF file and optional bankName
- **Process**: Parse PDF → Categorize → Save to DB
- **Output**: Statement metadata + transaction count
- **Errors**: 400 (invalid file), 422 (parse error), 500 (DB error)

### GET /api/transactions
- **Query Params**: startDate, endDate, category, minAmount, maxAmount
- **Process**: Build filtered Supabase query
- **Output**: Array of transactions with bank info
- **Uses**: transaction_summaries view (joins statements + transactions)

### GET /api/statements
- **Process**: Query all statements with transaction counts
- **Output**: Array of statements with metadata
- **Uses**: Supabase aggregate query

### GET /api/analytics
- **Query Params**: startDate, endDate
- **Process**: Aggregate transactions by category and month
- **Output**: Summary stats + breakdowns
- **Uses**: Client-side aggregation of transaction data

## Database Schema

```sql
statements (1) ─────< (N) transactions

statements:
- id (PK)
- bank_name
- uploaded_at
- start_date
- end_date
- file_name

transactions:
- id (PK)
- statement_id (FK → statements.id)
- date
- description
- amount
- currency
- balance
- category
- created_at

Indexes:
- transactions.statement_id (fast joins)
- transactions.date (date range queries)
- transactions.category (filtering)
- (date, amount, description) (duplicate detection)
```

## Parsing Strategy

### Generic Parser Algorithm

1. **Split text into lines**
2. **For each line:**
   - Search for date pattern
   - If date found, look for amounts (regex)
   - Extract description (text between date and amount)
   - Parse balance (second amount if present)
3. **Categorize transaction** using keyword matching
4. **Return array** of transaction objects

### Bank-Specific Parsers

Implement `BankParser` interface:

```typescript
{
  name: string;           // Bank name
  detect: (text) => bool; // Detection logic
  parse: (text) => [];    // Custom parsing
}
```

System checks registered parsers first, falls back to generic.

## Categorization Strategy

### Rule-Based Matching

```typescript
{
  category: "Food & Dining",
  keywords: ["starbucks", "restaurant", "food"],
  isIncome?: false
}
```

### Algorithm

1. Convert description to lowercase
2. For each rule:
   - If rule.isIncome, check amount > 0
   - For each keyword, check if in description
   - If match, return category
3. Default to "Miscellaneous"

### Future: LLM Enhancement

Replace keyword matching with Claude API:
- Send description + amount
- Receive category from LLM
- Cache results to minimize API calls
- Fall back to keywords if API fails

## Duplicate Detection Strategy

### Criteria

Two transactions are duplicates if:
- Same date (exact match)
- Same amount (within $0.01)
- Same description (case-insensitive, trimmed)

### Process

1. Create composite key: `${date}|${amount}|${description}`
2. Use Set to track seen keys
3. Mark/remove subsequent occurrences

### Why This Matters

When uploading overlapping statements:
- January statement: Jan 1 - Jan 31
- Q1 statement: Jan 1 - Mar 31
- Result: Jan transactions appear twice
- Solution: Deduplicate before display

## Security Considerations

### Current State (Single User)

- No authentication required
- RLS policies allow all operations
- Environment variables for DB access
- File size limits (10MB)
- File type validation (PDF only)

### Future (Multi-User)

1. Add authentication (NextAuth/Supabase Auth)
2. Add user_id to statements table
3. Update RLS policies to check user_id
4. Add user session checks in API routes
5. Implement per-user quotas

## Performance Considerations

### Current Optimizations

- Database indexes on common query fields
- Views for complex joins (transaction_summaries)
- Client-side caching of filter results
- Efficient PDF parsing (stream processing)

### Future Optimizations

- Pagination for large transaction lists
- Virtual scrolling for tables
- Background jobs for large PDFs
- Redis caching for analytics
- CDN for static assets

## Deployment Architecture

```
GitHub → Vercel (Edge Network)
           ├─ Next.js SSR/API Routes
           ├─ Static Assets (CDN)
           └─ Serverless Functions

Environment Variables (Vercel):
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY

Supabase Cloud:
- PostgreSQL Database
- Real-time subscriptions (future)
- Row Level Security
```

## Tech Stack Rationale

### Next.js 14
- App Router for modern React patterns
- API routes for serverless backend
- TypeScript for type safety
- Zero-config deployment to Vercel

### Supabase
- PostgreSQL with excellent type generation
- Real-time capabilities (future use)
- Built-in auth (when needed)
- Generous free tier

### Tailwind CSS
- Rapid UI development
- Consistent design system
- Small bundle size
- Easy customization

### Recharts
- React-native charts
- Responsive by default
- Extensive chart types
- Good documentation

### pdf-parse
- Simple API
- Pure JavaScript (no binaries)
- Works in Node.js environment
- Handles most PDF formats

## Extension Points

### Easy to Add

1. **New categories**: Edit categorization.ts
2. **Bank parsers**: Implement BankParser interface
3. **Export features**: Add /api/export route
4. **Budget tracking**: New table + UI components
5. **Recurring detection**: Pattern matching algorithm

### Requires More Work

1. **OCR for scanned PDFs**: Integrate Tesseract.js
2. **Multi-currency**: Currency conversion API
3. **Machine learning**: Train custom model
4. **Mobile apps**: React Native with same backend
5. **Real-time sync**: Implement Supabase subscriptions
