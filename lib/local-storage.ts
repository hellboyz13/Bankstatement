// Browser localStorage implementation for persistent client-side storage
// This allows data to persist across page refreshes and server restarts

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

const TRANSACTIONS_KEY = 'bank_analyzer_transactions';
const STATEMENTS_KEY = 'bank_analyzer_statements';

// Helper to safely access localStorage (works in browser only)
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;

  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading from localStorage (${key}):`, error);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error saving to localStorage (${key}):`, error);
  }
}

export function addStatement(statement: StoredStatement) {
  const statements = getFromStorage<StoredStatement[]>(STATEMENTS_KEY, []);
  statements.push(statement);
  saveToStorage(STATEMENTS_KEY, statements);
}

export function addTransactions(transactions: StoredTransaction[]) {
  const existing = getFromStorage<StoredTransaction[]>(TRANSACTIONS_KEY, []);
  existing.push(...transactions);
  saveToStorage(TRANSACTIONS_KEY, existing);
}

export function getTransactions(): StoredTransaction[] {
  return getFromStorage<StoredTransaction[]>(TRANSACTIONS_KEY, []);
}

export function getStatements(): StoredStatement[] {
  return getFromStorage<StoredStatement[]>(STATEMENTS_KEY, []);
}

export function clearAll() {
  if (typeof window === 'undefined') return;

  localStorage.removeItem(TRANSACTIONS_KEY);
  localStorage.removeItem(STATEMENTS_KEY);
}

export function removeStatement(statementId: string) {
  const statements = getFromStorage<StoredStatement[]>(STATEMENTS_KEY, []);
  const transactions = getFromStorage<StoredTransaction[]>(TRANSACTIONS_KEY, []);

  // Remove the statement
  const filteredStatements = statements.filter(
    (stmt: StoredStatement) => stmt.id !== statementId
  );

  // Remove all transactions associated with this statement
  const filteredTransactions = transactions.filter(
    (txn: StoredTransaction) => txn.statement_id !== statementId
  );

  saveToStorage(STATEMENTS_KEY, filteredStatements);
  saveToStorage(TRANSACTIONS_KEY, filteredTransactions);
}
