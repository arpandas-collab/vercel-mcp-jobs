'use client';

import React, { useState } from 'react';
import { Sparkles, Terminal, Shield, CheckCircle2, Cloud, ExternalLink, Zap } from 'lucide-react';

export function VercelGuide() {
  const [testingAi, setTestingAi] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<Record<string, unknown> | null>(null);

  const runAiTest = async () => {
    setTestingAi(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Verify AI Gateway edge connectivity, latency, and token response format.',
        }),
      });
      const data = await res.json();
      setAiTestResult(data);
    } catch (err) {
      setAiTestResult({ error: String(err) });
    } finally {
      setTestingAi(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-2 mb-2">
          <Cloud className="h-5 w-5 text-indigo-400" />
          <h2 className="text-base font-semibold text-white">
            Vercel Deployment &amp; Infrastructure Guide
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          This application is designed specifically for Vercel Serverless &amp; Edge execution. It integrates Vercel Crons for scheduling, MongoDB Atlas for persistent storage, Vercel AI Gateway for cached &amp; routed LLM requests, and exposes an official Model Context Protocol (MCP) server.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1. Vercel Cron Setup */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="h-6 w-6 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center text-xs font-mono font-bold">
              1
            </span>
            Vercel Cron &amp; Workflow Dispatcher
          </div>
          <p className="text-xs text-slate-400">
            Cron configuration is declared in <code className="text-cyan-300 font-mono">vercel.json</code>. Vercel automatically pings the route periodically.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
            <pre>{`// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/dispatcher",
      "schedule": "* * * * *"
    }
  ]
}`}</pre>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
            <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
            <span>
              Secure with <code className="text-indigo-300">CRON_SECRET</code> in Vercel project environment variables.
            </span>
          </div>
        </div>

        {/* 2. MongoDB Atlas Configuration */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <span className="h-6 w-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-xs font-mono font-bold">
              2
            </span>
            MongoDB Atlas Connectivity
          </div>
          <p className="text-xs text-slate-400">
            Configure your MongoDB Atlas cluster connection string. Connection caching across serverless invocations is already implemented in <code className="text-emerald-300 font-mono">lib/mongodb.ts</code>.
          </p>
          <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-slate-500"># Set in Vercel Project Settings &gt; Environment Variables</div>
            <div className="text-emerald-300">MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true</div>
            <div className="text-emerald-300">MONGODB_DB=vercel_jobs_db</div>
          </div>
          <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg">
            Tip: In MongoDB Atlas &gt; Network Access, allow IP Access List <code className="font-mono">0.0.0.0/0</code> so Vercel dynamic serverless IPs can reach your cluster.
          </p>
        </div>

        {/* 3. Vercel AI Gateway Setup & Live Test */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3 md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <span className="h-6 w-6 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center text-xs font-mono font-bold">
                3
              </span>
              Vercel AI Gateway Integration
            </div>
            <button
              id="btn-test-ai-gateway"
              onClick={runAiTest}
              disabled={testingAi}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-medium text-white transition-all shadow-md disabled:opacity-50"
            >
              <Zap className={`h-3.5 w-3.5 ${testingAi ? 'animate-spin' : ''}`} />
              {testingAi ? 'Testing Gateway...' : 'Test AI Gateway Now'}
            </button>
          </div>
          <p className="text-xs text-slate-400">
            Vercel AI Gateway acts as a high-performance proxy offering request routing, model fallbacks, rate limiting, and edge caching for OpenAI, Anthropic, and open-source models.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono bg-slate-950 p-3 rounded-xl border border-slate-800 text-slate-300">
            <div>
              <span className="text-slate-500 block"># AI Gateway Endpoint</span>
              <span className="text-purple-300">VERCEL_AI_GATEWAY_URL=https://api.openai.com/v1</span>
            </div>
            <div>
              <span className="text-slate-500 block"># Gateway Auth Bearer Token</span>
              <span className="text-purple-300">AI_GATEWAY_TOKEN=sk-...</span>
            </div>
          </div>

          {aiTestResult && (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-purple-500/30 text-xs font-mono space-y-1">
              <div className="text-purple-300 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Gateway Diagnostics Response:
              </div>
              <pre className="text-slate-300 text-[11px] whitespace-pre-wrap">
                {JSON.stringify(aiTestResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
