import { NextRequest, NextResponse } from 'next/server';
import { processDueJobs } from '@/lib/scheduler';

async function handleCronExecution(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');

  // Verify CRON_SECRET (Standard Vercel Cron Security)
  // In production, enforce secret matching. In local development or dashboard manual triggers, allow dispatching.
  const isDashboardTrigger = req.headers.get('x-admin-trigger') === 'dashboard';
  const isDev = process.env.NODE_ENV === 'development';

  if (cronSecret && cronSecret.trim().length > 0 && !isDev && !isDashboardTrigger) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        {
          error: 'Unauthorized: Invalid CRON_SECRET authorization header.',
          hint: 'Vercel automatically sends "Authorization: Bearer <CRON_SECRET>" during scheduled runs.',
        },
        { status: 401 }
      );
    }
  }

  const startTime = Date.now();
  try {
    const summary = await processDueJobs('vercel_cron');
    const durationMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      durationMs,
      totalEvaluated: summary.totalEvaluated,
      executedCount: summary.executedCount,
      executions: summary.results.map((r) => ({
        id: r.id,
        jobId: r.jobId,
        jobName: r.jobName,
        status: r.status,
        durationMs: r.durationMs,
        documentsProcessed: r.documentsProcessed,
        aiModel: r.aiModel,
        tokens: r.gatewayMetrics?.totalTokens,
      })),
      infrastructure: 'Vercel Cron & Workflow Dispatcher',
    });
  } catch (error) {
    console.error('Vercel Cron Dispatcher failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown execution error',
        durationMs: Date.now() - startTime,
      },
      { status: 500 }
    );
  }
}

// Vercel Cron triggers GET requests by default
export async function GET(req: NextRequest) {
  return handleCronExecution(req);
}

// POST is also supported for manual or automated pipeline invocations
export async function POST(req: NextRequest) {
  return handleCronExecution(req);
}
