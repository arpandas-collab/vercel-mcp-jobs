'use client';

import React, { useState } from 'react';
import {
  Code,
  Terminal,
  Send,
  Copy,
  Check,
  Sparkles,
  Database,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ToolItem {
  name: string;
  category: 'database' | 'jobs';
  description: string;
  defaultArgs: Record<string, unknown>;
}

const MCP_SANDBOX_TOOLS: ToolItem[] = [
  // Database Connectivity Tools
  {
    name: 'query_mongodb',
    category: 'database',
    description: 'Query documents from MongoDB Atlas collection with optional filter & limit.',
    defaultArgs: {
      collection: 'customer_feedback',
      filter: {},
      limit: 5,
    },
  },
  {
    name: 'insert_mongodb_record',
    category: 'database',
    description: 'Insert a new document record into a MongoDB Atlas collection.',
    defaultArgs: {
      collection: 'customer_feedback',
      document: {
        customer: 'Acme Global Corp',
        feedback: 'Vercel MCP integration made database tooling effortless for our AI agents.',
        sentiment: 'positive',
        score: 10,
      },
    },
  },
  {
    name: 'update_mongodb_records',
    category: 'database',
    description: 'Update existing documents matching a filter in MongoDB Atlas.',
    defaultArgs: {
      collection: 'customer_feedback',
      filter: { customer: 'Acme Corp' },
      update: { score: 9 },
    },
  },
  {
    name: 'get_mongodb_schema',
    category: 'database',
    description: 'Inspect MongoDB Atlas schema, list available collections, and preview sample fields.',
    defaultArgs: {},
  },

  // Scheduled Job Management Tools
  {
    name: 'list_scheduled_jobs',
    category: 'jobs',
    description: 'List all registered scheduled jobs and their execution states.',
    defaultArgs: {
      status: 'all',
    },
  },
  {
    name: 'create_scheduled_job',
    category: 'jobs',
    description: 'Register a new scheduled AI cron job with Vercel infrastructure.',
    defaultArgs: {
      name: 'Hourly Deal Momentum Analysis',
      cronExpression: '0 * * * *',
      taskType: 'ai_data_summary',
      targetCollection: 'sales_leads',
      outputCollection: 'ai_summaries',
      systemPrompt: 'You are an AI sales operations analyst.',
      userPromptTemplate: 'Analyze high value leads in the pipeline and draft key deal drivers:',
      model: 'openai/gpt-4o-mini',
    },
  },
  {
    name: 'trigger_job_run',
    category: 'jobs',
    description: 'Immediately trigger on-demand execution of a scheduled job via AI Gateway.',
    defaultArgs: {
      jobId: 'job-feedback-digest',
    },
  },
  {
    name: 'update_job_status',
    category: 'jobs',
    description: 'Update the active/paused state or cron expression of a job.',
    defaultArgs: {
      jobId: 'job-feedback-digest',
      status: 'active',
      cronExpression: '0 * * * *',
    },
  },
  {
    name: 'get_job_execution_history',
    category: 'jobs',
    description: 'Retrieve execution history, AI latency, and token consumption metrics.',
    defaultArgs: {
      limit: 5,
    },
  },
];

export function McpSandbox() {
  const [selectedTool, setSelectedTool] = useState<ToolItem>(MCP_SANDBOX_TOOLS[0]);
  const [argumentsJson, setArgumentsJson] = useState<string>(
    JSON.stringify(MCP_SANDBOX_TOOLS[0].defaultArgs, null, 2)
  );
  const [isCalling, setIsCalling] = useState(false);
  const [responseOutput, setResponseOutput] = useState<string | null>(null);
  const [responseStatus, setResponseStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [copiedConfig, setCopiedConfig] = useState(false);

  const handleSelectTool = (tool: ToolItem) => {
    setSelectedTool(tool);
    setArgumentsJson(JSON.stringify(tool.defaultArgs, null, 2));
    setResponseOutput(null);
    setResponseStatus('idle');
  };

  const handleExecuteTool = async () => {
    setIsCalling(true);
    setResponseOutput(null);

    let parsedArgs: Record<string, unknown> = {};
    try {
      parsedArgs = JSON.parse(argumentsJson);
    } catch {
      setResponseStatus('error');
      setResponseOutput(JSON.stringify({ error: 'Invalid JSON in tool arguments' }, null, 2));
      setIsCalling(false);
      return;
    }

    const payload = {
      jsonrpc: '2.0',
      id: Date.now(),
      method: 'tools/call',
      params: {
        name: selectedTool.name,
        arguments: parsedArgs,
      },
    };

    try {
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponseStatus(data.error || data.result?.isError ? 'error' : 'success');
      setResponseOutput(JSON.stringify(data, null, 2));
    } catch (err) {
      setResponseStatus('error');
      setResponseOutput(
        JSON.stringify({ error: err instanceof Error ? err.message : 'Network failure' }, null, 2)
      );
    } finally {
      setIsCalling(false);
    }
  };

  const mcpConfigSnippet = `{
  "mcpServers": {
    "vercel-mcp-jobs": {
      "url": "https://<your-vercel-domain>.vercel.app/api/mcp"
    }
  }
}`;

  const copyConfig = () => {
    navigator.clipboard.writeText(mcpConfigSnippet);
    setCopiedConfig(true);
    setTimeout(() => setCopiedConfig(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Client Config */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Model Context Protocol 2024-11-05
            </span>
            <span className="text-xs text-slate-400">Endpoint: /api/mcp</span>
          </div>
          <h2 className="text-base font-semibold text-white">Vercel MCP Tools Registry</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            AI agents can connect directly to this endpoint using Cursor, Claude Desktop, Antigravity, or custom agents to manage Atlas data and scheduled jobs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono text-slate-300">
            HTTP JSON-RPC 2.0
          </div>
          <button
            onClick={copyConfig}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-white transition-colors border border-slate-700"
          >
            {copiedConfig ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            {copiedConfig ? 'Copied' : 'Copy MCP Config'}
          </button>
        </div>
      </div>

      {/* Main Sandbox Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: Tool Selector */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Available MCP Tools (9)
          </div>

          <div className="space-y-2">
            <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5 px-2 pt-1">
              <Database className="h-3.5 w-3.5" />
              Database Connectivity Tools
            </div>
            {MCP_SANDBOX_TOOLS.filter((t) => t.category === 'database').map((tool) => (
              <button
                key={tool.name}
                id={`btn-mcp-tool-${tool.name}`}
                onClick={() => handleSelectTool(tool)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  selectedTool.name === tool.name
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="font-mono font-medium text-indigo-300 text-[11px] mb-0.5">
                  {tool.name}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">{tool.description}</div>
              </button>
            ))}

            <div className="text-[11px] font-semibold text-cyan-400 flex items-center gap-1.5 px-2 pt-3">
              <Clock className="h-3.5 w-3.5" />
              Scheduled-Job Management Tools
            </div>
            {MCP_SANDBOX_TOOLS.filter((t) => t.category === 'jobs').map((tool) => (
              <button
                key={tool.name}
                id={`btn-mcp-tool-${tool.name}`}
                onClick={() => handleSelectTool(tool)}
                className={`w-full text-left p-3 rounded-xl border transition-all text-xs ${
                  selectedTool.name === tool.name
                    ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="font-mono font-medium text-cyan-300 text-[11px] mb-0.5">
                  {tool.name}
                </div>
                <div className="text-[11px] text-slate-400 line-clamp-1">{tool.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Interactive Tester & JSON-RPC Inspector */}
        <div className="lg:col-span-8 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            {/* Tool Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold text-white font-mono">{selectedTool.name}</h3>
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase border ${
                      selectedTool.category === 'database'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    {selectedTool.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1">{selectedTool.description}</p>
              </div>

              <button
                id="btn-call-mcp-tool"
                onClick={handleExecuteTool}
                disabled={isCalling}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold glow-indigo shadow-md transition-all disabled:opacity-50"
              >
                <Send className={`h-3.5 w-3.5 ${isCalling ? 'animate-pulse' : ''}`} />
                {isCalling ? 'Executing...' : 'Invoke MCP Tool'}
              </button>
            </div>

            {/* Input Arguments Editor */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  Tool Parameters (JSON Schema payload)
                </label>
                <button
                  onClick={() => setArgumentsJson(JSON.stringify(selectedTool.defaultArgs, null, 2))}
                  className="text-[11px] text-slate-500 hover:text-slate-300 underline"
                >
                  Reset Defaults
                </button>
              </div>
              <textarea
                id="input-mcp-args"
                rows={6}
                value={argumentsJson}
                onChange={(e) => setArgumentsJson(e.target.value)}
                className="w-full font-mono text-xs p-3 bg-slate-950 border border-slate-800 rounded-xl text-indigo-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Response Viewer */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Code className="h-3.5 w-3.5 text-purple-400" />
                  JSON-RPC 2.0 Response Output
                </label>
                {responseStatus === 'success' && (
                  <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Tool Executed Successfully
                  </span>
                )}
                {responseStatus === 'error' && (
                  <span className="text-[11px] font-semibold text-red-400 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" /> Execution Error
                  </span>
                )}
              </div>

              <div
                id="mcp-response-output"
                className={`w-full min-h-[160px] max-h-[350px] overflow-auto font-mono text-xs p-3.5 bg-slate-950 border rounded-xl transition-all ${
                  responseStatus === 'error'
                    ? 'border-red-500/40 text-red-300'
                    : responseStatus === 'success'
                    ? 'border-emerald-500/40 text-emerald-300'
                    : 'border-slate-800 text-slate-400'
                }`}
              >
                {responseOutput ? (
                  <pre className="whitespace-pre-wrap">{responseOutput}</pre>
                ) : (
                  <div className="text-slate-600 italic py-6 text-center">
                    Click &quot;Invoke MCP Tool&quot; above to dispatch an official MCP JSON-RPC 2.0 tool execution request.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
