// TypeScript types for Supabase database
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      statements: {
        Row: {
          id: string
          bank_name: string | null
          uploaded_at: string
          start_date: string | null
          end_date: string | null
          file_name: string | null
          created_at: string
        }
        Insert: {
          id?: string
          bank_name?: string | null
          uploaded_at?: string
          start_date?: string | null
          end_date?: string | null
          file_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          bank_name?: string | null
          uploaded_at?: string
          start_date?: string | null
          end_date?: string | null
          file_name?: string | null
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          statement_id: string | null
          date: string
          description: string
          amount: number
          currency: string | null
          balance: number | null
          category: string | null
          fraud_likelihood: number | null
          fraud_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          statement_id?: string | null
          date: string
          description: string
          amount: number
          currency?: string | null
          balance?: number | null
          category?: string | null
          fraud_likelihood?: number | null
          fraud_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          statement_id?: string | null
          date?: string
          description?: string
          amount?: number
          currency?: string | null
          balance?: number | null
          category?: string | null
          fraud_likelihood?: number | null
          fraud_reason?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      transaction_summaries: {
        Row: {
          id: string | null
          statement_id: string | null
          date: string | null
          description: string | null
          amount: number | null
          currency: string | null
          balance: number | null
          category: string | null
          fraud_likelihood: number | null
          fraud_reason: string | null
          created_at: string | null
          bank_name: string | null
          file_name: string | null
        }
      }
    }
  }
}

// Helper types for easier usage
export type Statement = Database['public']['Tables']['statements']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
export type StatementInsert = Database['public']['Tables']['statements']['Insert'];
