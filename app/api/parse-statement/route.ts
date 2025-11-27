import { NextRequest, NextResponse } from 'next/server';
import { parseBankStatementWithClaude } from '@/lib/claudeParser';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['application/pdf'];

// Use dynamic import for pdf-parse (CommonJS module)
const getPdfParse = async () => {
  const pdfParse = await import('pdf-parse');
  return pdfParse.default;
};

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

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

    console.log(`[ParseStatement] Processing PDF: ${file.name} (${file.size} bytes)`);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract text from PDF per page
    const pdf = await getPdfParse();
    const data = await pdf(buffer);

    // Split text by page breaks (pdf-parse concatenates all pages)
    // We'll use form feed character (\f) as page delimiter which pdf-parse usually inserts
    const pages = data.text.split('\f').filter((page) => page.trim().length > 0);

    console.log(`[ParseStatement] Extracted ${pages.length} pages from PDF`);

    if (pages.length === 0) {
      return NextResponse.json(
        { error: 'No text content found in PDF' },
        { status: 422 }
      );
    }

    // Log first page preview
    console.log('[ParseStatement] First page preview:', pages[0].substring(0, 500));

    // Parse using Claude
    const parsedStatement = await parseBankStatementWithClaude(pages);

    if (parsedStatement.transactions.length === 0) {
      return NextResponse.json(
        {
          error: '⚠️ No transactions found in the PDF',
          details: 'The AI parser could not identify any valid transactions. Please ensure this is a bank statement with transaction data.',
        },
        { status: 422 }
      );
    }

    console.log(`[ParseStatement] Successfully parsed ${parsedStatement.transactions.length} transactions`);

    return NextResponse.json({
      success: true,
      statement: parsedStatement,
      meta: {
        bank_name: parsedStatement.meta.bank_name,
        country: parsedStatement.meta.country,
        account_type: parsedStatement.meta.account_type,
        currency: parsedStatement.meta.currency,
        transaction_count: parsedStatement.transactions.length,
        file_name: file.name,
      },
    });
  } catch (error) {
    console.error('[ParseStatement] Error:', error);

    // Handle specific error types
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Failed to parse AI response',
          details: 'The AI returned invalid JSON. Please try again or contact support.',
        },
        { status: 500 }
      );
    }

    if (error instanceof Error && error.message.includes('ANTHROPIC_API_KEY')) {
      return NextResponse.json(
        {
          error: 'Configuration error',
          details: 'AI service is not configured. Please contact support.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
