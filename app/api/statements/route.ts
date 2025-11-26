import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Fetch all statements with transaction count
    const { data: statements, error } = await supabase
      .from('statements')
      .select(`
        *,
        transactions:transactions(count)
      `)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch statements', details: error.message },
        { status: 500 }
      );
    }

    // Format response
    const formattedStatements = statements.map((s: any) => ({
      id: s.id,
      bank_name: s.bank_name,
      file_name: s.file_name,
      uploaded_at: s.uploaded_at,
      start_date: s.start_date,
      end_date: s.end_date,
      transaction_count: Array.isArray(s.transactions) ? s.transactions[0]?.count || 0 : 0,
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
