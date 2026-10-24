import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase-store';
import { generateWordBreakdown } from '@/lib/word-breakdown';
import { WordBreakdownItem } from '@/lib/types';

const EXAMPLE_REGISTER =
  'Analyze the sentence exactly as written — Modern Standard Arabic with full harakat or Educated Spoken Arabic (اللَّهْجَة الْبَيْضَاء).';

function hasMeaningfulBreakdown(breakdown: WordBreakdownItem[]): boolean {
  // The helper falls back to a naive token split when the AI is unavailable.
  // Never cache that low-quality fallback — the next request should retry the AI.
  return breakdown.some((word) => Boolean(word.english?.trim()));
}

/**
 * POST /api/words/[id]/breakdown
 *
 * Returns a word-by-word breakdown for a word's example sentence, using the
 * cached result stored in Supabase/SQLite whenever possible.
 *
 * Body:
 *   { exampleId?: string, forceRegenerate?: boolean }
 *
 * - No exampleId: breakdown for the word's primary example sentence.
 * - exampleId: breakdown for one of the word's additional examples.
 *
 * The sentence text always comes from the stored word, never from the client,
 * so a cached breakdown can never be attached to the wrong sentence.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const exampleId: string | undefined = body?.exampleId;
    const forceRegenerate: boolean = Boolean(body?.forceRegenerate);

    const word = await dataStore.getWord(id);
    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    // 1. Primary example sentence
    if (!exampleId) {
      const sentence = (word.exampleArabic || '').trim();
      if (!sentence) {
        return NextResponse.json({ error: 'This word has no primary example sentence' }, { status: 400 });
      }

      if (!forceRegenerate && word.exampleBreakdown?.length) {
        return NextResponse.json({
          success: true,
          breakdown: word.exampleBreakdown,
          cached: true,
        });
      }

      const breakdown = await generateWordBreakdown({
        arabic: sentence,
        english: word.exampleEnglish,
        register: EXAMPLE_REGISTER,
      });

      if (hasMeaningfulBreakdown(breakdown)) {
        await dataStore.updateWord(id, { exampleBreakdown: breakdown });
      }

      return NextResponse.json({ success: true, breakdown, cached: false });
    }

    // 2. Additional example sentence
    const currentExamples = word.additionalExamples || [];
    const example = currentExamples.find((item) => item.id === exampleId);
    if (!example) {
      return NextResponse.json({ error: 'Example sentence not found' }, { status: 404 });
    }

    const sentence = (example.arabic || '').trim();
    if (!sentence) {
      return NextResponse.json({ error: 'This example sentence is empty' }, { status: 400 });
    }

    if (!forceRegenerate && example.breakdown?.length) {
      return NextResponse.json({
        success: true,
        breakdown: example.breakdown,
        cached: true,
      });
    }

    const breakdown = await generateWordBreakdown({
      arabic: sentence,
      english: example.english,
      register: EXAMPLE_REGISTER,
    });

    if (hasMeaningfulBreakdown(breakdown)) {
      const updatedExamples = currentExamples.map((item) =>
        item.id === exampleId ? { ...item, breakdown } : item
      );
      await dataStore.updateWord(id, { additionalExamples: updatedExamples });
    }

    return NextResponse.json({ success: true, breakdown, cached: false });
  } catch (error) {
    console.error('Error generating word example breakdown:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate word breakdown';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
