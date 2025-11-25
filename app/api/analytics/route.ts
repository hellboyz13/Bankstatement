import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = supabase.from('transactions').select('*');

    if (startDate) {
      query = query.gte('date', startDate);
    }

    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data: transactions, error } = await query;

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch analytics', details: error.message },
        { status: 500 }
      );
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
