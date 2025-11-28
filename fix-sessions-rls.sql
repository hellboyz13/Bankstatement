-- Fix RLS policies for sessions table to work with service role key
-- Run this in your Supabase SQL Editor

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON sessions;

-- Create new policies that allow service role to bypass RLS
-- Service role automatically bypasses RLS, but we'll make it explicit

-- Policy: Users can view own sessions (or service role can view all)
CREATE POLICY "Users can view own sessions"
  ON sessions
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Users can insert own sessions (or service role can insert any)
CREATE POLICY "Users can insert own sessions"
  ON sessions
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Users can update own sessions (or service role can update any)
CREATE POLICY "Users can update own sessions"
  ON sessions
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Policy: Users can delete own sessions (or service role can delete any)
CREATE POLICY "Users can delete own sessions"
  ON sessions
  FOR DELETE
  USING (
    auth.uid() = user_id
    OR auth.jwt() ->> 'role' = 'service_role'
  );

-- Verify policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'sessions';
