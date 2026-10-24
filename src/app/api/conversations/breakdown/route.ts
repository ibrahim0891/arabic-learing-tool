import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase-store';
import { generateWordBreakdown } from '@/lib/word-breakdown';

/**
 * POST /api/conversations/breakdown
 *
 * Generates an on-demand word-by-word breakdown of a single Arabic dialogue line.
 * Optionally persists the result onto the stored conversation message so it is
 * not regenerated on every expand.
 *
 * Body: { arabic: string, english?: string, conversationId?: string, messageId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const arabic: string = (body?.arabic || '').trim();
    const english: string = (body?.english || '').trim();
    const conversationId: string | undefined = body?.conversationId;
    const messageId: string | undefined = body?.messageId;

    if (!arabic) {
      return NextResponse.json({ error: 'Missing Arabic sentence to break down' }, { status: 400 });
    }

    const breakdown = await generateWordBreakdown({
      arabic,
      english,
      register:
        'White Dialect / Educated Spoken Arabic (اللَّهْجَة الْبَيْضَاء) — the natural, contemporary conversational Arabic used across the Middle East.',
    });

    // Best-effort persistence onto the stored conversation / message
    if (conversationId && messageId && breakdown.length > 0) {
      try {
        const conversations = await dataStore.getConversations();
        const conversation = conversations.find((c) => c.id === conversationId);
        if (conversation) {
          conversation.messages = conversation.messages.map((m) =>
            m.id === messageId ? { ...m, breakdown } : m
          );
          await dataStore.saveConversation(conversation);
        }
      } catch (err) {
        console.error('Error persisting word breakdown:', err);
      }
    }

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
