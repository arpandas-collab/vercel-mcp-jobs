import { NextRequest, NextResponse } from 'next/server';
import { executeScheduledJob } from '@/lib/scheduler';

export async function POST(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const body = await req.json().catch(() => ({}));
    const triggeredBy = body.triggeredBy || 'manual';

    const execution = await executeScheduledJob(params.id, triggeredBy);
    return NextResponse.json({
      success: execution.status === 'success',
      execution,
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Job execution failed',
      },
      { status: 500 }
    );
  }
}
