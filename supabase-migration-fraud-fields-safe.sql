-- Safe Migration: Add fraud detection fields to transactions table
-- This migration works whether or not the base schema exists
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Create base tables if they don't exist (idempotent)
CREATE TABLE IF NOT EXISTS statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  file_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
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

-- Step 2: Add fraud detection fields (only if they don't exist)
DO $$
BEGIN
  -- Add fraud_likelihood column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'fraud_likelihood'
  ) THEN
    ALTER TABLE transactions
    ADD COLUMN fraud_likelihood DECIMAL(3, 2) DEFAULT 0.0 CHECK (fraud_likelihood >= 0 AND fraud_likelihood <= 1);
  END IF;

  -- Add fraud_reason column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions'
    AND column_name = 'fraud_reason'
  ) THEN
    ALTER TABLE transactions
    ADD COLUMN fraud_reason TEXT;
  END IF;
END $$;

-- Step 3: Create indexes (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_transactions_statement_id ON transactions(statement_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date_desc ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_duplicate ON transactions(date, amount, description);
CREATE INDEX IF NOT EXISTS idx_transactions_fraud_likelihood ON transactions(fraud_likelihood DESC);

-- Step 4: Enable Row Level Security (if not already enabled)
DO $$
BEGIN
  ALTER TABLE statements ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
EXCEPTION
  WHEN OTHERS THEN NULL;
END $$;

-- Step 5: Create RLS policies (if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'statements'
    AND policyname = 'Allow all operations on statements'
  ) THEN
    CREATE POLICY "Allow all operations on statements" ON statements
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'transactions'
    AND policyname = 'Allow all operations on transactions'
  ) THEN
    CREATE POLICY "Allow all operations on transactions" ON transactions
      FOR ALL USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Step 6: Create or replace views
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
  t.fraud_likelihood,
  t.fraud_reason,
  t.created_at,
  s.bank_name,
  s.file_name
FROM transactions t
LEFT JOIN statements s ON t.statement_id = s.id
ORDER BY t.date DESC;

-- Step 7: Create high-risk transactions view
CREATE OR REPLACE VIEW high_risk_transactions AS
SELECT
  t.id,
  t.statement_id,
  t.date,
  t.description,
  t.amount,
  t.currency,
  t.category,
  t.fraud_likelihood,
  t.fraud_reason,
  t.created_at,
  s.bank_name,
  s.file_name
FROM transactions t
LEFT JOIN statements s ON t.statement_id = s.id
WHERE t.fraud_likelihood >= 0.5
ORDER BY t.fraud_likelihood DESC, t.date DESC;

-- Step 8: Add column comments
COMMENT ON COLUMN transactions.fraud_likelihood IS 'Fraud probability score from 0.0 (no risk) to 1.0 (high risk)';
COMMENT ON COLUMN transactions.fraud_reason IS 'Brief explanation of fraud assessment (e.g., "Normal spending pattern", "Unusual overseas transaction")';

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! Fraud detection fields added to transactions table.';
END $$;
