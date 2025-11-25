import { NextResponse } from 'next/server';
import { clearAll } from '@/lib/local-storage';

export async function POST() {
  try {
    clearAll();
    console.log('✅ Cleared all local data');
    return NextResponse.json({ success: true, message: 'Data cleared' });
  } catch (error) {
    console.error('Error clearing data:', error);
    return NextResponse.json(
      { error: 'Failed to clear data' },
      { status: 500 }
    );
  }
}
