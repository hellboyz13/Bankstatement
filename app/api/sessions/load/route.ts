import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { addStatement, addTransactions, clearAll } from '@/lib/local-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const sessionId = searchParams.get('sessionId');
    const userId = searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing sessionId or userId' },
        { status: 400 }
      );
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch the session from Supabase
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching session:', error);
      return NextResponse.json(
        { error: 'Failed to load session', details: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    console.log('[Load Session] Loading session:', sessionId);
    console.log('[Load Session] Transaction count:', data.transactions_data?.length || 0);

    // Clear existing local storage
    clearAll();

    // Create statement record in local storage
    const statementId = `stmt_${Date.now()}`;
    const statement = {
      id: statementId,
      bank_name: data.transactions_data[0]?.bank_name || null,
      file_name: data.filename,
      start_date: data.statement_start_date || null,
      end_date: data.statement_end_date || null,
      uploaded_at: data.upload_date,
      created_at: data.upload_date,
    };

    addStatement(statement);

    // Add transactions to local storage
    const transactions = data.transactions_data.map((t: any, index: number) => ({
      id: `txn_${Date.now()}_${index}`,
      statement_id: statementId,
      date: t.date,
      description: t.description,
      amount: t.amount,
      currency: t.currency,
      balance: t.balance || null,
      category: t.category,
      created_at: new Date().toISOString(),
      bank_name: t.bank_name,
      file_name: statement.file_name,
    }));

    addTransactions(transactions);

    console.log('[Load Session] Successfully loaded session to local storage');

    return NextResponse.json({
      success: true,
      session: {
        id: data.id,
        filename: data.filename,
        transaction_count: transactions.length,
        statement_start_date: data.statement_start_date,
        statement_end_date: data.statement_end_date,
      },
      statement: {
        id: statement.id,
        bank_name: statement.bank_name,
        file_name: statement.file_name,
        start_date: statement.start_date,
        end_date: statement.end_date,
        transaction_count: transactions.length,
      },
    });
  } catch (error) {
    console.error('[Load Session] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
