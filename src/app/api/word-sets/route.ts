import { NextRequest, NextResponse } from 'next/server';
import { generateVocabularySet } from '@/lib/ai-generator';
import { dataStore } from '@/lib/supabase-store';
import { WordSet } from '@/lib/types';
import { stripHarakat } from '@/lib/srs';

// GET /api/word-sets - List saved word sets
export async function GET() {
  try {
    const sets = await dataStore.getWordSets();
    return NextResponse.json(sets);
  } catch (error) {
    console.error('Error fetching sets:', error);
    return NextResponse.json({ error: 'Failed to fetch word sets' }, { status: 500 });
  }
}

// POST /api/word-sets - Generate or Save vocabulary set
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Action: "generate"
    if (action === 'generate') {
      const {
        count = 10,
        topic = 'daily life',
        difficulty = 'beginner',
        wordType = 'mixed',
        includeRevision = false,
      } = body;

      const existingWords = await dataStore.getWords();
      const existingArabic = existingWords.map(w => w.arabic);

      let revisionWords: any[] = [];
      if (includeRevision) {
        revisionWords = existingWords
          .filter(w => w.memoryStatus === 'struggling' || new Date(w.nextReviewDate) <= new Date())
          .slice(0, 4);
      }

      const generatedSet = await generateVocabularySet({
        count: Number(count),
        topic,
        difficulty,
        wordType,
        excludeWords: existingArabic,
        revisionWords,
      });

      // Automatically save unique generated words to draft collection in database
      let draftsAdded = 0;
      if (generatedSet?.words && Array.isArray(generatedSet.words) && generatedSet.words.length > 0) {
        try {
          const draftResult = await dataStore.saveDraftWords(
            generatedSet.words.map(w => ({
              ...w,
              topic: (w as any).topic || topic,
              difficulty: (w as any).difficulty || difficulty,
              sourceTopic: topic,
            }))
          );
          draftsAdded = draftResult.addedCount;
        } catch (draftErr) {
          console.error('Failed to auto-save to draft:', draftErr);
        }
      }

      return NextResponse.json({
        ...generatedSet,
        autoSavedToDraftCount: draftsAdded,
      });
    }

    // Action: "save" - saves words to Supabase
    if (action === 'save') {
      const { title, themeContext, topic, difficulty, words } = body;

      if (!words || !Array.isArray(words) || words.length === 0) {
        return NextResponse.json({ error: 'No words provided to save' }, { status: 400 });
      }

      const setId = `set_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nowIso = new Date().toISOString();

      const existingWords = await dataStore.getWords();
      const existingSet = new Set(existingWords.map(w => stripHarakat(w.arabic)));

      const setRecord: WordSet = {
        id: setId,
        title: title || 'Vocabulary Set',
        themeContext: themeContext || '',
        topic: topic || 'daily life',
        difficulty: difficulty || 'beginner',
        createdAt: nowIso,
        wordsCount: 0,
      };

      const wordsToInsert = [];

      for (const w of words) {
        const stripped = stripHarakat(w.arabic);
        if (existingSet.has(stripped)) {
          continue; // Skip duplicate word
        }
        existingSet.add(stripped);

        const wordId = `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        wordsToInsert.push({
          id: wordId,
          arabic: w.arabic.trim(),
          transliteration: w.transliteration || '',
          english: w.english.trim(),
          wordType: w.wordType || 'noun',
          presentTenseI: w.presentTenseI || undefined,
          presentTenseHe: w.presentTenseHe || undefined,
          root: w.root || undefined,
          exampleArabic: w.exampleArabic || '',
          exampleTransliteration: w.exampleTransliteration || '',
          exampleEnglish: w.exampleEnglish || '',
          explanation: w.explanation || '',
          topic: topic || 'daily life',
          difficulty: difficulty || 'beginner',
          setId,
          setName: title || 'Vocabulary Set',
          dateAdded: nowIso,
          timesTested: 0,
          timesCorrect: 0,
          timesIncorrect: 0,
          memoryStatus: 'new' as const,
          easeFactor: 2.5,
          intervalDays: 0,
          repetitionCount: 0,
          nextReviewDate: nowIso,
        });
      }

      setRecord.wordsCount = wordsToInsert.length;
      await dataStore.saveWordSet(setRecord, wordsToInsert);

      return NextResponse.json({
        success: true,
        setId,
        savedCount: wordsToInsert.length,
        message: `Successfully saved ${wordsToInsert.length} new words to your Word Bank!`,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling word set request:', error);
    return NextResponse.json({ error: 'Failed to process word set' }, { status: 500 });
  }
}
