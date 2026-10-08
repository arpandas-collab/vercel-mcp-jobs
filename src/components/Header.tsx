'use client';

import React from 'react';
import { DatabaseStatus } from '@/types';
import { Database, Clock, Sparkles, Network, Play, RefreshCw, Layers } from 'lucide-react';

interface HeaderProps {
  dbStatus: DatabaseStatus | null;
  onRefreshAll: () => void;
  onDispatchCron: () => void;
  onSeedData: () => void;
  isDispatching: boolean;
  isSeeding: boolean;
}

export function Header({
  dbStatus,
  onRefreshAll,
  onDispatchCron,
  onSeedData,
  isDispatching,
  isSeeding,
}: HeaderProps) {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-emerald-400 p-0.5 flex items-center justify-center glow-indigo shadow-lg">
            <div className="h-full w-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Network className="h-5 w-5 text-indigo-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-white">
                Nexus<span className="text-indigo-400">Cron</span>
              </h1>
              <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                Vercel MCP + Atlas
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Model Context Protocol &bull; MongoDB Atlas &bull; AI Gateway &bull; Vercel Scheduling
            </p>
          </div>
        </div>

        {/* Live System Status Badges */}
        <div className="flex flex-wrap items-center gap-2">
          {/* MongoDB Atlas Status */}
          <div
            id="status-mongodb-badge"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition-colors"
          >
            <Database className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-medium">MongoDB:</span>
            {dbStatus?.type === 'atlas' ? (
              <span className="inline-flex items-center gap-1.5 text-emerald-400 font-semibold">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                Atlas Live
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-amber-400 font-semibold" title="Using local mock store until MONGODB_URI is provided">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                Sandbox Ready
              </span>
            )}
          </div>

          {/* Vercel Cron Status */}
          <div
            id="status-cron-badge"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition-colors"
          >
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-medium">Vercel Cron:</span>
            <span className="text-cyan-400 font-semibold">vercel.json (Active)</span>
          </div>

          {/* AI Gateway Status */}
          <div
            id="status-ai-gateway-badge"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
            <span className="font-medium">AI Gateway:</span>
            <span className="text-indigo-400 font-semibold">Edge Routing</span>
          </div>

          {/* MCP Endpoint */}
          <div
            id="status-mcp-badge"
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:border-slate-700 transition-colors"
          >
            <Layers className="h-3.5 w-3.5 text-purple-400" />
            <span className="font-medium">MCP:</span>
            <code className="text-[11px] text-purple-300 font-mono">/api/mcp</code>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-seed-data"
            onClick={onSeedData}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-medium text-slate-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
            {isSeeding ? 'Seeding...' : 'Seed Data'}
          </button>

          <button
            id="btn-dispatch-cron"
            onClick={onDispatchCron}
            disabled={isDispatching}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium glow-indigo transition-all shadow-md active:scale-95 disabled:opacity-50"
          >
            <Play className={`h-3.5 w-3.5 fill-current ${isDispatching ? 'animate-spin' : ''}`} />
            {isDispatching ? 'Dispatching...' : 'Dispatch Cron Now'}
          </button>
        </div>
      </div>
    </header>
  );
}
