import { McpToolDefinition } from '@/types';
import {
  listAllCollections,
  fetchCollectionDocs,
  insertCollectionDoc,
  updateCollectionDocs,
  getAllJobs,
  getJobById,
  saveJobRecord,
  getRecentExecutions,
} from './mongodb';
import { executeScheduledJob, calculateNextRun } from './scheduler';

export const MCP_TOOLS: McpToolDefinition[] = [
  // --- Database Connectivity Tools ---
  {
    name: 'query_mongodb',
    description: 'Query documents from a MongoDB Atlas collection with optional filtering and limit.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          description: 'The target MongoDB Atlas collection name (e.g. "customer_feedback", "sales_leads").',
          required: true,
        },
        filter: {
          type: 'object',
          description: 'MongoDB query filter object (e.g. {"sentiment": "negative"}). Leave empty for all.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of documents to return (default: 20, max: 100).',
          default: 20,
        },
      },
      required: ['collection'],
    },
  },
  {
    name: 'insert_mongodb_record',
    description: 'Insert a new document record into a MongoDB Atlas collection.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          description: 'The MongoDB collection name to insert into.',
          required: true,
        },
        document: {
          type: 'object',
          description: 'The JSON document to insert.',
          required: true,
        },
      },
      required: ['collection', 'document'],
    },
  },
  {
    name: 'update_mongodb_records',
    description: 'Update existing documents matching a filter in MongoDB Atlas.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          description: 'The target MongoDB collection name.',
          required: true,
        },
        filter: {
          type: 'object',
          description: 'Filter selector for documents to update (e.g. {"id": "lead-101"}).',
          required: true,
        },
        update: {
          type: 'object',
          description: 'Fields to update.',
          required: true,
        },
      },
      required: ['collection', 'filter', 'update'],
    },
  },
  {
    name: 'get_mongodb_schema',
    description: 'Inspect MongoDB Atlas schema, list available collections and preview sample documents.',
    inputSchema: {
      type: 'object',
      properties: {
        collection: {
          type: 'string',
          description: 'Optional collection name. If not provided, inspects all collections.',
        },
      },
    },
  },

  // --- Scheduled Job Management Tools ---
  {
    name: 'create_scheduled_job',
    description: 'Create and register a new AI scheduled cron job with Vercel scheduling infrastructure and MongoDB Atlas target.',
    inputSchema: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Human-readable name for the scheduled job.',
          required: true,
        },
        description: {
          type: 'string',
          description: 'Description of what this automated job performs.',
        },
        cronExpression: {
          type: 'string',
          description: 'Standard 5-field cron expression (e.g. "0 * * * *" for hourly, "0 9 * * *" for daily at 9am, "*/15 * * * *" for every 15 min).',
          required: true,
        },
        taskType: {
          type: 'string',
          description: 'Type of AI task: "ai_data_summary", "ai_anomaly_detection", "ai_sentiment_analysis", or "ai_custom_workflow".',
          required: true,
        },
        targetCollection: {
          type: 'string',
          description: 'MongoDB Atlas collection to pull context data from.',
          required: true,
        },
        outputCollection: {
          type: 'string',
          description: 'Optional MongoDB collection to save generated AI output into (e.g. "ai_summaries").',
        },
        systemPrompt: {
          type: 'string',
          description: 'System instructions for the AI model executed via Vercel AI Gateway.',
        },
        userPromptTemplate: {
          type: 'string',
          description: 'Prompt template sent with MongoDB documents.',
        },
        model: {
          type: 'string',
          description: 'Model identifier for AI Gateway (e.g. "openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet").',
          default: 'openai/gpt-4o-mini',
        },
      },
      required: ['name', 'cronExpression', 'taskType', 'targetCollection'],
    },
  },
  {
    name: 'list_scheduled_jobs',
    description: 'List all scheduled jobs registered in the Vercel scheduling engine and MongoDB Atlas.',
    inputSchema: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          description: 'Filter by job status: "active", "paused", or "all" (default: "all").',
        },
      },
    },
  },
  {
    name: 'trigger_job_run',
    description: 'Immediately trigger an on-demand execution of a scheduled job via Vercel AI Gateway.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'The unique ID of the scheduled job to execute.',
          required: true,
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'update_job_status',
    description: 'Update the state or schedule of a scheduled job (e.g. pause, resume, change cron).',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'The unique ID of the job.',
          required: true,
        },
        status: {
          type: 'string',
          description: 'New status: "active" or "paused".',
        },
        cronExpression: {
          type: 'string',
          description: 'New cron expression if updating schedule.',
        },
      },
      required: ['jobId'],
    },
  },
  {
    name: 'get_job_execution_history',
    description: 'Retrieve execution logs, latency metrics, and Vercel AI Gateway token consumption for jobs.',
    inputSchema: {
      type: 'object',
      properties: {
        jobId: {
          type: 'string',
          description: 'Optional job ID filter.',
        },
        limit: {
          type: 'number',
          description: 'Max number of history records to return (default: 20).',
          default: 20,
        },
      },
    },
  },
];

