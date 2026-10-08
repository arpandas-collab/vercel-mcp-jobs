import { CronExpressionParser } from 'cron-parser';
import {
  getAllJobs,
  getJobById,
  saveJobRecord,
  recordExecution,
  fetchCollectionDocs,
  insertCollectionDoc,
} from './mongodb';
import { executeAiGatewayJob } from './ai-gateway';
import { ScheduledJob, JobExecution } from '@/types';

export function calculateNextRun(cronExpression: string): string | undefined {
  try {
    const interval = CronExpressionParser.parse(cronExpression, { currentDate: new Date() });
    return interval.next().toDate().toISOString();
  } catch (err) {
    console.error('Failed to parse cron expression:', cronExpression, err);
    return undefined;
  }
}

export function isJobDue(job: ScheduledJob): boolean {
  if (job.status !== 'active') return false;
  if (!job.nextRunAt) return true;
  return new Date(job.nextRunAt).getTime() <= Date.now();
}

export async function executeScheduledJob(
  jobId: string,
  triggeredBy: 'vercel_cron' | 'manual' | 'mcp_tool' = 'manual'
): Promise<JobExecution> {
  const job = await getJobById(jobId);
  if (!job) {
    throw new Error(`Scheduled job not found: ${jobId}`);
  }

  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const startTime = new Date().toISOString();

  // Initial execution record
  const initialExecution: JobExecution = {
    id: executionId,
    jobId: job.id,
    jobName: job.name,
    triggeredBy,
    status: 'running',
    startTime,
    documentsProcessed: 0,
    promptSent: `${job.userPromptTemplate} [Target: ${job.targetCollection}]`,
    aiModel: job.model,
  };

  await recordExecution(initialExecution);

  // Update job running status
  job.lastRunStatus = 'running';
  await saveJobRecord(job);

  const startTimestamp = Date.now();

  try {
    // 1. Fetch contextual records from MongoDB Atlas
    const docs = await fetchCollectionDocs(job.targetCollection, {}, 10);

    // 2. Execute via Vercel AI Gateway
    const aiResult = await executeAiGatewayJob({
      systemPrompt: job.systemPrompt,
      userPrompt: job.userPromptTemplate,
      contextDocuments: docs,
      model: job.model,
      temperature: job.temperature,
      taskType: job.taskType,
    });

    const endTime = new Date().toISOString();
    const durationMs = Date.now() - startTimestamp;

    // 3. Store AI output in MongoDB output collection if designated
    if (job.outputCollection && aiResult.success) {
      await insertCollectionDoc(job.outputCollection, {
        jobId: job.id,
        jobName: job.name,
        executionId,
        content: aiResult.content,
        targetCollectionSource: job.targetCollection,
        documentsProcessedCount: docs.length,
        metrics: aiResult.gatewayMetrics,
        generatedAt: endTime,
      });
    }

    // 4. Record successful execution details
    const finishedExecution: JobExecution = {
      ...initialExecution,
      status: 'success',
      endTime,
      durationMs,
      documentsProcessed: docs.length,
      aiResponse: aiResult.content,
      gatewayMetrics: aiResult.gatewayMetrics,
    };

    await recordExecution(finishedExecution);

    // 5. Update Job metadata & next run schedule
    job.lastRunAt = endTime;
    job.lastRunStatus = 'success';
    job.totalRuns = (job.totalRuns || 0) + 1;
    job.nextRunAt = calculateNextRun(job.cronExpression);
    await saveJobRecord(job);

    return finishedExecution;
  } catch (error) {
    const endTime = new Date().toISOString();
    const durationMs = Date.now() - startTimestamp;
    const errorMessage = error instanceof Error ? error.message : 'Unknown execution failure';

    const failedExecution: JobExecution = {
      ...initialExecution,
      status: 'failed',
      endTime,
      durationMs,
      error: errorMessage,
    };

    await recordExecution(failedExecution);

    job.lastRunAt = endTime;
    job.lastRunStatus = 'failed';
    job.nextRunAt = calculateNextRun(job.cronExpression);
    await saveJobRecord(job);

    return failedExecution;
  }
}

export async function processDueJobs(triggeredBy: 'vercel_cron' | 'manual' = 'vercel_cron'): Promise<{
  totalEvaluated: number;
  executedCount: number;
  results: JobExecution[];
}> {
  const jobs = await getAllJobs();
  const dueJobs = jobs.filter((job) => isJobDue(job));

  const results: JobExecution[] = [];
  for (const job of dueJobs) {
    try {
      const res = await executeScheduledJob(job.id, triggeredBy);
      results.push(res);
    } catch (err) {
      console.error(`Failed executing job ${job.id}:`, err);
    }
  }

  return {
    totalEvaluated: jobs.length,
    executedCount: results.length,
    results,
  };
}
