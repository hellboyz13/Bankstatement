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

    // Check if this is a demo user (localhost or Google demo)
    const isDemoUser = userId === 'demo-user-localhost' || userId.startsWith('google_user_');

    if (isDemoUser) {
      console.log('[API /sessions/create] Demo user detected - saving locally');

      // For demo users, create a mock session object to return
      // The actual saving happens on the client side to localStorage
      const mockSession = {
        id: `session_${Date.now()}`,
        user_id: userId,
        filename,
        transaction_count: transactions.length,
        statement_start_date: statementStartDate || null,
        statement_end_date: statementEndDate || null,
        transactions_data: transactions,
        upload_date: new Date().toISOString(),
        modified_date: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        session: mockSession,
        isDemo: true,
      });
    }

    console.log('[API /sessions/create] Calling createSession for real user...');

    // Create session in Supabase for real users
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
