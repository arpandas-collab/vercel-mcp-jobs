import { NextRequest, NextResponse } from 'next/server';
import { getJobById, saveJobRecord, deleteJobRecord } from '@/lib/mongodb';
import { calculateNextRun } from '@/lib/scheduler';

export async function GET(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const job = await getJobById(params.id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, job });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const job = await getJobById(params.id);
    if (!job) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }

    const updates = await req.json();

    if (updates.cronExpression && updates.cronExpression !== job.cronExpression) {
      job.cronExpression = updates.cronExpression;
      job.nextRunAt = calculateNextRun(updates.cronExpression);
    }

    if (updates.status !== undefined) job.status = updates.status;
    if (updates.name !== undefined) job.name = updates.name;
    if (updates.description !== undefined) job.description = updates.description;
    if (updates.taskType !== undefined) job.taskType = updates.taskType;
    if (updates.targetCollection !== undefined) job.targetCollection = updates.targetCollection;
    if (updates.outputCollection !== undefined) job.outputCollection = updates.outputCollection;
    if (updates.systemPrompt !== undefined) job.systemPrompt = updates.systemPrompt;
    if (updates.userPromptTemplate !== undefined) job.userPromptTemplate = updates.userPromptTemplate;
    if (updates.model !== undefined) job.model = updates.model;
    if (updates.temperature !== undefined) job.temperature = updates.temperature;

    job.updatedAt = new Date().toISOString();
    const saved = await saveJobRecord(job);
    return NextResponse.json({ success: true, job: saved });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const deleted = await deleteJobRecord(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Job deleted successfully' });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Error' },
      { status: 500 }
    );
  }
}
