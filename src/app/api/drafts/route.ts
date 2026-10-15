import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase-store';
import { stripHarakat } from '@/lib/srs';
import { Word, WordSet } from '@/lib/types';

// GET /api/drafts - Fetch all draft words
export async function GET() {
  try {
    const drafts = await dataStore.getDraftWords();
    return NextResponse.json({
      success: true,
      drafts,
      count: drafts.length,
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json({ error: 'Failed to fetch drafts' }, { status: 500 });
  }
}

// POST /api/drafts - Actions: 'save_to_library', 'delete', 'clear_all'
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Action: save_to_library (promote selected draft words to Word Bank)
    if (action === 'save_to_library') {
      const { draftIds, setName = 'Saved from Drafts' } = body;

      if (!draftIds || !Array.isArray(draftIds) || draftIds.length === 0) {
        return NextResponse.json({ error: 'No draft words selected' }, { status: 400 });
      }

      const allDrafts = await dataStore.getDraftWords();
      const selectedDrafts = allDrafts.filter(d => draftIds.includes(d.id));

      if (selectedDrafts.length === 0) {
        return NextResponse.json({ error: 'Selected drafts not found' }, { status: 404 });
      }

      const existingWords = await dataStore.getWords();
      const existingSet = new Set(existingWords.map(w => stripHarakat(w.arabic)));

      const setId = `set_draft_${Date.now()}`;
      const nowIso = new Date().toISOString();

      const wordsToInsert: Partial<Word>[] = [];
      const deletedDraftIds: string[] = [];

      for (const d of selectedDrafts) {
        const stripped = stripHarakat(d.arabic);
        if (!existingSet.has(stripped)) {
          existingSet.add(stripped);
          wordsToInsert.push({
            id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            arabic: d.arabic,
            transliteration: d.transliteration || '',
            english: d.english,
            wordType: d.wordType,
            presentTenseI: d.presentTenseI,
            presentTenseHe: d.presentTenseHe,
            root: d.root,
            exampleArabic: d.exampleArabic,
            exampleTransliteration: d.exampleTransliteration,
            exampleEnglish: d.exampleEnglish,
            explanation: d.explanation,
            topic: d.topic || 'daily life',
            difficulty: d.difficulty || 'beginner',
            setId,
            setName,
            dateAdded: nowIso,
            timesTested: 0,
            timesCorrect: 0,
            timesIncorrect: 0,
            memoryStatus: 'new',
            easeFactor: 2.5,
            intervalDays: 0,
            repetitionCount: 0,
            nextReviewDate: nowIso,
          });
        }
        deletedDraftIds.push(d.id);
      }

      // Save to words library if any new words
      if (wordsToInsert.length > 0) {
        const setRecord: WordSet = {
          id: setId,
          title: setName,
          themeContext: 'Selected from AI drafts collection',
          topic: selectedDrafts[0]?.topic || 'general',
          difficulty: selectedDrafts[0]?.difficulty || 'beginner',
          createdAt: nowIso,
          wordsCount: wordsToInsert.length,
        };
        await dataStore.saveWordSet(setRecord, wordsToInsert);
      }

      // Remove the migrated words from draft collection
      for (const id of deletedDraftIds) {
        await dataStore.deleteDraftWord(id);
      }

      return NextResponse.json({
        success: true,
        savedCount: wordsToInsert.length,
        removedFromDraftCount: deletedDraftIds.length,
        message: `Successfully saved ${wordsToInsert.length} words to Word Bank and removed them from Drafts!`,
      });
    }

    // Action: delete (delete specific draft word)
    if (action === 'delete') {
      const { id } = body;
      if (!id) return NextResponse.json({ error: 'Draft ID required' }, { status: 400 });
      await dataStore.deleteDraftWord(id);
      return NextResponse.json({ success: true });
    }

    // Action: clear_all (remove all drafts)
    if (action === 'clear_all') {
      await dataStore.clearDraftWords();
      return NextResponse.json({ success: true, message: 'Draft collection cleared' });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling draft request:', error);
    return NextResponse.json({ error: 'Failed to process draft request' }, { status: 500 });
  }
}
