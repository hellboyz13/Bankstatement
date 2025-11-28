import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { parsePDFStatement } from '@/lib/pdf-parser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const bankName = formData.get('bankName') as string | null;

    // Validate file
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF files are allowed.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF and extract transactions
    let parsedStatement;
    try {
      parsedStatement = await parsePDFStatement(buffer);
    } catch (parseError) {
      return NextResponse.json(
        {
          error: 'Failed to parse PDF',
          details: parseError instanceof Error ? parseError.message : 'Unknown error',
        },
        { status: 422 }
      );
    }

    if (parsedStatement.transactions.length === 0) {
      return NextResponse.json(
        { error: 'No transactions found in PDF' },
        { status: 422 }
      );
    }

    // Create statement record
    const { data: statement, error: statementError } = await supabase
      .from('statements')
      .insert({
        bank_name: bankName || parsedStatement.bankName || null,
        file_name: file.name,
        start_date: parsedStatement.startDate || null,
        end_date: parsedStatement.endDate || null,
      })
      .select()
      .single();

    if (statementError) {
      return NextResponse.json(
        { error: 'Failed to save statement', details: statementError.message },
        { status: 500 }
      );
    }

    // Insert transactions
    const transactionsToInsert = parsedStatement.transactions.map((t) => ({
      statement_id: statement.id,
      date: t.date,
      description: t.description,
      amount: t.amount,
      currency: t.currency,
      balance: t.balance || null,
      category: t.category,
    }));

    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .insert(transactionsToInsert)
      .select();

    if (transactionsError) {
      // Rollback: delete the statement
      await supabase.from('statements').delete().eq('id', statement.id);

      return NextResponse.json(
        { error: 'Failed to save transactions', details: transactionsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      statement: {
        id: statement.id,
        bank_name: statement.bank_name,
        file_name: statement.file_name,
        start_date: statement.start_date,
        end_date: statement.end_date,
        transaction_count: transactions.length,
      },
      transactions: transactions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
