# NexusCron: Vercel MCP Tools, MongoDB Atlas & AI Gateway Platform

A Next.js application designed for deployment on Vercel that exposes **Model Context Protocol (MCP)** tools for database connectivity and scheduled-job management, connects to **MongoDB Atlas**, and executes scheduled jobs using **Vercel's scheduling/workflow infrastructure** integrated with **Vercel AI Gateway**.

---

## 🌟 Key Features

1. **Vercel Model Context Protocol (MCP) Server (`/api/mcp`)**
   - Implements the official **MCP JSON-RPC 2.0** protocol.
   - Compatible with **Cursor**, **Claude Desktop**, **Windsurf**, and **Antigravity (`agy`)** agents.
   - Exposes **9 comprehensive tools** for MongoDB Atlas database connectivity and scheduled-job orchestration.

2. **MongoDB Atlas Database Connectivity**
   - Serverless connection pooling and client promise caching across function invocations (`src/lib/mongodb.ts`).
   - Unified data access layer with resilience fallback for offline / local sandbox testing.
   - Built-in collections: `scheduled_jobs`, `job_executions`, `customer_feedback`, `sales_leads`, `ai_summaries`.

3. **Vercel Scheduling & Workflow Infrastructure**
   - Declared in `vercel.json` crons specification (`path: "/api/cron/dispatcher"`, `schedule: "* * * * *"`).
   - Automated `CRON_SECRET` security verification (`Authorization: Bearer <CRON_SECRET>`).
   - Job parser supporting standard 5-field cron syntax (`cron-parser`) to evaluate due jobs and compute future run times.

4. **Vercel AI Gateway Integration**
   - High-performance unified proxy routing LLM calls to **OpenAI** (`gpt-4o-mini`, `gpt-4o`), **Anthropic** (`claude-3-5-sonnet`), and open-source models.
   - Edge caching and token usage tracking (prompt tokens, completion tokens, latency, cache status).
   - Automatic execution results logged directly back into MongoDB Atlas collections.

5. **Glassmorphic Mission Control Dashboard**
   - **Scheduled Jobs Manager**: Create, pause/resume, delete, or trigger jobs on demand.
   - **Interactive MCP Sandbox**: Test all 9 MCP tools directly with parameter editors and live JSON-RPC request/response inspection.
   - **AI Execution Logs & Telemetry**: Drill down into prompt payloads, contextual MongoDB documents, and AI Gateway metrics.
   - **MongoDB Atlas Explorer**: Browse collections, filter documents, and seed demo business data.

---

## 🛠️ Exposed Vercel MCP Tools

AI agents connecting to `https://<your-domain>.vercel.app/api/mcp` have access to the following tools:

### Database Connectivity Tools
| MCP Tool Name | Description | Key Parameters |
|---|---|---|
| `query_mongodb` | Query documents from an Atlas collection | `collection` (string), `filter` (object), `limit` (number) |
| `insert_mongodb_record` | Insert a new document into an Atlas collection | `collection` (string), `document` (object) |
| `update_mongodb_records` | Update documents matching a filter selector | `collection` (string), `filter` (object), `update` (object) |
| `get_mongodb_schema` | Inspect collections and sample document schemas | `collection` (optional string) |

### Scheduled-Job Management Tools
| MCP Tool Name | Description | Key Parameters |
|---|---|---|
| `create_scheduled_job` | Register a new cron job with AI prompt & Atlas target | `name`, `cronExpression`, `taskType`, `targetCollection`, `systemPrompt`, `userPromptTemplate`, `model` |
| `list_scheduled_jobs` | List all scheduled jobs and statuses | `status` ("active" \| "paused" \| "all") |
| `trigger_job_run` | Immediately execute a job on-demand via AI Gateway | `jobId` (string) |
| `update_job_status` | Toggle active/paused state or update cron schedule | `jobId` (string), `status`, `cronExpression` |
| `get_job_execution_history` | Retrieve execution telemetry and AI Gateway metrics | `jobId` (optional string), `limit` (number) |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```

Populate your credentials:
```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=vercel_jobs_db

