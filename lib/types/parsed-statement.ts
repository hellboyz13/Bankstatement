/**
 * Types for Claude-parsed bank statements
 */

export interface ParsedStatementMeta {
  bank_name: string | null;
  country: string | null;
  account_type: 'current' | 'savings' | 'credit_card' | 'unknown';
  currency: string | null;
}

export interface ParsedTransaction {
  date: string; // YYYY-MM-DD
  posting_date: string | null;
  description: string;
  amount: number;
  currency: string | null;
  type: 'debit' | 'credit' | 'payment' | 'fee' | 'interest' | 'refund' | 'unknown';
  balance?: number | null;
  raw_lines?: string[];
  category?: string;
  category_confidence?: number;
}

export interface ParsedStatement {
  meta: ParsedStatementMeta;
  transactions: ParsedTransaction[];
}

export interface ClaudePageResponse {
  meta: ParsedStatementMeta;
  transactions: ParsedTransaction[];
}
