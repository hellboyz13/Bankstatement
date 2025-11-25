import { NextResponse } from 'next/server';
import { getStatements, getTransactions } from '@/lib/local-storage';

export async function GET() {
  try {
    const statements = getStatements();
    const transactions = getTransactions();

    // Add transaction count to each statement
    const formattedStatements = statements.map((s) => ({
      id: s.id,
      bank_name: s.bank_name,
      file_name: s.file_name,
      uploaded_at: s.uploaded_at,
      start_date: s.start_date,
      end_date: s.end_date,
      transaction_count: transactions.filter((t) => t.statement_id === s.id).length,
    }));

    return NextResponse.json({ statements: formattedStatements });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
