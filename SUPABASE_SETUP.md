# Supabase Database Setup Guide

## Step 1: Go to Supabase SQL Editor

1. Visit your Supabase dashboard: https://app.supabase.com
2. Select your project "bank-statement-analyzer"
3. Click **SQL Editor** on the left sidebar
4. Click **New Query**

## Step 2: Create Tables

Copy and paste the SQL below into the SQL Editor, then click **Run**:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  plan VARCHAR(50) DEFAULT 'free',
  upload_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create bank_statements table
CREATE TABLE IF NOT EXISTS bank_statements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255),
  upload_date TIMESTAMP DEFAULT NOW(),
  start_date DATE,
  end_date DATE,
  transaction_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  statement_id UUID NOT NULL REFERENCES bank_statements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  currency VARCHAR(10),
  balance DECIMAL(15, 2),
  category VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_statements_user ON bank_statements(user_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);
CREATE INDEX idx_transactions_statement ON transactions(statement_id);
CREATE INDEX idx_transactions_date ON transactions(date);
CREATE INDEX idx_transactions_category ON transactions(category);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read own statements" ON bank_statements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can read own transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);
```

## Step 3: Verify Tables Were Created

In the SQL Editor, run:
```sql
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public';
```

You should see:
- users
- bank_statements
- transactions

## Step 4: Environment Variables

Your `.env.local` file has been created with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=https://zwfureyplcojtccshcxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## What's Next?

Once tables are created:
1. **Update AuthContext** to use Supabase Auth
2. **Update API routes** to save data to Supabase
3. **Update Dashboard** to fetch data from Supabase
4. **Add file upload** to Supabase Storage (optional)

Let me know when your tables are created and I'll integrate the app!
