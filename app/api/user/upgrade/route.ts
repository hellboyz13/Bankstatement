import { NextRequest, NextResponse } from 'next/server';
import { upgradeToPremium } from '@/lib/supabase-auth';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const updatedUser = await upgradeToPremium(userId);

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    console.error('Upgrade error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
