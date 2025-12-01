-- Migration: Add fraud detection fields to transactions table
-- Run this SQL in your Supabase SQL Editor

-- Add fraud_likelihood column (0.0 to 1.0)
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS fraud_likelihood DECIMAL(3, 2) DEFAULT 0.0 CHECK (fraud_likelihood >= 0 AND fraud_likelihood <= 1);

-- Add fraud_reason column
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS fraud_reason TEXT;

-- Create index for fraud queries
CREATE INDEX IF NOT EXISTS idx_transactions_fraud_likelihood ON transactions(fraud_likelihood DESC);

-- Update the transaction_summaries view to include fraud fields
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

-- Optional: Create a view for high-risk transactions (fraud_likelihood >= 0.5)
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

-- Add comment to explain fraud_likelihood scale
COMMENT ON COLUMN transactions.fraud_likelihood IS 'Fraud probability score from 0.0 (no risk) to 1.0 (high risk)';
COMMENT ON COLUMN transactions.fraud_reason IS 'Brief explanation of fraud assessment (e.g., "Normal spending pattern", "Unusual overseas transaction")';
