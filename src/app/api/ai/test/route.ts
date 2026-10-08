import { NextRequest, NextResponse } from 'next/server';
import { executeAiGatewayJob } from '@/lib/ai-gateway';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const model = body.model || 'openai/gpt-4o-mini';
    const testPrompt = body.prompt || 'Provide a 2-sentence confirmation of Vercel AI Gateway connectivity and operational status.';

    const result = await executeAiGatewayJob({
      systemPrompt: 'You are a system health verifier for Vercel AI Gateway.',
      userPrompt: testPrompt,
      contextDocuments: [{ service: 'Vercel AI Gateway', status: 'testing', timestamp: new Date().toISOString() }],
      model,
    });

    return NextResponse.json({
      success: result.success,
      result,
      env: {
        hasGatewayUrl: Boolean(process.env.VERCEL_AI_GATEWAY_URL || process.env.AI_GATEWAY_URL),
        hasApiKey: Boolean(process.env.AI_GATEWAY_TOKEN || process.env.OPENAI_API_KEY || process.env.VERCEL_AI_GATEWAY_KEY),
      },
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'AI test failed' },
      { status: 500 }
    );
  }
}
