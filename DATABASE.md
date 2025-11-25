# Database Schema Documentation

## Overview
This application uses Supabase (PostgreSQL) to store bank statements and transactions.

## Tables

### `statements`
Stores metadata about each uploaded PDF bank statement.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| bank_name | TEXT | Name of the bank (optional, user can specify) |
| uploaded_at | TIMESTAMP | When the statement was uploaded |
| start_date | DATE | Earliest transaction date in the statement |
| end_date | DATE | Latest transaction date in the statement |
| file_name | TEXT | Original filename of the uploaded PDF |
| created_at | TIMESTAMP | Record creation timestamp |

### `transactions`
Stores individual transactions extracted from statements.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (auto-generated) |
| statement_id | UUID | Foreign key to statements table |
| date | DATE | Transaction date |
| description | TEXT | Transaction description/merchant |
| amount | DECIMAL(12, 2) | Transaction amount (negative for expenses, positive for income) |
| currency | TEXT | Currency code (default: USD) |
| balance | DECIMAL(12, 2) | Account balance after transaction (if available) |
| category | TEXT | Auto-assigned category |
| created_at | TIMESTAMP | Record creation timestamp |

## Indexes
- `idx_transactions_statement_id`: Fast lookups by statement
- `idx_transactions_date`: Fast date range queries
- `idx_transactions_category`: Fast category filtering
- `idx_transactions_duplicate`: Duplicate detection (date + amount + description)

## Setup Instructions

1. Go to your Supabase project: https://app.supabase.com
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase-schema.sql`
4. Click "Run" to execute the schema

## Row Level Security (RLS)
Currently configured to allow all operations (single-user mode). When adding authentication:
1. Update policies to check user_id
2. Add user_id column to statements table
3. Implement proper authentication flow
