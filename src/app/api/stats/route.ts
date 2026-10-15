import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase-store';

export async function GET() {
  try {
    const stats = await dataStore.getDashboardStats();
    return NextResponse.json(stats);
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch dashboard stats' }, { status: 500 });
  }
}
