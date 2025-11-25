// Global in-memory storage for local testing (no database required)
// This allows testing the app without Supabase

interface StoredTransaction {
  id: string;
  statement_id: string;
  date: string;
  description: string;
  amount: number;
  currency: string;
  balance: number | null;
  category: string;
  created_at: string;
  bank_name: string | null;
  file_name: string | null;
}

interface StoredStatement {
  id: string;
  bank_name: string | null;
  file_name: string;
  uploaded_at: string;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
}

// Declare global type
declare global {
  var localTransactions: any[] | undefined;
  var localStatements: any[] | undefined;
}

// Initialize if not exists
if (typeof global !== 'undefined') {
  if (!global.localTransactions) {
    global.localTransactions = [];
  }
  if (!global.localStatements) {
    global.localStatements = [];
  }
}

export function addStatement(statement: StoredStatement) {
  if (!global.localStatements) {
    global.localStatements = [];
  }
  global.localStatements.push(statement);
}

export function addTransactions(transactions: StoredTransaction[]) {
  if (!global.localTransactions) {
    global.localTransactions = [];
  }
  global.localTransactions.push(...transactions);
}

export function getTransactions(): StoredTransaction[] {
  return global.localTransactions || [];
}

export function getStatements(): StoredStatement[] {
  return global.localStatements || [];
}

export function clearAll() {
  global.localTransactions = [];
  global.localStatements = [];
}
