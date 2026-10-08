'use client';

import React, { useState } from 'react';
import { JobExecution } from '@/types';
import {
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Cpu,
  Layers,
  ChevronRight,
  Database,
  Zap,
} from 'lucide-react';

interface HistoryProps {
  executions: JobExecution[];
  onRefresh: () => void;
}

export function ExecutionHistory({ executions, onRefresh }: HistoryProps) {
  const [selectedExec, setSelectedExec] = useState<JobExecution | null>(executions[0] || null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-400" />
            AI Execution Logs &amp; Telemetry
          </h2>
          <p className="text-xs text-slate-400">
            Audit trail of every scheduled job run triggered via Vercel Crons or MCP tools, including AI Gateway latency and token usage.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          Refresh Logs
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: List of executions */}
        <div className="lg:col-span-5 space-y-2.5 max-h-[650px] overflow-y-auto pr-1">
          {executions.length === 0 ? (
            <div className="glass-panel p-6 rounded-xl border border-slate-800 text-center text-xs text-slate-500">
              No job executions recorded yet. Trigger a job above or click &quot;Dispatch Cron Now&quot;.
            </div>
          ) : (
            executions.map((exec) => {
              const isSelected = selectedExec?.id === exec.id;
              return (
                <button
                  key={exec.id}
                  onClick={() => setSelectedExec(exec)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                    isSelected
                      ? 'bg-indigo-600/15 border-indigo-500/50 shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="space-y-1.5 flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2">
                      {exec.status === 'success' ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      )}
                      <span className="font-semibold text-white truncate text-xs">
                        {exec.jobName}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="px-1.5 py-0.2 bg-slate-950 rounded text-slate-300 border border-slate-800 text-[10px]">
                        {exec.triggeredBy}
                      </span>
                      <span>&bull;</span>
                      <span>{exec.durationMs ? `${exec.durationMs}ms` : 'running...'}</span>
                      <span>&bull;</span>
                      <span>{new Date(exec.startTime).toLocaleTimeString()}</span>
                    </div>
                  </div>

                  <ChevronRight
                    className={`h-4 w-4 text-slate-500 transition-transform ${
                      isSelected ? 'text-indigo-400 translate-x-1' : ''
                    }`}
                  />
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Execution Telemetry & Output */}
        <div className="lg:col-span-7">
          {selectedExec ? (
            <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
              {/* Execution Summary Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-white">{selectedExec.jobName}</h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-semibold rounded-full uppercase border ${
                        selectedExec.status === 'success'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-red-500/10 text-red-400 border-red-500/30'
                      }`}
                    >
                      {selectedExec.status}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                    Execution ID: {selectedExec.id}
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-slate-400">Trigger: </span>
                  <span className="font-mono text-indigo-300">{selectedExec.triggeredBy}</span>
                </div>
              </div>

              {/* Telemetry Metrics Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Clock className="h-3 w-3 text-cyan-400" /> Latency
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedExec.durationMs || 0}ms
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Database className="h-3 w-3 text-emerald-400" /> Atlas Docs
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedExec.documentsProcessed} evaluated
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Cpu className="h-3 w-3 text-purple-400" /> Total Tokens
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedExec.gatewayMetrics?.totalTokens || 'N/A'}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800/80">
                  <div className="text-slate-500 text-[10px] flex items-center gap-1">
                    <Zap className="h-3 w-3 text-amber-400" /> Edge Cache
                  </div>
                  <div className="text-sm font-bold text-white mt-0.5">
                    {selectedExec.gatewayMetrics?.cached ? 'CACHE HIT' : 'LIVE CALL'}
                  </div>
                </div>
              </div>

              {/* Gateway Provider & Model */}
              <div className="text-xs bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 flex items-center justify-between">
                <span className="text-slate-400">Gateway Provider:</span>
                <span className="text-indigo-300 font-mono text-[11px]">
                  {selectedExec.gatewayMetrics?.gatewayProvider || 'Vercel AI Gateway'}
                </span>
                <span className="text-slate-400">Model:</span>
                <span className="text-purple-300 font-mono text-[11px]">{selectedExec.aiModel}</span>
              </div>

              {/* Prompt Sent */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 block">
                  Prompt Dispatched to AI Gateway
                </label>
                <div className="text-xs p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 font-mono line-clamp-3">
                  {selectedExec.promptSent}
                </div>
              </div>

              {/* AI Output Generated */}
              <div>
                <label className="text-xs font-medium text-slate-300 mb-1 flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-indigo-400" />
                  AI Gateway Generated Result
                </label>
                <div className="text-xs p-4 bg-slate-950 rounded-xl border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto font-sans">
                  {selectedExec.aiResponse || selectedExec.error || 'Execution pending...'}
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-panel p-10 rounded-2xl border border-slate-800 text-center text-slate-500 text-xs">
              Select an execution record on the left to inspect its AI Gateway telemetry.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
