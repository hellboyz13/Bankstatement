import { NextRequest, NextResponse } from 'next/server';
import { incrementUploadCount } from '@/lib/supabase-auth';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Check if this is a localhost demo user
    if (userId === 'demo-user-localhost') {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - upload count tracked locally',
      });
    }

    // For other users, check if they exist in Supabase by looking up their email
    const { supabase } = await import('@/lib/supabase');
    const { data: userCheck } = await supabase
      .from('users')
      .select('email')
      .eq('id', userId)
      .maybeSingle();

    // If user has google-demo.com email or localhost.dev, they're a demo user
    if (userCheck && (
      userCheck.email?.includes('@google-demo.com') ||
      userCheck.email?.includes('@localhost.dev')
    )) {
      return NextResponse.json({
        success: true,
        message: 'Demo mode - upload count tracked locally',
      });
    }

    await incrementUploadCount(userId);

    // Fetch updated user to return
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!userData) {
      throw new Error('User not found after increment');
    }

    const updatedUser = {
      id: userData.id,
      email: userData.email,
      plan: userData.plan,
      uploadCount: userData.upload_count,
      createdAt: userData.created_at,
      lastLogin: userData.last_login,
    };

    return NextResponse.json({
      success: true,
      user: updatedUser,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error';

    console.error('Increment upload error:', error);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
