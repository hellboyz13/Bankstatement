import { NextRequest, NextResponse } from 'next/server';
import { getTransactions } from '@/lib/local-storage';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const statementId = searchParams.get('statementId');

    // Get transactions from localStorage
    let transactions = getTransactions();

    // Filter by statement ID if specified
    if (statementId) {
      transactions = transactions.filter((t) => t.statement_id === statementId);
    }

    // Apply date filters
    if (startDate) {
      transactions = transactions.filter((t) => t.date >= startDate);
    }

    if (endDate) {
      transactions = transactions.filter((t) => t.date <= endDate);
    }

    // Calculate analytics
    const income = transactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const expenses = Math.abs(
      transactions
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0)
    );

    // Group by category
    const byCategory: Record<string, number> = {};
    transactions
      .filter((t) => t.amount < 0) // Only expenses
      .forEach((t) => {
        const category = t.category || 'Miscellaneous';
        byCategory[category] =
          (byCategory[category] || 0) + Math.abs(parseFloat(t.amount.toString()));
      });

    // Group by month
    const byMonth: Record<string, { income: number; expenses: number }> = {};
    transactions.forEach((t) => {
      const month = t.date.substring(0, 7); // YYYY-MM
      if (!byMonth[month]) {
        byMonth[month] = { income: 0, expenses: 0 };
      }

      const amount = parseFloat(t.amount.toString());
      if (amount > 0) {
        byMonth[month].income += amount;
      } else {
        byMonth[month].expenses += Math.abs(amount);
      }
    });

    return NextResponse.json({
      summary: {
        totalIncome: income,
        totalExpenses: expenses,
        netSavings: income - expenses,
        transactionCount: transactions.length,
      },
      byCategory,
      byMonth,
    });
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
