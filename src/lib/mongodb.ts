import { MongoClient, Db } from 'mongodb';
import { getMockDatabase } from './mock-db';
import { DatabaseStatus, ScheduledJob, JobExecution } from '@/types';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'vercel_jobs_db';

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (MONGODB_URI) {
  if (process.env.NODE_ENV === 'development') {
    if (!global._mongoClientPromise) {
      client = new MongoClient(MONGODB_URI, {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
      });
      global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
  } else {
    client = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    clientPromise = client.connect();
  }
}

export async function getDb(): Promise<Db | null> {
  if (!MONGODB_URI || !clientPromise) {
    return null;
  }
  try {
    const connectedClient = await clientPromise;
    return connectedClient.db(MONGODB_DB);
  } catch (error) {
    console.warn('MongoDB connection error, falling back to local store:', error);
    return null;
  }
}

export async function getDatabaseStatus(): Promise<DatabaseStatus> {
  const uriConfigured = Boolean(MONGODB_URI && MONGODB_URI.trim().length > 0);
  const mockDb = getMockDatabase();

  if (!uriConfigured) {
    return {
      connected: true,
      type: 'local_fallback',
      databaseName: 'in_memory_sandbox (Configure MONGODB_URI for Atlas)',
      collectionsCount: mockDb.listCollections().length,
      activeJobsCount: mockDb.getJobs().filter((j) => j.status === 'active').length,
      totalExecutionsCount: mockDb.getExecutions().length,
      uriConfigured: false,
    };
  }

  try {
    const db = await getDb();
    if (db) {
      const collections = await db.listCollections().toArray();
      const activeJobs = await db.collection('scheduled_jobs').countDocuments({ status: 'active' }).catch(() => 0);
      const totalExecutions = await db.collection('job_executions').countDocuments().catch(() => 0);

      return {
        connected: true,
        type: 'atlas',
        databaseName: MONGODB_DB,
        collectionsCount: collections.length,
        activeJobsCount: activeJobs,
        totalExecutionsCount: totalExecutions,
        uriConfigured: true,
      };
    }
  } catch (err) {
    return {
      connected: false,
      type: 'atlas',
      databaseName: MONGODB_DB,
      collectionsCount: mockDb.listCollections().length,
      activeJobsCount: mockDb.getJobs().filter((j) => j.status === 'active').length,
      totalExecutionsCount: mockDb.getExecutions().length,
      uriConfigured: true,
      error: err instanceof Error ? err.message : 'Unknown connection error',
    };
  }

  return {
    connected: true,
    type: 'local_fallback',
    databaseName: 'in_memory_sandbox',
    collectionsCount: mockDb.listCollections().length,
    activeJobsCount: mockDb.getJobs().filter((j) => j.status === 'active').length,
    totalExecutionsCount: mockDb.getExecutions().length,
    uriConfigured: false,
  };
}

// Unified Data Access API (Atlas first, fallback to mock store)
export async function listAllCollections(): Promise<string[]> {
  const db = await getDb();
  if (db) {
    try {
      const cols = await db.listCollections().toArray();
      return cols.map((c) => c.name);
    } catch {
      // fallback
    }
  }
  return getMockDatabase().listCollections();
}

export async function fetchCollectionDocs(
  collectionName: string,
  filter: Record<string, unknown> = {},
  limit = 25
): Promise<Record<string, unknown>[]> {
  const db = await getDb();
  if (db) {
    try {
      const docs = await db.collection(collectionName).find(filter).limit(limit).toArray();
      return docs as unknown as Record<string, unknown>[];
    } catch {
      // fallback
    }
  }
  return getMockDatabase().getCollectionDocuments(collectionName, limit);
}

export async function insertCollectionDoc(
  collectionName: string,
  doc: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const db = await getDb();
  if (db) {
    try {
      const res = await db.collection(collectionName).insertOne(doc);
      return { ...doc, _id: res.insertedId.toString() };
    } catch {
      // fallback
    }
  }
  return getMockDatabase().insertDocument(collectionName, doc);
}

export async function updateCollectionDocs(
  collectionName: string,
  filter: Record<string, unknown>,
  update: Record<string, unknown>
): Promise<number> {
  const db = await getDb();
  if (db) {
    try {
      const res = await db.collection(collectionName).updateMany(filter, { $set: update });
      return res.modifiedCount;
    } catch {
      // fallback
    }
  }
  return getMockDatabase().updateDocuments(collectionName, filter, update);
}

// Scheduled Jobs Store Helpers
export async function getAllJobs(): Promise<ScheduledJob[]> {
  const db = await getDb();
  if (db) {
    try {
      const docs = await db.collection('scheduled_jobs').find({}).toArray();
      if (docs.length > 0) {
        return docs.map((d) => ({
          ...d,
          id: d.id || d._id.toString(),
        })) as unknown as ScheduledJob[];
      }
    } catch {
      // fallback
    }
  }
  return getMockDatabase().getJobs();
}

export async function getJobById(id: string): Promise<ScheduledJob | null> {
  const db = await getDb();
  if (db) {
    try {
      const doc = await db.collection('scheduled_jobs').findOne({ id });
      if (doc) {
        return { ...doc, id: doc.id || doc._id.toString() } as unknown as ScheduledJob;
      }
    } catch {
      // fallback
    }
  }
  return getMockDatabase().getJob(id) || null;
}

export async function saveJobRecord(job: ScheduledJob): Promise<ScheduledJob> {
  const db = await getDb();
  if (db) {
    try {
      const { _id, ...jobPayload } = job;
      await db.collection('scheduled_jobs').updateOne(
        { id: job.id },
        { $set: { ...jobPayload, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      return job;
    } catch {
      // fallback
    }
  }
  return getMockDatabase().saveJob(job);
}

export async function deleteJobRecord(id: string): Promise<boolean> {
  const db = await getDb();
  if (db) {
    try {
      const res = await db.collection('scheduled_jobs').deleteOne({ id });
      return res.deletedCount > 0;
    } catch {
      // fallback
    }
  }
  return getMockDatabase().deleteJob(id);
}

// Job Executions Store Helpers
export async function recordExecution(execution: JobExecution): Promise<JobExecution> {
  const db = await getDb();
  if (db) {
    try {
      const { _id, ...executionDoc } = execution;
      await db.collection('job_executions').insertOne(executionDoc as Record<string, unknown>);
      return execution;
    } catch {
      // fallback
    }
  }
  return getMockDatabase().saveExecution(execution);
}

export async function getRecentExecutions(limit = 50): Promise<JobExecution[]> {
  const db = await getDb();
  if (db) {
    try {
      const docs = await db.collection('job_executions').find({}).sort({ startTime: -1 }).limit(limit).toArray();
      if (docs.length > 0) {
        return docs as unknown as JobExecution[];
      }
    } catch {
      // fallback
    }
  }
  return getMockDatabase().getExecutions(limit);
}
