import { NextRequest, NextResponse } from 'next/server';
import { signInUser } from '@/lib/supabase-auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await signInUser(email, password);

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('Invalid') || message.includes('not found')) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    console.error('Login error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
