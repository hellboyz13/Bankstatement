# Supabase Sessions Table Setup

## Problem
The "Save Session" feature is failing with error: **"Failed to create session in database"**

This is because the `sessions` table doesn't exist in your Supabase database yet.

## Solution: Create the Sessions Table

### Step 1: Access Supabase SQL Editor

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project: **bank-statement-analyzer**
3. Click on **SQL Editor** in the left sidebar
4. Click **New query**

### Step 2: Verify or Create the Table

**First, check if the table already exists:**

```sql
-- Check if sessions table exists
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public' AND table_name = 'sessions';
```

**If the table exists, verify the structure:**

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;
```

**If you need to create the table from scratch, run this SQL:**

```sql
-- Drop existing table if needed (WARNING: This deletes all session data!)
-- DROP TABLE IF EXISTS sessions CASCADE;

-- Create sessions table for Premium users to save their bank statement sessions
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  filename TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT now(),
  modified_date TIMESTAMPTZ DEFAULT now(),
  transaction_count INTEGER NOT NULL,
  statement_start_date DATE,
  statement_end_date DATE,
  transactions_data JSONB NOT NULL
);

-- Add foreign key constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sessions_user_id_fkey'
  ) THEN
    ALTER TABLE sessions
    ADD CONSTRAINT sessions_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

-- Create index on upload_date for sorting
CREATE INDEX IF NOT EXISTS sessions_upload_date_idx ON sessions(upload_date DESC);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

-- Create policy: Users can only see their own sessions
CREATE POLICY "Users can view own sessions"
  ON sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own sessions
CREATE POLICY "Users can insert own sessions"
  ON sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy: Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON sessions
  FOR DELETE
  USING (auth.uid() = user_id);
```

### Step 3: Verify Table Creation

After running the SQL, verify the table was created:

```sql
-- Check if table exists
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'sessions'
ORDER BY ordinal_position;
```

You should see these columns:
- `id` (uuid)
- `user_id` (uuid)
- `filename` (text)
- `upload_date` (timestamp with time zone)
- `modified_date` (timestamp with time zone)
- `transaction_count` (integer)
- `statement_start_date` (date)
- `statement_end_date` (date)
- `transactions_data` (jsonb)

## Table Schema Explanation

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Unique identifier for the session |
| `user_id` | UUID | Foreign key to auth.users table |
| `filename` | TEXT | Name of the bank statement file |
| `upload_date` | TIMESTAMPTZ | When the session was created |
| `modified_date` | TIMESTAMPTZ | When the session was last modified |
| `transaction_count` | INTEGER | Number of transactions in the statement |
| `statement_start_date` | DATE | Start date of the statement period |
| `statement_end_date` | DATE | End date of the statement period |
| `transactions_data` | JSONB | JSON array containing all transaction data |

## Security Features

The table has **Row Level Security (RLS)** enabled with policies that ensure:
- Users can only see their own sessions
- Users can only create sessions for themselves
- Users can only update/delete their own sessions

## Testing After Setup

Once the table is created, test the Save Session feature:

1. Upload a bank statement PDF
2. Click "Save Session" button
3. It should successfully save and show success message

## Troubleshooting

If you still get errors after creating the table:

1. **Check Supabase URL and Key**: Verify environment variables in `.env.local`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Check Browser Console**: Look for detailed error messages in the browser's developer console (F12)

3. **Check Supabase Logs**: Go to Supabase Dashboard → Logs → Database to see detailed error messages

4. **Verify Premium Plan**: Only Premium users can save sessions. Make sure the user has `plan: 'premium'` in the users table.

## Session Limits

- **Free Plan**: Cannot save sessions (only view current upload)
- **Premium Plan**: Can save up to 12 sessions per year

The limit is enforced in the application code, not at the database level.
