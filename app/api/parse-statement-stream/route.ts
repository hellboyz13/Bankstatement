import { NextRequest } from 'next/server';
import { parsePDFToText } from '@/lib/pdf-parser';
import { parseBankStatementWithProgress } from '@/lib/claudeParserStream';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No file provided' })}\n\n`));
          controller.close();
          return;
        }

        // Send initial status
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'status',
          message: 'Reading PDF...',
          progress: 0
        })}\n\n`));

        // Extract text from PDF
        const buffer = Buffer.from(await file.arrayBuffer());
        const extractedText = await parsePDFToText(buffer);
        const pages = extractedText.split('\n\n--- PAGE BREAK ---\n\n').filter(p => p.trim());

        // Estimate time (23 seconds per page based on your data)
        const estimatedTimePerPage = 23000; // milliseconds
        const totalEstimatedTime = pages.length * estimatedTimePerPage;

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'estimate',
          pages: pages.length,
          estimatedTime: totalEstimatedTime,
          message: `Processing ${pages.length} page(s)...`,
          progress: 5
        })}\n\n`));

        // Parse with progress updates
        const parsedStatement = await parseBankStatementWithProgress(
          pages,
          (progress) => {
            // Send progress update
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'progress',
              ...progress
            })}\n\n`));
          }
        );

        // Send final result
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'complete',
          statement: parsedStatement,
          progress: 100,
          message: 'Parsing complete!'
        })}\n\n`));

        controller.close();
      } catch (error) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({
          type: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        })}\n\n`));
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
