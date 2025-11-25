import { NextRequest, NextResponse } from 'next/server';
import { getOrCreateDemoUser } from '@/lib/supabase-auth';

export async function POST(request: NextRequest) {
  try {
    // Parse request body to get isPremium flag
    let isPremium = false;
    try {
      const body = await request.json();
      isPremium = body.isPremium === true;
    } catch {
      // If body parsing fails, default to free
      isPremium = false;
    }

    // Create or get demo Google user via Supabase
    const user = await getOrCreateDemoUser(isPremium);

    return NextResponse.json({
      success: true,
      user,
      message: `Signed up as ${user.email}`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    console.error('Google signup error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
