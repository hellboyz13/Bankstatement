import { NextRequest, NextResponse } from 'next/server';
import { createSession } from '@/lib/session-manager';

export async function POST(request: NextRequest) {
  try {
    const { userId, filename, transactions, statementStartDate, statementEndDate } = await request.json();

    // Validate required fields
    if (!userId || !filename || !Array.isArray(transactions)) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, filename, transactions' },
        { status: 400 }
      );
    }

    // Create session in Supabase
    const session = await createSession(
      userId,
      filename,
      transactions,
      statementStartDate,
      statementEndDate
    );

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to create session in database' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      {
        error: 'Failed to create session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
