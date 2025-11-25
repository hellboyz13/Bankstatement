# Session Management Setup Guide

## Overview
This guide helps you set up the statement sessions feature that allows users to store and revisit uploaded bank statements.

## Feature Requirements
- **Free Plan**: No session history (single upload only)
- **Premium Plan**: Store up to 12 sessions per year
- **Storage**: Supabase database
- **Session Data**: Stores filename, upload date, transaction data, date range

## Step 1: Create `sessions` Table in Supabase

Run this SQL in Supabase SQL Editor:

```sql
-- Create sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  modified_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transaction_count INTEGER NOT NULL,
  statement_start_date DATE,
  statement_end_date DATE,
  transactions_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT filename_not_empty CHECK (filename != ''),
  CONSTRAINT positive_transaction_count CHECK (transaction_count >= 0)
);

-- Create index for faster queries
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_user_upload ON sessions(user_id, upload_date DESC);

-- Enable RLS
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own sessions
CREATE POLICY "Users can view their own sessions"
ON sessions FOR SELECT
USING (auth.uid()::text = user_id::text);

-- RLS Policy: Users can insert their own sessions
CREATE POLICY "Users can insert their own sessions"
ON sessions FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policy: Users can update their own sessions (rename)
CREATE POLICY "Users can update their own sessions"
ON sessions FOR UPDATE
USING (auth.uid()::text = user_id::text)
WITH CHECK (auth.uid()::text = user_id::text);

-- RLS Policy: Users can delete their own sessions
CREATE POLICY "Users can delete their own sessions"
ON sessions FOR DELETE
USING (auth.uid()::text = user_id::text);
```

## Step 2: Session Management Features

### Features Included:
1. ✅ Create new session on file upload
2. ✅ Rename session (edit filename)
3. ✅ Delete session
4. ✅ View session history (12 sessions max for premium)
5. ✅ Session date range display
6. ✅ Transaction count display

### Premium Limit:
- Maximum 12 sessions per year (rolling window)
- Oldest sessions automatically shown as oldest first

## Step 3: Testing

1. Login as premium user
2. Upload a PDF statement
3. Check Sessions tab in Profile page
4. Verify ability to rename and delete sessions
5. Try uploading 13th session - should show limit warning

## Column Explanations

- `user_id`: Links session to user
- `filename`: User-editable session name (e.g., "January 2025 Statement")
- `upload_date`: When the session was created
- `modified_date`: Last time session was renamed
- `transaction_count`: Number of transactions in the session
- `statement_start_date`: Earliest transaction date in statement
- `statement_end_date`: Latest transaction date in statement
- `transactions_data`: JSON array of all transactions for instant recall
