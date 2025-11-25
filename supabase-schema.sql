-- Bank Statement Analyzer Database Schema
-- Run this SQL in your Supabase SQL Editor

-- Table: statements
-- Stores information about each uploaded PDF statement
CREATE TABLE statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table: transactions
-- Stores individual transactions extracted from statements
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  statement_id UUID REFERENCES statements(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12, 2) NOT NULL,
  currency TEXT DEFAULT 'SGD',
  balance DECIMAL(12, 2),
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_transactions_statement_id ON transactions(statement_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);
CREATE INDEX idx_transactions_date_desc ON transactions(date DESC);

-- Create a composite index for duplicate detection
CREATE INDEX idx_transactions_duplicate ON transactions(date, amount, description);

-- Enable Row Level Security (RLS) - disabled for single-user MVP
-- You can enable this later when adding authentication
ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- For now, allow all operations (single user, no auth)
CREATE POLICY "Allow all operations on statements" ON statements
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on transactions" ON transactions
  FOR ALL USING (true) WITH CHECK (true);

-- Optional: Create a view for transaction summaries
CREATE OR REPLACE VIEW transaction_summaries AS
SELECT
  t.id,
  t.statement_id,
  t.date,
  t.description,
  t.amount,
  t.currency,
  t.balance,
  t.category,
  t.created_at,
  s.bank_name,
  s.file_name
FROM transactions t
LEFT JOIN statements s ON t.statement_id = s.id
ORDER BY t.date DESC;
