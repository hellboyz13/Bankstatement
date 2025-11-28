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
    const isDemoUser = userId === 'demo-user-localhost' || userId.startsWith('google_user_');

    if (isDemoUser) {
      // For demo users, just return success without updating Supabase
      // The upload count is tracked locally in localStorage via AuthContext
      return NextResponse.json({
        success: true,
        message: 'Demo mode - upload count tracked locally',
      });
    }

    await incrementUploadCount(userId);

    // Fetch updated user to return
    const { supabase } = await import('@/lib/supabase');
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
