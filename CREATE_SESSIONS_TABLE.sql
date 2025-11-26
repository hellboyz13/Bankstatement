-- Create sessions table for Premium users to save their bank statement sessions
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  upload_date TIMESTAMPTZ DEFAULT now(),
  modified_date TIMESTAMPTZ DEFAULT now(),
  transaction_count INTEGER NOT NULL,
  statement_start_date DATE,
  statement_end_date DATE,
  transactions_data JSONB NOT NULL
);

-- Create index on user_id for faster queries
CREATE INDEX sessions_user_id_idx ON sessions(user_id);

-- Create index on upload_date for sorting
CREATE INDEX sessions_upload_date_idx ON sessions(upload_date DESC);

-- Enable Row Level Security
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

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
