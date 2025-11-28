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
  const timings: Record<string, number> = {};
  const startTotal = Date.now();

  try {
    // Parse form data
    const startFormData = Date.now();
    const formData = await request.formData();
    const file = formData.get('file') as File;
    timings.formData = Date.now() - startFormData;

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
    const startBuffer = Date.now();
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    timings.buffer = Date.now() - startBuffer;

    // Extract text from PDF per page
    const startPdfExtract = Date.now();
    const pdf = await getPdfParse();
    const data = await pdf(buffer);
    timings.pdfExtraction = Date.now() - startPdfExtract;

    // Split text by page breaks (pdf-parse concatenates all pages)
    const startPageSplit = Date.now();
    const pages = data.text.split('\f').filter((page) => page.trim().length > 0);
    timings.pageSplit = Date.now() - startPageSplit;

    console.log(`[TIMING] PDF has ${pages.length} pages, file size: ${(file.size / 1024).toFixed(2)}KB`);

    if (pages.length === 0) {
      return NextResponse.json(
        { error: 'No text content found in PDF' },
        { status: 422 }
      );
    }

    // Parse using GPT-4o-mini in a single call
    const startAiParsing = Date.now();
    const parsedStatement = await parseBankStatementWithClaude(pages);
    timings.aiParsing = Date.now() - startAiParsing;

    timings.total = Date.now() - startTotal;

    console.log('[TIMING] Performance breakdown:');
    console.log(`  - Form data parsing: ${timings.formData}ms`);
    console.log(`  - Buffer conversion: ${timings.buffer}ms`);
    console.log(`  - PDF extraction: ${timings.pdfExtraction}ms`);
    console.log(`  - Page splitting: ${timings.pageSplit}ms`);
    console.log(`  - AI parsing: ${timings.aiParsing}ms`);
    console.log(`  - TOTAL: ${timings.total}ms`);

    if (parsedStatement.transactions.length === 0) {
      return NextResponse.json(
        {
          error: '⚠️ No transactions found in the PDF',
          details: 'The AI parser could not identify any valid transactions. Please ensure this is a bank statement with transaction data.',
        },
        { status: 422 }
      );
    }

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
      _timings: timings,
    });
  } catch (error) {
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

    if (error instanceof Error && error.message.includes('OPENAI_API_KEY')) {
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
