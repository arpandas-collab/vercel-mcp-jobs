'use client';

import React, { useState, useEffect } from 'react';
import { Database, Folder, RefreshCw, Plus, Search, FileText } from 'lucide-react';

interface DbExplorerProps {
  collections: string[];
  onSeedData: () => void;
  isSeeding: boolean;
}

export function DatabaseExplorer({ collections, onSeedData, isSeeding }: DbExplorerProps) {
  const [selectedCol, setSelectedCol] = useState<string>(collections[0] || 'customer_feedback');
  const [documents, setDocuments] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [insertModalOpen, setInsertModalOpen] = useState(false);
  const [newDocJson, setNewDocJson] = useState('{\n  "title": "New Sample Record",\n  "status": "active"\n}');

  useEffect(() => {
    if (collections.length > 0 && !selectedCol) {
      setSelectedCol(collections[0]);
    }
  }, [collections, selectedCol]);

  const loadDocuments = async (col: string) => {
    if (!col) return;
    setLoading(true);
    try {
      let filter = {};
      if (filterQuery.trim()) {
        try {
          filter = JSON.parse(filterQuery);
        } catch {
          // ignore or alert
        }
      }
      const res = await fetch('/api/database/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ collection: col, filter, limit: 25 }),
      });
      const data = await res.json();
      if (data.success) {
        setDocuments(data.documents);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCol) {
      loadDocuments(selectedCol);
    }
  }, [selectedCol]);

  const handleInsertDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsed = JSON.parse(newDocJson);
      const res = await fetch('/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: Date.now(),
          method: 'tools/call',
          params: {
            name: 'insert_mongodb_record',
            arguments: {
              collection: selectedCol,
              document: parsed,
            },
          },
        }),
      });
      if (res.ok) {
        setInsertModalOpen(false);
        loadDocuments(selectedCol);
      }
    } catch (err) {
      alert('Invalid JSON document: ' + String(err));
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Database className="h-4 w-4 text-emerald-400" />
            MongoDB Atlas Data Explorer
          </h2>
          <p className="text-xs text-slate-400">
            Browse and query collections stored in MongoDB Atlas that feed context to scheduled AI jobs and record generated intelligence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => loadDocuments(selectedCol)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onSeedData}
            disabled={isSeeding}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 text-xs font-medium hover:bg-emerald-600/30 transition-colors"
          >
            Seed Sample Data
          </button>
          <button
            onClick={() => setInsertModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors glow-indigo"
          >
            <Plus className="h-3.5 w-3.5" />
            Insert Document
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Collections list */}
        <div className="lg:col-span-4 space-y-2">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            Collections ({collections.length})
          </div>
          <div className="space-y-1.5">
            {collections.map((col) => (
              <button
                key={col}
                id={`btn-col-${col}`}
                onClick={() => setSelectedCol(col)}
                className={`w-full text-left px-3.5 py-2.5 rounded-xl border transition-all text-xs flex items-center justify-between ${
                  selectedCol === col
                    ? 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300 font-semibold'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <Folder className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span className="font-mono text-xs">{col}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Documents viewer */}
        <div className="lg:col-span-8 space-y-3">
          {/* Filter Bar */}
          <div className="glass-panel p-2.5 rounded-xl border border-slate-800 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-500 shrink-0 ml-1" />
            <input
              type="text"
              placeholder='Filter JSON e.g. {"sentiment": "positive"}'
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadDocuments(selectedCol)}
              className="bg-transparent border-none text-xs text-white focus:outline-none flex-1 placeholder-slate-600 font-mono"
            />
            <button
              onClick={() => loadDocuments(selectedCol)}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-lg"
            >
              Filter
            </button>
          </div>

          {/* Documents Count & Content */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-3 border-b border-slate-800 pb-2">
              <span className="font-medium text-slate-200">
                Collection: <code className="text-emerald-400 font-mono">{selectedCol}</code>
              </span>
              <span>{documents.length} documents returned</span>
            </div>

            {loading ? (
              <div className="text-center py-12 text-slate-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                Querying MongoDB Atlas...
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12 text-slate-500 text-xs">
                No documents found in this collection.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {documents.map((doc, idx) => (
                  <div
                    key={String(doc._id || idx)}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-800/90 text-xs font-mono space-y-1 overflow-x-auto"
                  >
                    <div className="text-[10px] text-slate-500 flex items-center gap-1.5 mb-1">
                      <FileText className="h-3 w-3 text-emerald-400" />
                      _id: <span className="text-emerald-300">{String(doc._id || 'unknown')}</span>
                    </div>
                    <pre className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-wrap">
                      {JSON.stringify(doc, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insert Document Modal */}
      {insertModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-semibold text-white">
                Insert Document into <code className="text-emerald-400 font-mono">{selectedCol}</code>
              </h3>
              <button
                onClick={() => setInsertModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleInsertDoc} className="space-y-3">
              <textarea
                rows={8}
                value={newDocJson}
                onChange={(e) => setNewDocJson(e.target.value)}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-emerald-200 focus:outline-none focus:border-emerald-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInsertModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium"
                >
                  Insert Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
