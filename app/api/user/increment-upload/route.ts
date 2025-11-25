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

    await incrementUploadCount(userId);

    // Fetch updated user to return
    const { supabase } = await import('@/lib/supabase');
    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      throw new Error(error.message);
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
