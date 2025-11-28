import { NextRequest, NextResponse } from 'next/server';
import { parsePDFStatement } from '@/lib/pdf-parser';
import { addStatement, addTransactions } from '@/lib/local-storage';

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
        {
          error: '⚠️ This doesn\'t appear to be a bank statement. Please check your file.',
          details: 'No transactions found in the PDF. Make sure you\'re uploading a valid bank statement with transaction data.',
        },
        { status: 422 }
      );
    }

    // Additional validation: Check if the statement has reasonable data
    // A valid bank statement should have dates and amounts
    const hasDateData = parsedStatement.transactions.some((t) => t.date);
    const hasAmountData = parsedStatement.transactions.some((t) => t.amount);

    if (!hasDateData || !hasAmountData) {
      return NextResponse.json(
        {
          error: '⚠️ This doesn\'t appear to be a bank statement. Please check your file.',
          details: 'The PDF doesn\'t contain expected transaction data (dates and amounts). Please upload a valid bank statement.',
        },
        { status: 422 }
      );
    }

    // Create statement record in memory
    const statementId = `stmt_${Date.now()}`;
    const statement = {
      id: statementId,
      bank_name: bankName || parsedStatement.bankName || null,
      file_name: file.name,
      start_date: parsedStatement.startDate || null,
      end_date: parsedStatement.endDate || null,
      uploaded_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };

    addStatement(statement);

    // Insert transactions in memory
    const transactions = parsedStatement.transactions.map((t, index) => ({
      id: `txn_${Date.now()}_${index}`,
      statement_id: statementId,
      date: t.date,
      description: t.description,
      amount: t.amount,
      currency: t.currency,
      balance: t.balance || null,
      category: t.category,
      created_at: new Date().toISOString(),
      bank_name: statement.bank_name,
      file_name: statement.file_name,
    }));

    addTransactions(transactions);

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

