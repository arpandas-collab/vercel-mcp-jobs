import { NextRequest, NextResponse } from 'next/server';
import { getRecentExecutions } from '@/lib/mongodb';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Number(searchParams.get('limit')) || 50;
    const jobId = searchParams.get('jobId');

    const history = await getRecentExecutions(limit);
    const filtered = jobId ? history.filter((h) => h.jobId === jobId) : history;

    return NextResponse.json({
      success: true,
      count: filtered.length,
      executions: filtered,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error fetching execution history' },
      { status: 500 }
    );
  }
}
