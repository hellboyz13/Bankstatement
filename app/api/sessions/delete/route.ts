import { NextRequest, NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session-manager';

export async function DELETE(request: NextRequest) {
  try {
    const sessionId = request.nextUrl.searchParams.get('sessionId');
    const userId = request.nextUrl.searchParams.get('userId');

    if (!sessionId || !userId) {
      return NextResponse.json(
        { error: 'Missing sessionId or userId parameter' },
        { status: 400 }
      );
    }

    const success = await deleteSession(sessionId, userId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete session' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Session deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting session:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
