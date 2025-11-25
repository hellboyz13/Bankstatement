import { NextRequest, NextResponse } from 'next/server';
import { renameSession } from '@/lib/session-manager';

export async function PATCH(request: NextRequest) {
  try {
    const { sessionId, newFilename, userId } = await request.json();

    if (!sessionId || !newFilename || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, newFilename, userId' },
        { status: 400 }
      );
    }

    const session = await renameSession(sessionId, newFilename, userId);

    if (!session) {
      return NextResponse.json(
        { error: 'Failed to rename session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      session,
    });
  } catch (error) {
    console.error('Error renaming session:', error);
    return NextResponse.json(
      {
        error: 'Failed to rename session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
