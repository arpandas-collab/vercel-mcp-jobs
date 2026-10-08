import { NextResponse } from 'next/server';
import { insertCollectionDoc, getDb } from '@/lib/mongodb';

export async function POST() {
  try {
    const sampleLeads = [
      {
        company: 'Quantum Dynamics Ltd',
        contact: 'elena@quantumdynamics.ai',
        dealSize: 95000,
        stage: 'technical-eval',
        notes: 'Requested automated daily summarization of telemetry via Vercel MCP and Atlas.',
        createdAt: new Date().toISOString(),
      },
      {
        company: 'Aether Cloud Networks',
        contact: 'jordan@aethercloud.net',
        dealSize: 64000,
        stage: 'negotiation',
        notes: 'Interested in Vercel AI Gateway response caching to decrease LLM latency.',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
      },
    ];

    const sampleFeedbacks = [
      {
        customer: 'Stripe Integration Partner',
        feedback: 'The scheduled cron runs triggered right on time. AI digest captured all edge conditions accurately.',
        sentiment: 'positive',
        category: 'workflow_scheduling',
        score: 10,
        createdAt: new Date().toISOString(),
      },
      {
        customer: 'Solaris Health',
        feedback: 'Please ensure MongoDB Atlas collection indexes are optimized for the hourly batch query.',
        sentiment: 'neutral',
        category: 'performance',
        score: 6,
        createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
    ];

    const db = await getDb();
    if (db) {
      await db.collection('sales_leads').insertMany(sampleLeads);
      await db.collection('customer_feedback').insertMany(sampleFeedbacks);
    } else {
      for (const lead of sampleLeads) {
        await insertCollectionDoc('sales_leads', lead);
      }
      for (const fb of sampleFeedbacks) {
        await insertCollectionDoc('customer_feedback', fb);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Sample records seeded successfully into MongoDB Atlas collections: sales_leads, customer_feedback',
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Seeding failed' },
      { status: 500 }
    );
  }
}