export async function handleMcpToolCall(toolName: string, args: Record<string, unknown> = {}): Promise<unknown> {
  switch (toolName) {
    case 'query_mongodb': {
      const collection = String(args.collection || '');
      const filter = (args.filter as Record<string, unknown>) || {};
      const limit = typeof args.limit === 'number' ? args.limit : 20;

      if (!collection) throw new Error('Missing parameter: collection');

      const docs = await fetchCollectionDocs(collection, filter, limit);
      return {
        collection,
        count: docs.length,
        documents: docs,
      };
    }

    case 'insert_mongodb_record': {
      const collection = String(args.collection || '');
      const doc = (args.document as Record<string, unknown>) || {};

      if (!collection || !doc) throw new Error('Missing collection or document payload');

      const inserted = await insertCollectionDoc(collection, doc);
      return {
        success: true,
        collection,
        insertedDocument: inserted,
      };
    }

    case 'update_mongodb_records': {
      const collection = String(args.collection || '');
      const filter = (args.filter as Record<string, unknown>) || {};
      const update = (args.update as Record<string, unknown>) || {};

      if (!collection) throw new Error('Missing collection parameter');

      const modifiedCount = await updateCollectionDocs(collection, filter, update);
      return {
        success: true,
        collection,
        modifiedCount,
      };
    }

    case 'get_mongodb_schema': {
      const targetCol = args.collection ? String(args.collection) : null;
      const allCols = await listAllCollections();

      if (targetCol) {
        const sampleDocs = await fetchCollectionDocs(targetCol, {}, 3);
        return {
          collection: targetCol,
          sampleCount: sampleDocs.length,
          fields: sampleDocs[0] ? Object.keys(sampleDocs[0]) : [],
          sample: sampleDocs[0] || null,
        };
      }

      const overview: Record<string, unknown>[] = [];
      for (const col of allCols) {
        const sample = await fetchCollectionDocs(col, {}, 1);
        overview.push({
          name: col,
          fieldSample: sample[0] ? Object.keys(sample[0]) : [],
        });
      }

      return {
        totalCollections: allCols.length,
        collections: overview,
      };
    }

    case 'create_scheduled_job': {
      const name = String(args.name || '');
      const cronExpression = String(args.cronExpression || '');
      const taskType = (args.taskType as any) || 'ai_data_summary';
      const targetCollection = String(args.targetCollection || '');

      if (!name || !cronExpression || !targetCollection) {
        throw new Error('Missing required fields: name, cronExpression, targetCollection');
      }

      const nextRunAt = calculateNextRun(cronExpression);
      const newJob = {
        id: `job-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name,
        description: String(args.description || `AI automated job for ${targetCollection}`),
        cronExpression,
        status: 'active' as const,
        taskType,
        targetCollection,
        outputCollection: args.outputCollection ? String(args.outputCollection) : 'ai_summaries',
        systemPrompt: String(args.systemPrompt || 'You are an intelligent data analyst assistant.'),
        userPromptTemplate: String(args.userPromptTemplate || 'Review the attached MongoDB records and summarize:'),
        model: String(args.model || 'openai/gpt-4o-mini'),
        temperature: 0.3,
        totalRuns: 0,
        nextRunAt,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await saveJobRecord(newJob);
      return {
        success: true,
        message: 'Scheduled job registered successfully',
        job: newJob,
      };
    }

    case 'list_scheduled_jobs': {
      const statusFilter = args.status ? String(args.status) : 'all';
      const allJobs = await getAllJobs();
      const filtered =
        statusFilter === 'all' ? allJobs : allJobs.filter((j) => j.status === statusFilter);

      return {
        total: filtered.length,
        jobs: filtered,
      };
    }

    case 'trigger_job_run': {
      const jobId = String(args.jobId || '');
      if (!jobId) throw new Error('Missing parameter: jobId');

      const result = await executeScheduledJob(jobId, 'mcp_tool');
      return {
        success: result.status === 'success',
        execution: result,
      };
    }

    case 'update_job_status': {
      const jobId = String(args.jobId || '');
      if (!jobId) throw new Error('Missing parameter: jobId');

      const job = await getJobById(jobId);
      if (!job) throw new Error(`Job not found: ${jobId}`);

      if (args.status && ['active', 'paused'].includes(String(args.status))) {
        job.status = args.status as 'active' | 'paused';
      }
      if (args.cronExpression) {
        job.cronExpression = String(args.cronExpression);
        job.nextRunAt = calculateNextRun(job.cronExpression);
      }

      await saveJobRecord(job);
      return {
        success: true,
        job,
      };
    }

    case 'get_job_execution_history': {
      const limit = typeof args.limit === 'number' ? args.limit : 20;
      const history = await getRecentExecutions(limit);
      const filtered = args.jobId ? history.filter((h) => h.jobId === args.jobId) : history;

      return {
        count: filtered.length,
        executions: filtered,
      };
    }

    default:
      throw new Error(`Unknown MCP tool: ${toolName}`);
  }
}
