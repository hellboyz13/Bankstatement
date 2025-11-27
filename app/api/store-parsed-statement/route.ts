import { NextRequest, NextResponse } from 'next/server';
import { addStatement, addTransactions } from '@/lib/local-storage';
import type { ParsedStatement } from '@/lib/types/parsed-statement';
import { categorizeTransaction } from '@/lib/categorization';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { parsedStatement, fileName }: { parsedStatement: ParsedStatement; fileName: string } = body;

    if (!parsedStatement || !parsedStatement.transactions) {
      return NextResponse.json(
        { error: 'Missing parsed statement data' },
        { status: 400 }
      );
    }

    console.log(`[StoreParsed] Storing ${parsedStatement.transactions.length} transactions from ${fileName}`);

    // Create statement record
    const statementId = `stmt_${Date.now()}`;

    // Extract date range from transactions
    const dates = parsedStatement.transactions.map(t => new Date(t.date));
    const startDate = dates.length > 0
      ? new Date(Math.min(...dates.map(d => d.getTime()))).toISOString().split('T')[0]
      : null;
    const endDate = dates.length > 0
      ? new Date(Math.max(...dates.map(d => d.getTime()))).toISOString().split('T')[0]
      : null;

    const statement = {
      id: statementId,
      bank_name: parsedStatement.meta.bank_name,
      file_name: fileName,
      start_date: startDate,
      end_date: endDate,
      uploaded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    addStatement(statement);

    // Convert parsed transactions to local storage format
    const transactions = parsedStatement.transactions.map((t, index) => ({
      id: `txn_${Date.now()}_${index}`,
      statement_id: statementId,
      date: t.date,
      description: t.description,
      amount: t.amount,
      currency: t.currency || parsedStatement.meta.currency || 'SGD',
      balance: t.balance || null,
      // Use AI-assigned category if available, otherwise fall back to keyword-based categorization
      category: t.category || categorizeTransaction(t.description, t.amount),
      created_at: new Date().toISOString(),
      bank_name: statement.bank_name,
      file_name: statement.file_name,
    }));

    addTransactions(transactions);

    console.log(`[StoreParsed] Successfully stored ${transactions.length} transactions`);

    return NextResponse.json({
      success: true,
      statement: {
        id: statement.id,
        bank_name: statement.bank_name,
        file_name: statement.file_name,
        start_date: statement.start_date,
        end_date: statement.end_date,
        transaction_count: transactions.length,
      },
      transactions,
    });
  } catch (error) {
    console.error('[StoreParsed] Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to store parsed statement',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
