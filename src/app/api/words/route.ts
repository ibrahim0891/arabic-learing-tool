import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase-store';
import { stripHarakat } from '@/lib/srs';
import { checkWordDuplicate } from '@/lib/duplicate-checker';

// GET /api/words - List and search words with filters
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const status = searchParams.get('status') || undefined;
    const topic = searchParams.get('topic') || undefined;
    const setId = searchParams.get('setId') || undefined;
    const revision = searchParams.get('revision') === 'true';

    const words = await dataStore.getWords({
      query,
      status,
      topic,
      setId,
      revision,
    });

    return NextResponse.json(words);
  } catch (error) {
    console.error('Error fetching words:', error);
    return NextResponse.json({ error: 'Failed to fetch words' }, { status: 500 });
  }
}

// POST /api/words - Add a word with duplicate prevention
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      arabic,
      transliteration,
      english,
      wordType,
      presentTenseI,
      presentTenseHe,
      root,
      exampleArabic,
      exampleTransliteration,
      exampleEnglish,
      explanation,
      topic,
      difficulty,
    } = body;

    if (!arabic || !english) {
      return NextResponse.json({ error: 'Arabic spelling and English translation are required' }, { status: 400 });
    }

    // Check duplicate — cross-check both Arabic spelling and English semantic meanings
    const existingWords = await dataStore.getWords();
    const duplicate = checkWordDuplicate(
      { arabic, english },
      existingWords.map(w => ({
        id: w.id,
        arabic: w.arabic,
        english: w.english,
        transliteration: w.transliteration,
      }))
    );

    if (duplicate.isDuplicate) {
      return NextResponse.json(
        { error: duplicate.detail || `A word with similar Arabic spelling or English meaning already exists in your Word Bank.` },
        { status: 409 }
      );
    }

    const id = `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nowIso = new Date().toISOString();

    const createdWord = await dataStore.insertWord({
      id,
      arabic: arabic.trim(),
      transliteration: transliteration || '',
      english: english.trim(),
      wordType: wordType || 'noun',
      presentTenseI: presentTenseI || undefined,
      presentTenseHe: presentTenseHe || undefined,
      root: root || undefined,
      exampleArabic: exampleArabic || '',
      exampleTransliteration: exampleTransliteration || '',
      exampleEnglish: exampleEnglish || '',
      explanation: explanation || '',
      topic: topic || 'daily life',
      difficulty: difficulty || 'beginner',
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

    return NextResponse.json(createdWord, { status: 201 });
  } catch (error) {
    console.error('Error creating word:', error);
    return NextResponse.json({ error: 'Failed to create word' }, { status: 500 });
  }
}

// DELETE /api/words - Batch delete words
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { ids } = body;
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'ids array is required' }, { status: 400 });
    }
    await dataStore.deleteWords(ids);
    return NextResponse.json({ success: true, count: ids.length });
  } catch (error) {
    console.error('Error deleting words:', error);
    return NextResponse.json({ error: 'Failed to delete words' }, { status: 500 });
  }
}

