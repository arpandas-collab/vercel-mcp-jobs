import { NextRequest, NextResponse } from 'next/server';
import { fetchCollectionDocs } from '@/lib/mongodb';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { collection, filter, limit } = body;

    if (!collection) {
      return NextResponse.json({ success: false, error: 'Collection name is required' }, { status: 400 });
    }

    const docs = await fetchCollectionDocs(collection, filter || {}, limit || 20);
    return NextResponse.json({
      success: true,
      collection,
      count: docs.length,
      documents: docs,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Query failed' },
      { status: 500 }
    );
  }
}
