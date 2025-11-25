import { NextRequest, NextResponse } from 'next/server';
import { signUpUser } from '@/lib/supabase-auth';

// Password validation
function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  // Check for special character
  const specialCharRegex = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/;
  if (!specialCharRegex.test(password)) {
    return {
      valid: false,
      error: 'Password must contain at least one special character (!@#$%^&*...)',
    };
  }

  return { valid: true };
}

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { error: passwordValidation.error },
        { status: 400 }
      );
    }

    // Create new user via Supabase
    const newUser = await signUpUser(email, password);

    return NextResponse.json({
      success: true,
      user: newUser,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    if (message.includes('already exists') || message.includes('duplicate')) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    console.error('Signup error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
