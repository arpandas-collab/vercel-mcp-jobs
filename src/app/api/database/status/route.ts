import { NextResponse } from 'next/server';
import { getDatabaseStatus, listAllCollections } from '@/lib/mongodb';

export async function GET() {
  try {
    const status = await getDatabaseStatus();
    const collections = await listAllCollections();
    return NextResponse.json({
      success: true,
      status,
      collections,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Database check failed' },
      { status: 500 }
    );
  }
}
