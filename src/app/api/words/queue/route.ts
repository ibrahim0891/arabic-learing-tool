import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase-store';
import {
  composeDeck,
  composePracticeDeck,
  computeDeckCounts,
  type DeckName,
} from '@/lib/srs';

const DECK_NAMES: readonly DeckName[] = ['smart', 'focus', 'revision', 'struggling', 'learning', 'all'];

// GET /api/words/queue - Compose a study deck server-side.
//
// Query params:
//   deck?: DeckName        one of smart | focus | revision | struggling | learning | all (default: smart)
//   practice?: 'true'      casual practice mode: below filters apply, SRS rules do not
//   ids?: string           comma-separated word ids (explicit deck from the Word Bank)
//   status?: string        status tab fallback when no ids are given ('all' | 'learning' | ...)
//
// Response: { words: Word[], counts: DeckCounts, total: number }
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const rawDeck = searchParams.get('deck');
    const deck: DeckName = rawDeck && (DECK_NAMES as readonly string[]).includes(rawDeck)
      ? (rawDeck as DeckName)
      : 'smart';
    const practice = searchParams.get('practice') === 'true';
    const idsParam = searchParams.get('ids');
    const status = searchParams.get('status') || undefined;
    const ids = idsParam ? idsParam.split(',').filter(Boolean) : undefined;

    const allWords = await dataStore.getWords();
    const counts = computeDeckCounts(allWords);

    // Casual practice with an explicit selection (ids or status tab) uses that
    // selection verbatim; an empty selection falls back to the normal deck rules.
    const hasExplicitSelection = Boolean((ids && ids.length > 0) || status);
    const deckWords = practice && hasExplicitSelection
      ? composePracticeDeck(allWords, { ids, status })
      : composeDeck(allWords, deck);

    return NextResponse.json({
      words: deckWords,
      counts,
      total: allWords.length,
    });
  } catch (error) {
    console.error('Error composing study queue:', error);
    return NextResponse.json({ error: 'Failed to compose study queue' }, { status: 500 });
  }
}
