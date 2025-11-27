import { NextRequest, NextResponse } from 'next/server';
import { removeStatement } from '@/lib/local-storage';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { statementId } = body;

    if (!statementId) {
      return NextResponse.json(
        { error: 'Missing statementId' },
        { status: 400 }
      );
    }

    console.log('[Remove Statement] Removing statement:', statementId);

    // Remove the statement and its transactions
    removeStatement(statementId);

    console.log('[Remove Statement] Statement removed successfully');

    return NextResponse.json({
      success: true,
      message: 'Statement removed successfully'
    });
  } catch (error) {
    console.error('[Remove Statement] Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove statement' },
      { status: 500 }
    );
  }
}
