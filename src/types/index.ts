export interface ScheduledJob {
  _id?: string;
  id: string;
  name: string;
  description: string;
  cronExpression: string; // e.g. "0 * * * *" or "*/15 * * * *"
  status: 'active' | 'paused' | 'failed';
  taskType: 'ai_data_summary' | 'ai_anomaly_detection' | 'ai_sentiment_analysis' | 'ai_custom_workflow';
  targetCollection: string; // MongoDB collection to read context from
  outputCollection?: string; // Optional collection to store results into
  systemPrompt: string;
  userPromptTemplate: string;
  model: string; // e.g. "openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet", etc.
  temperature?: number;
  lastRunAt?: string;
  nextRunAt?: string;
  lastRunStatus?: 'success' | 'failed' | 'running';
  totalRuns: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobExecution {
  _id?: string;
  id: string;
  jobId: string;
  jobName: string;
  triggeredBy: 'vercel_cron' | 'manual' | 'mcp_tool';
  status: 'running' | 'success' | 'failed';
  startTime: string;
  endTime?: string;
  durationMs?: number;
  documentsProcessed: number;
  promptSent: string;
  aiResponse?: string;
  aiModel: string;
  gatewayMetrics?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cached: boolean;
    latencyMs: number;
    gatewayProvider: string;
  };
  error?: string;
}

export interface McpToolParameter {
  type: string;
  description: string;
  required?: boolean;
  default?: unknown;
}

export interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, McpToolParameter>;
    required?: string[];
  };
}

export interface McpRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: Record<string, unknown>;
}

export interface McpResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: unknown;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export interface DatabaseStatus {
  connected: boolean;
  type: 'atlas' | 'local_fallback';
  databaseName: string;
  collectionsCount: number;
  activeJobsCount: number;
  totalExecutionsCount: number;
  uriConfigured: boolean;
  error?: string;
}
