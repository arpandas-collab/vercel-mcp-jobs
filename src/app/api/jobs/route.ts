import { NextRequest, NextResponse } from 'next/server';
import { getAllJobs, saveJobRecord } from '@/lib/mongodb';
import { calculateNextRun } from '@/lib/scheduler';
import { ScheduledJob } from '@/types';

export async function GET() {
  try {
    const jobs = await getAllJobs();
    return NextResponse.json({ success: true, count: jobs.length, jobs });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      name,
      description,
      cronExpression,
      taskType,
      targetCollection,
      outputCollection,
      systemPrompt,
      userPromptTemplate,
      model,
      temperature,
    } = body;

    if (!name || !cronExpression || !targetCollection) {
      return NextResponse.json(
        { success: false, error: 'Name, cronExpression, and targetCollection are required.' },
        { status: 400 }
      );
    }

    const nextRunAt = calculateNextRun(cronExpression);
    const newJob: ScheduledJob = {
      id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      description: description || `Scheduled AI task for ${targetCollection}`,
      cronExpression,
      status: 'active',
      taskType: taskType || 'ai_data_summary',
      targetCollection,
      outputCollection: outputCollection || 'ai_summaries',
      systemPrompt: systemPrompt || 'You are an intelligent business operations AI.',
      userPromptTemplate: userPromptTemplate || 'Analyze the attached documents and highlight key trends:',
      model: model || 'openai/gpt-4o-mini',
      temperature: typeof temperature === 'number' ? temperature : 0.4,
      totalRuns: 0,
      nextRunAt,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const saved = await saveJobRecord(newJob);
    return NextResponse.json({ success: true, job: saved }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Failed to create job' },
      { status: 500 }
    );
  }
}
