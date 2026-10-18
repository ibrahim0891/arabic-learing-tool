import { NextRequest, NextResponse } from 'next/server';
import { dataStore } from '@/lib/supabase-store';
import { calculateNextReview } from '@/lib/srs';
import { checkWordDuplicate } from '@/lib/duplicate-checker';

// GET /api/words/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const word = await dataStore.getWord(id);
    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }
    return NextResponse.json(word);
  } catch (error) {
    console.error('Error fetching word:', error);
    return NextResponse.json({ error: 'Failed to fetch word' }, { status: 500 });
  }
}

// PUT /api/words/[id] - Submit review rating or edit word details
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    const existingWord = await dataStore.getWord(id);
    if (!existingWord) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    // Flashcard SM-2 review rating
    if (body.rating !== undefined) {
      const rating = Number(body.rating) as 1 | 2 | 3 | 4;
      const srsResult = calculateNextReview(existingWord, rating);

      const nowIso = new Date().toISOString();
      // "Hard" (2) is a pass in SM-2 terms (quality 3) and advances the recall
      // streak, so it must count as correct here too — otherwise the stats
      // contradict the memory status.
      const isPass = rating >= 2;
      const isUpdate = !!body.isUpdateRating;
      const newTimesTested = isUpdate ? (existingWord.timesTested || 1) : (existingWord.timesTested || 0) + 1;
      const newTimesCorrect = isPass ? (existingWord.timesCorrect || 0) + 1 : (existingWord.timesCorrect || 0);
      const newTimesIncorrect = !isPass ? (existingWord.timesIncorrect || 0) + 1 : (existingWord.timesIncorrect || 0);

      const updated = await dataStore.updateWord(id, {
        timesTested: newTimesTested,
        timesCorrect: newTimesCorrect,
        timesIncorrect: newTimesIncorrect,
        memoryStatus: srsResult.memoryStatus,
        easeFactor: srsResult.easeFactor,
        intervalDays: srsResult.intervalDays,
        repetitionCount: srsResult.repetitionCount,
        nextReviewDate: srsResult.nextReviewDate,
        lastReviewedDate: nowIso,
      });

      return NextResponse.json(updated);
    }

    // Manual word editing: verify no duplicate Arabic or English concept in other words
    if (body.arabic && body.english) {
      const existingWords = await dataStore.getWords();
      const duplicate = checkWordDuplicate(
        { arabic: body.arabic, english: body.english },
        existingWords.map(w => ({ id: w.id, arabic: w.arabic, english: w.english, transliteration: w.transliteration })),
        id
      );
      if (duplicate.isDuplicate) {
        return NextResponse.json(
          { error: duplicate.detail || 'Another word with this spelling or meaning already exists.' },
          { status: 409 }
        );
      }
    }

    const updated = await dataStore.updateWord(id, body);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating word:', error);
    return NextResponse.json({ error: 'Failed to update word' }, { status: 500 });
  }
}

// DELETE /api/words/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await dataStore.deleteWord(id);
    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Error deleting word:', error);
    return NextResponse.json({ error: 'Failed to delete word' }, { status: 500 });
  }
}
