import { NextRequest, NextResponse } from 'next/server';

// Import from upload-local to access the same in-memory storage
// Note: This is a simple approach for testing. In production, use a proper database.

// We'll create a simple global store
declare global {
  var localTransactions: any[] | undefined;
}

if (!global.localTransactions) {
  global.localTransactions = [];
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const category = searchParams.get('category');
    const statementId = searchParams.get('statementId');

    // Get all transactions from global store
    let transactions = [...(global.localTransactions || [])];

    // Filter by statement ID if specified
    if (statementId) {
      transactions = transactions.filter((t) => t.statement_id === statementId);
    }

    // Apply filters
    if (startDate) {
      transactions = transactions.filter((t) => t.date >= startDate);
    }

    if (endDate) {
      transactions = transactions.filter((t) => t.date <= endDate);
    }

    if (category && category !== 'all') {
      transactions = transactions.filter((t) => t.category === category);
    }

    // Sort by date descending
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// POST endpoint to add transactions (used by upload-local)
export async function POST(request: NextRequest) {
  try {
    const { transactions } = await request.json();

    if (!global.localTransactions) {
      global.localTransactions = [];
    }

    global.localTransactions.push(...transactions);

    return NextResponse.json({ success: true, count: transactions.length });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
