'use client';

import React, { useState } from 'react';
import { ScheduledJob } from '@/types';
import {
  Clock,
  Play,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Database,
  Cpu,
  Pause,
  Layers,
} from 'lucide-react';

interface JobsManagerProps {
  jobs: ScheduledJob[];
  collections: string[];
  onRefresh: () => void;
  onRunJob: (jobId: string) => Promise<void>;
  runningJobId: string | null;
}

export function JobsManager({
  jobs,
  collections,
  onRefresh,
  onRunJob,
  runningJobId,
}: JobsManagerProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [cronExpression, setCronExpression] = useState('0 * * * *');
  const [taskType, setTaskType] = useState('ai_data_summary');
  const [targetCollection, setTargetCollection] = useState(collections[0] || 'customer_feedback');
  const [outputCollection, setOutputCollection] = useState('ai_summaries');
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [systemPrompt, setSystemPrompt] = useState(
    'You are an executive operations AI. Extract insights and actionable findings.'
  );
  const [userPromptTemplate, setUserPromptTemplate] = useState(
    'Summarize key insights and detect any operational trends in these MongoDB records:'
  );

  const handleToggleStatus = async (job: ScheduledJob) => {
    try {
      const newStatus = job.status === 'active' ? 'paused' : 'active';
      await fetch(`/api/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to toggle status:', err);
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this scheduled job?')) return;
    try {
      await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      onRefresh();
    } catch (err) {
      console.error('Failed to delete job:', err);
    }
  };

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          cronExpression,
          taskType,
          targetCollection,
          outputCollection,
          systemPrompt,
          userPromptTemplate,
          model,
        }),
      });
      if (res.ok) {
        setIsCreateOpen(false);
        setName('');
        setDescription('');
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to create job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-400" />
            Scheduled Workflow Jobs
          </h2>
          <p className="text-xs text-slate-400">
            Automated cron tasks triggered by Vercel infrastructure, reading MongoDB Atlas context and executing through AI Gateway.
          </p>
        </div>
        <button
          id="btn-create-job-modal"
          onClick={() => setIsCreateOpen(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-md glow-indigo transition-all self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create Scheduled Job
        </button>
      </div>

      {/* Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => {
          const isRunning = runningJobId === job.id;
          return (
            <div
              key={job.id}
              className={`glass-panel p-4 rounded-xl border transition-all flex flex-col justify-between ${
                job.status === 'active'
                  ? 'border-slate-800 hover:border-indigo-500/50'
                  : 'border-slate-800/60 opacity-75'
              }`}
            >
              <div>
                {/* Header row: title and status badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-white line-clamp-1">{job.name}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{job.description}</p>
                  </div>
                  <button
                    onClick={() => handleToggleStatus(job)}
                    title={`Click to ${job.status === 'active' ? 'pause' : 'resume'}`}
                    className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border transition-colors inline-flex items-center gap-1 ${
                      job.status === 'active'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {job.status === 'active' ? (
                      <>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        Active
                      </>
                    ) : (
                      <>
                        <Pause className="h-2.5 w-2.5" />
                        Paused
                      </>
                    )}
                  </button>
                </div>

                {/* Metadata badges */}
                <div className="space-y-2 mt-3 pt-3 border-t border-slate-800/80 text-xs">
                  {/* Cron Schedule */}
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Clock className="h-3 w-3 text-cyan-400" />
                      Cron:
                    </span>
                    <code className="px-1.5 py-0.5 bg-slate-950 rounded text-cyan-300 font-mono text-[11px] border border-slate-800">
                      {job.cronExpression}
                    </code>
                  </div>

                  {/* Target Collection in Atlas */}
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Database className="h-3 w-3 text-emerald-400" />
                      Target:
                    </span>
                    <span className="text-emerald-300 font-mono text-[11px] truncate max-w-[150px]">
                      {job.targetCollection}
                    </span>
                  </div>

                  {/* AI Model */}
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Cpu className="h-3 w-3 text-purple-400" />
                      Gateway Model:
                    </span>
                    <span className="text-purple-300 text-[11px] truncate max-w-[150px]">
                      {job.model}
                    </span>
                  </div>

                  {/* Next Run */}
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Next Due:</span>
                    <span className="text-slate-200">
                      {job.nextRunAt ? new Date(job.nextRunAt).toLocaleTimeString() : 'On next cron tick'}
                    </span>
                  </div>

                  {/* Total Runs */}
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Total Executions:</span>
                    <span className="text-slate-200 font-medium">{job.totalRuns || 0}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons footer */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <button
                  id={`btn-run-job-${job.id}`}
                  onClick={() => onRunJob(job.id)}
                  disabled={isRunning}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-medium transition-all hover:text-white disabled:opacity-50"
                >
                  <Play className={`h-3.5 w-3.5 fill-current ${isRunning ? 'animate-spin' : ''}`} />
                  {isRunning ? 'Executing via AI...' : 'Run Now'}
                </button>

                <button
                  onClick={() => handleDelete(job.id)}
                  title="Delete Job"
                  className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-transparent hover:border-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Job Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-indigo-400" />
                Create New Scheduled Job
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Job Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Daily Churn Analysis & Digest"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  placeholder="Summarize context and dispatch notifications"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Cron Schedule Expression
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="0 * * * *"
                    value={cronExpression}
                    onChange={(e) => setCronExpression(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-cyan-300 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setCronExpression('* * * * *')}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    >
                      Minutely
                    </button>
                    <button
                      type="button"
                      onClick={() => setCronExpression('0 * * * *')}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    >
                      Hourly
                    </button>
                    <button
                      type="button"
                      onClick={() => setCronExpression('0 9 * * *')}
                      className="px-1.5 py-0.5 text-[10px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded"
                    >
                      Daily 9am
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Target Atlas Collection
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. customer_feedback"
                    value={targetCollection}
                    onChange={(e) => setTargetCollection(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Task Type</label>
                  <select
                    value={taskType}
                    onChange={(e) => setTaskType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="ai_data_summary">AI Data Summary & Digest</option>
                    <option value="ai_sentiment_analysis">AI Sentiment & CX Analysis</option>
                    <option value="ai_anomaly_detection">AI Anomaly & Outlier Watchdog</option>
                    <option value="ai_custom_workflow">Custom LLM Pipeline</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">AI Gateway Model</label>
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="openai/gpt-4o-mini">OpenAI GPT-4o Mini (Default)</option>
                    <option value="openai/gpt-4o">OpenAI GPT-4o</option>
                    <option value="anthropic/claude-3-5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">System Prompt</label>
                <textarea
                  rows={2}
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">User Prompt Template</label>
                <textarea
                  rows={2}
                  value={userPromptTemplate}
                  onChange={(e) => setUserPromptTemplate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white glow-indigo disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Scheduled Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
