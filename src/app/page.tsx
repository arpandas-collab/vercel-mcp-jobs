'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from '@/components/Header';
import { MetricsOverview } from '@/components/MetricsOverview';
import { JobsManager } from '@/components/JobsManager';
import { McpSandbox } from '@/components/McpSandbox';
import { ExecutionHistory } from '@/components/ExecutionHistory';
import { DatabaseExplorer } from '@/components/DatabaseExplorer';
import { VercelGuide } from '@/components/VercelGuide';
import { ScheduledJob, JobExecution, DatabaseStatus } from '@/types';
import { Clock, Layers, History, Database, Cloud, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<'jobs' | 'mcp' | 'history' | 'database' | 'guide'>('jobs');
  const [jobs, setJobs] = useState<ScheduledJob[]>([]);
  const [executions, setExecutions] = useState<JobExecution[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseStatus | null>(null);
  const [collections, setCollections] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Operation indicators
  const [isDispatching, setIsDispatching] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [runningJobId, setRunningJobId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const fetchData = useCallback(async () => {
    try {
      const [jobsRes, historyRes, statusRes] = await Promise.all([
        fetch('/api/jobs').then((r) => r.json()),
        fetch('/api/jobs/history').then((r) => r.json()),
        fetch('/api/database/status').then((r) => r.json()),
      ]);

      if (jobsRes.success) setJobs(jobsRes.jobs);
      if (historyRes.success) setExecutions(historyRes.executions);
      if (statusRes.success) {
        setDbStatus(statusRes.status);
        setCollections(statusRes.collections || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dispatch Vercel Cron manually
  const handleDispatchCron = async () => {
    setIsDispatching(true);
    try {
      const res = await fetch('/api/cron/dispatcher', {
        method: 'POST',
        headers: { 'x-admin-trigger': 'dashboard' },
      });
      const data = await res.json();
      if (data.success) {
        showNotification(
          `Vercel Cron Dispatched: Evaluated ${data.totalEvaluated} jobs, executed ${data.executedCount} due tasks.`
        );
        fetchData();
      } else {
        showNotification(`Cron execution issue: ${data.error}`, 'error');
      }
    } catch (err) {
      showNotification('Failed to dispatch cron', 'error');
    } finally {
      setIsDispatching(false);
    }
  };

  // Seed sample database data
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const res = await fetch('/api/database/seed', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('MongoDB Atlas sample records seeded successfully.');
        fetchData();
      } else {
        showNotification(data.error || 'Failed to seed data', 'error');
      }
    } catch {
      showNotification('Error seeding data', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  // Run single job on demand
  const handleRunJob = async (jobId: string) => {
    setRunningJobId(jobId);
    try {
      const res = await fetch(`/api/jobs/${jobId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggeredBy: 'manual' }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Job executed! Processed ${data.execution.documentsProcessed} records via AI Gateway.`);
        fetchData();
        // Switch to history tab to see output
        setActiveTab('history');
      } else {
        showNotification(data.error || 'Job execution failed', 'error');
      }
    } catch {
      showNotification('Error triggering job', 'error');
    } finally {
      setRunningJobId(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Global Header */}
      <Header
        dbStatus={dbStatus}
        onRefreshAll={fetchData}
        onDispatchCron={handleDispatchCron}
        onSeedData={handleSeedData}
        isDispatching={isDispatching}
        isSeeding={isSeeding}
      />

      {/* Floating Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-in slide-in-from-bottom duration-200">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-xl border shadow-xl text-xs font-medium backdrop-blur-xl ${
              notification.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/40 text-emerald-200 glow-emerald'
                : 'bg-red-950/90 border-red-500/40 text-red-200'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span className="flex-1">{notification.message}</span>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white ml-2 text-sm"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Metric Cards Banner */}
        <MetricsOverview jobs={jobs} executions={executions} dbStatus={dbStatus} />

        {/* Tab Navigation Navigation Bar */}
        <div className="flex items-center gap-1 border-b border-slate-800 pb-px overflow-x-auto">
          <button
            id="tab-btn-jobs"
            onClick={() => setActiveTab('jobs')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'jobs'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Clock className="h-4 w-4" />
            Scheduled Jobs ({jobs.length})
          </button>

          <button
            id="tab-btn-mcp"
            onClick={() => setActiveTab('mcp')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'mcp'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="h-4 w-4" />
            Vercel MCP Tools Sandbox (9 Tools)
          </button>

          <button
            id="tab-btn-history"
            onClick={() => setActiveTab('history')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="h-4 w-4" />
            Execution Logs &amp; AI Telemetry
          </button>

          <button
            id="tab-btn-database"
            onClick={() => setActiveTab('database')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'database'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="h-4 w-4" />
            MongoDB Atlas Explorer
          </button>

          <button
            id="tab-btn-guide"
            onClick={() => setActiveTab('guide')}
            className={`inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'guide'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cloud className="h-4 w-4" />
            Vercel Deployment &amp; Config
          </button>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2">
          {activeTab === 'jobs' && (
            <JobsManager
              jobs={jobs}
              collections={collections}
              onRefresh={fetchData}
              onRunJob={handleRunJob}
              runningJobId={runningJobId}
            />
          )}

          {activeTab === 'mcp' && <McpSandbox />}

          {activeTab === 'history' && (
            <ExecutionHistory executions={executions} onRefresh={fetchData} />
          )}

          {activeTab === 'database' && (
            <DatabaseExplorer
              collections={collections}
              onSeedData={handleSeedData}
              isSeeding={isSeeding}
            />
          )}

          {activeTab === 'guide' && <VercelGuide />}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 mt-12 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            NexusCron Platform &bull; Powered by Next.js, Vercel Crons, Model Context Protocol &amp; MongoDB Atlas
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            MCP Endpoint: <code className="text-indigo-400">/api/mcp</code> &bull; Cron: <code className="text-cyan-400">/api/cron/dispatcher</code>
          </p>
        </div>
      </footer>
    </div>
  );
}
