import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session-manager';

export async function POST(request: NextRequest) {
  try {
    const { userId, filename, transactions, statementStartDate, statementEndDate } = await request.json();

    console.log('[API /sessions/create] Received request:', { userId, filename, transactionCount: transactions?.length });

    // Validate required fields
    if (!userId || !filename || !Array.isArray(transactions)) {
      console.error('[API /sessions/create] Validation failed:', { userId: !!userId, filename: !!filename, transactionsIsArray: Array.isArray(transactions) });
      return NextResponse.json(
        { error: 'Missing required fields: userId, filename, transactions' },
        { status: 400 }
      );
    }

    console.log('[API /sessions/create] Calling createSession...');

    // Create session in Supabase
    const session = await createSession(
      userId,
      filename,
      transactions,
      statementStartDate,
      statementEndDate
    );

    if (!session) {
      console.error('[API /sessions/create] createSession returned null');
      return NextResponse.json(
        { error: 'Failed to create session in database' },
        { status: 500 }
      );
    }

    console.log('[API /sessions/create] Session created successfully:', session.id);

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('[API /sessions/create] Error creating session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
