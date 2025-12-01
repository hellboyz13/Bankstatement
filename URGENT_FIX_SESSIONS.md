# 🔴 URGENT: Sessions ARE Saving But Not Showing

## The Problem

**Good News:** Sessions ARE being saved to the database! ✅
- Diagnostic script shows **7 sessions** in your database
- All with your user ID
- All with correct transaction counts

**Bad News:** The Next.js API can't fetch them ❌
- Profile page shows empty array
- This is a Row Level Security (RLS) issue

## Why This Happens

Supabase has Row Level Security (RLS) that blocks the API from reading sessions even though:
1. The service role key IS set in `.env.local`
2. Sessions ARE being created successfully
3. The diagnostic script CAN read them (because it uses service role directly)

But the Next.js API route needs special RLS policies to work.

## The Fix (Takes 2 Minutes)

### Step 1: Open Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Click on your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run This SQL

Copy and paste this ENTIRE script and click "Run":

\`\`\`sql
-- Fix RLS policies for sessions table
-- This allows the service role key to bypass RLS

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

-- Create new policies that work with service role
CREATE POLICY "Users can view own sessions"
  ON sessions
  FOR SELECT
  USING (auth.uid() = user_id OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Users can insert own sessions"
  ON sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Users can update own sessions"
  ON sessions
  FOR UPDATE
  USING (auth.uid() = user_id OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Users can delete own sessions"
  ON sessions
  FOR DELETE
  USING (auth.uid() = user_id OR current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Verify
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'sessions';
\`\`\`

### Step 3: Verify It Worked

You should see output showing 4 policies:
- Users can view own sessions
- Users can insert own sessions
- Users can update own sessions
- Users can delete own sessions

### Step 4: Test

1. Go to http://localhost:3001/profile
2. Refresh the page
3. ✅ You should now see all **7 saved sessions**!

## Alternative: Quick Test (Temporary - Not Secure)

If you just want to test locally and don't care about security:

\`\`\`sql
-- WARNING: This disables all security!
-- ONLY use for local testing
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
\`\`\`

Then re-enable it later:
\`\`\`sql
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
\`\`\`

## After Running the Fix

1. Refresh your profile page
2. All 7 sessions should appear
3. You can click on them to load the transactions
4. Session saving will work perfectly from now on

## Still Not Working?

If you see errors after running the SQL, share them with me and I'll help debug!

The sessions ARE there - we just need to fix the RLS policies so the API can read them.
