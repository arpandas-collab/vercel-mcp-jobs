import { ScheduledJob, JobExecution } from '@/types';

// In-memory persistent state for local development / demo fallback
class MockDatabaseStore {
  private jobs: Map<string, ScheduledJob> = new Map();
  private executions: Map<string, JobExecution> = new Map();
  private collections: Map<string, Record<string, unknown>[]> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  private seedDefaultData() {
    // 1. Seed sample business data collections
    const feedbackData = [
      {
        _id: 'fb-001',
        customer: 'Acme Corp',
        feedback: 'The new API integration speed is incredible, but rate limits during peak hours need tuning.',
        sentiment: 'neutral',
        category: 'performance',
        score: 7,
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      },
      {
        _id: 'fb-002',
        customer: 'Starlight Tech',
        feedback: 'Loving the real-time AI processing capabilities! Reduced our batch runtimes by 60%.',
        sentiment: 'positive',
        category: 'features',
        score: 10,
        createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        _id: 'fb-003',
        customer: 'Omni Retail',
        feedback: 'Encountered unexpected timeout error on report export between 02:00 and 03:00 UTC.',
        sentiment: 'negative',
        category: 'stability',
        score: 3,
        createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
      },
    ];

    const leadsData = [
      {
        _id: 'lead-101',
        company: 'Vanguard Systems',
        contact: 'sarah.vanguard@example.com',
        dealSize: 45000,
        stage: 'discovery',
        notes: 'Needs scheduled AI workflows with MongoDB Atlas data aggregation.',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        _id: 'lead-102',
        company: 'NextGen Cloud',
        contact: 'mark@nextgencloud.io',
        dealSize: 82000,
        stage: 'proposal',
        notes: 'Exploring Vercel AI Gateway fallback models and latency caching.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ];

    this.collections.set('customer_feedback', feedbackData);
    this.collections.set('sales_leads', leadsData);
    this.collections.set('ai_summaries', []);

    // 2. Seed initial scheduled jobs
    const initialJobs: ScheduledJob[] = [
      {
        id: 'job-feedback-digest',
        name: 'Hourly Customer Sentiment & Digest',
        description: 'Analyzes latest customer feedback in Atlas, scores sentiment, and identifies high-priority tickets.',
        cronExpression: '0 * * * *',
        status: 'active',
        taskType: 'ai_sentiment_analysis',
        targetCollection: 'customer_feedback',
        outputCollection: 'ai_summaries',
        systemPrompt: 'You are an executive customer experience analyst. Summarize feedback sentiment, identify critical pain points, and provide recommended actions.',
        userPromptTemplate: 'Analyze the following customer feedback documents and generate a concise executive summary with sentiment breakdown:',
        model: 'openai/gpt-4o-mini',
        temperature: 0.3,
        lastRunAt: new Date(Date.now() - 3600000).toISOString(),
        nextRunAt: new Date(Date.now() + 1800000).toISOString(),
        lastRunStatus: 'success',
        totalRuns: 12,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        updatedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'job-leads-scoring',
        name: 'Daily High-Value Pipeline Scoring',
        description: 'Evaluates new inbound sales leads and scores conversion propensity using AI Gateway.',
        cronExpression: '0 9 * * *',
        status: 'active',
        taskType: 'ai_data_summary',
        targetCollection: 'sales_leads',
        outputCollection: 'ai_summaries',
        systemPrompt: 'You are a B2B sales development AI specialist. Evaluate lead fit, identify key expansion opportunities, and generate follow-up talking points.',
        userPromptTemplate: 'Review these active pipeline deals and provide actionable qualification scores and priority recommendations:',
        model: 'anthropic/claude-3-5-sonnet',
        temperature: 0.5,
        lastRunAt: new Date(Date.now() - 86400000).toISOString(),
        nextRunAt: new Date(Date.now() + 43200000).toISOString(),
        lastRunStatus: 'success',
        totalRuns: 5,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'job-anomaly-watchdog',
        name: 'Database Anomaly & Latency Watchdog',
        description: 'Periodic inspection of system health logs and metric variance detection.',
        cronExpression: '*/15 * * * *',
        status: 'paused',
        taskType: 'ai_anomaly_detection',
        targetCollection: 'customer_feedback',
        systemPrompt: 'You are an SRE AI agent. Detect metric spikes, timeout clusters, and error anomalies.',
        userPromptTemplate: 'Check for abnormal behavior or spike clusters in these latest database records:',
        model: 'openai/gpt-4o-mini',
        temperature: 0.2,
        lastRunAt: new Date(Date.now() - 7200000).toISOString(),
        nextRunAt: new Date(Date.now() + 900000).toISOString(),
        lastRunStatus: 'success',
        totalRuns: 34,
        createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
        updatedAt: new Date(Date.now() - 7200000).toISOString(),
      },
    ];

    for (const job of initialJobs) {
      this.jobs.set(job.id, job);
    }

    // 3. Seed recent execution history
    const sampleExecutions: JobExecution[] = [
      {
        id: 'exec-demo-1',
        jobId: 'job-feedback-digest',
        jobName: 'Hourly Customer Sentiment & Digest',
        triggeredBy: 'vercel_cron',
        status: 'success',
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3598500).toISOString(),
        durationMs: 1500,
        documentsProcessed: 3,
        promptSent: 'Analyze the following customer feedback documents and generate a concise executive summary...',
        aiResponse: '### Customer Sentiment Analysis Digest\n\n- **Overall Sentiment**: 67% Positive/Neutral, 33% Negative\n- **Highlights**:\n  - Starlight Tech commended real-time AI processing capabilities (60% runtime improvement).\n  - Acme Corp reported rapid API integration speeds; requests fine-tuning on peak hour rate limits.\n- **Critical Action Item**:\n  - Investigate timeout cluster reported by Omni Retail between 02:00-03:00 UTC.\n- **Urgency Level**: Low-Medium.',
        aiModel: 'openai/gpt-4o-mini',
        gatewayMetrics: {
          promptTokens: 420,
          completionTokens: 185,
          totalTokens: 605,
          cached: true,
          latencyMs: 1480,
          gatewayProvider: 'Vercel AI Gateway (Cloudflare Edge)',
        },
      },
    ];

    for (const exec of sampleExecutions) {
      this.executions.set(exec.id, exec);
    }
  }

  // Jobs CRUD
  public getJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  public getJob(id: string): ScheduledJob | undefined {
    return this.jobs.get(id);
  }

  public saveJob(job: ScheduledJob): ScheduledJob {
    this.jobs.set(job.id, job);
    return job;
  }

  public deleteJob(id: string): boolean {
    return this.jobs.delete(id);
  }

  // Executions CRUD
  public getExecutions(limit = 50): JobExecution[] {
    return Array.from(this.executions.values())
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
      .slice(0, limit);
  }

  public saveExecution(execution: JobExecution): JobExecution {
    this.executions.set(execution.id, execution);
    return execution;
  }

  // Collection Queries
  public listCollections(): string[] {
    const defaultCols = ['scheduled_jobs', 'job_executions'];
    return Array.from(new Set([...defaultCols, ...this.collections.keys()]));
  }

  public getCollectionDocuments(name: string, limit = 20): Record<string, unknown>[] {
    if (name === 'scheduled_jobs') {
      return this.getJobs() as unknown as Record<string, unknown>[];
    }
    if (name === 'job_executions') {
      return this.getExecutions() as unknown as Record<string, unknown>[];
    }
    const docs = this.collections.get(name) || [];
    return docs.slice(0, limit);
  }

  public insertDocument(collectionName: string, doc: Record<string, unknown>): Record<string, unknown> {
    const current = this.collections.get(collectionName) || [];
    const withId = {
      _id: doc._id || `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      ...doc,
      createdAt: doc.createdAt || new Date().toISOString(),
    };
    current.unshift(withId);
    this.collections.set(collectionName, current);
    return withId;
  }

  public updateDocuments(
    collectionName: string,
    filter: Record<string, unknown>,
    update: Record<string, unknown>
  ): number {
    const current = this.collections.get(collectionName) || [];
    let updatedCount = 0;
    const modified = current.map((item) => {
      let matches = true;
      for (const [key, val] of Object.entries(filter)) {
        if (item[key] !== val) {
          matches = false;
          break;
        }
      }
      if (matches) {
        updatedCount++;
        return { ...item, ...update, updatedAt: new Date().toISOString() };
      }
      return item;
    });
    this.collections.set(collectionName, modified);
    return updatedCount;
  }
}

// Global singleton instance
declare global {
  // eslint-disable-next-line no-var
  var __mockDbInstance: MockDatabaseStore | undefined;
}

export function getMockDatabase(): MockDatabaseStore {
  if (!global.__mockDbInstance) {
    global.__mockDbInstance = new MockDatabaseStore();
  }
  return global.__mockDbInstance;
}