# Vercel Cron Secret (Matches Vercel project settings)
CRON_SECRET=your-secure-cron-secret-token

# Vercel AI Gateway (or Cloudflare AI Gateway / OpenAI endpoint)
VERCEL_AI_GATEWAY_URL=https://api.openai.com/v1
AI_GATEWAY_TOKEN=sk-...
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🤖 Connecting to MCP Clients

### Cursor Configuration (`~/.cursor/mcp.json` or `.cursor/mcp.json`)
```json
{
  "mcpServers": {
    "vercel-mcp-jobs": {
      "url": "https://<your-vercel-domain>.vercel.app/api/mcp"
    }
  }
}
```

### Claude Desktop Configuration (`claude_desktop_config.json`)
```json
{
  "mcpServers": {
    "vercel-mcp-jobs": {
      "url": "https://<your-vercel-domain>.vercel.app/api/mcp"
    }
  }
}
```

---

## ☁️ Deploying to Vercel

1. Push this repository to GitHub / GitLab / Bitbucket.
2. Import the repository into your **Vercel Dashboard**.
3. Under **Project Settings > Environment Variables**, add:
   - `MONGODB_URI`
   - `MONGODB_DB`
   - `CRON_SECRET`
   - `VERCEL_AI_GATEWAY_URL`
   - `AI_GATEWAY_TOKEN`
4. Deploy! Vercel will automatically detect `vercel.json` and register the cron job scheduled under `/api/cron/dispatcher`.

---

## 📁 Project Architecture

```
vercel-mcp-jobs/
├── vercel.json                         # Vercel Cron infrastructure config
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── mcp/route.ts            # MCP JSON-RPC 2.0 endpoint (tools/list & tools/call)
│   │   │   ├── cron/dispatcher/route.ts# Vercel Cron workflow runner with CRON_SECRET auth
│   │   │   ├── jobs/route.ts           # CRUD endpoints for scheduled jobs
│   │   │   ├── jobs/[id]/run/route.ts  # On-demand manual trigger endpoint
│   │   │   ├── jobs/history/route.ts   # Execution telemetry log endpoint
│   │   │   ├── database/status/route.ts# MongoDB Atlas connection check
│   │   │   ├── database/query/route.ts # Collection query executor
│   │   │   ├── database/seed/route.ts  # Demo data seeder
│   │   │   └── ai/test/route.ts        # AI Gateway diagnostic route
│   │   ├── globals.css                 # Glassmorphic dark theme styles
│   │   ├── layout.tsx                  # Root layout & SEO metadata
│   │   └── page.tsx                    # Mission Control UI Dashboard
│   ├── components/
│   │   ├── Header.tsx                  # Live system status pills & global triggers
│   │   ├── MetricsOverview.tsx         # Active jobs, tokens, Atlas docs, latency
│   │   ├── JobsManager.tsx             # Job schedule manager & creator modal
│   │   ├── McpSandbox.tsx              # Interactive MCP tool runner & JSON-RPC tester
│   │   ├── ExecutionHistory.tsx        # Execution log inspector & AI response viewer
│   │   ├── DatabaseExplorer.tsx        # MongoDB Atlas collection and document browser
│   │   └── VercelGuide.tsx             # Vercel deployment & AI Gateway setup guide
│   ├── lib/
│   │   ├── mongodb.ts                  # Atlas client connection pooling & data repository
│   │   ├── mock-db.ts                  # Sandbox in-memory fallback for local dev
│   │   ├── ai-gateway.ts               # Vercel AI Gateway client & execution runner
│   │   ├── scheduler.ts                # Cron parser & workflow orchestrator
│   │   └── mcp.ts                      # MCP tool definitions & handler
│   └── types/
│       └── index.ts                    # Shared TypeScript interfaces
```
