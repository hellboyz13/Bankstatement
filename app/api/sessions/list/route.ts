import { NextRequest, NextResponse } from 'next/server';
import { getUserSessions } from '@/lib/session-manager';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get('userId');

    console.log('[API /sessions/list] Received request for userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { error: 'Missing userId parameter' },
        { status: 400 }
      );
    }

    // Check if this is a demo user (localhost or Google demo)
    const isDemoUser = userId === 'demo-user-localhost' || userId.startsWith('google_user_');

    if (isDemoUser) {
      console.log('[API /sessions/list] Demo user detected - sessions stored in localStorage');
      // For demo users, return empty array
      // The client will read from localStorage directly
      return NextResponse.json({
        success: true,
        sessions: [],
        isDemo: true,
      });
    }

    console.log('[API /sessions/list] Calling getUserSessions for real user...');
    const sessions = await getUserSessions(userId);
    console.log('[API /sessions/list] getUserSessions returned:', sessions.length, 'sessions');

    return NextResponse.json({
      success: true,
      sessions,
    });
  } catch (error) {
    console.error('[API /sessions/list] Error fetching sessions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
