import { NextRequest, NextResponse } from 'next/server';
import { generateWordBreakdown } from '@/lib/word-breakdown';

/**
 * POST /api/breakdown
 *
 * Generic on-demand word-by-word breakdown for any Arabic sentence
 * (vocabulary example sentences, inline reading, etc.).
 *
 * Body: { arabic: string, english?: string, register?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const arabic: string = (body?.arabic || '').trim();
    const english: string = (body?.english || '').trim();
    const register: string = (body?.register || '').trim();

    if (!arabic) {
      return NextResponse.json({ error: 'Missing Arabic sentence to break down' }, { status: 400 });
    }

    const breakdown = await generateWordBreakdown({ arabic, english, register });

    return NextResponse.json({ success: true, breakdown });
  } catch (error) {
    console.error('Error in breakdown route:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate word breakdown';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
