import { NextRequest, NextResponse } from 'next/server';
import { generateQuiz } from '@/lib/quiz-generator';
import { dataStore } from '@/lib/supabase-store';
import { Word, QuizResult } from '@/lib/types';
import { checkAnswerTolerance, calculateNextReview } from '@/lib/srs';

// POST /api/quiz - Generate test OR Grade completed test
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // Action 1: "generate"
    if (action === 'generate') {
      const {
        setId,
        questionCount = 10,
        direction = 'mixed',
        questionTypes = ['multiple-choice', 'typing', 'fill-in-blank'],
        filter = 'all',
      } = body;

      let candidateWords = await dataStore.getWords({
        setId: setId !== 'all' ? setId : undefined,
        status: filter === 'struggling' ? 'struggling' : filter === 'new' ? 'new' : undefined,
        revision: filter === 'revision',
      });

      if (candidateWords.length === 0) {
        candidateWords = await dataStore.getWords();
      }

      if (candidateWords.length === 0) {
        return NextResponse.json({
          error: 'No words found in your Word Bank. Please generate or add words first before taking a test.',
        }, { status: 400 });
      }

      const count = Math.min(Number(questionCount) || 10, candidateWords.length * 2);
      const questions = generateQuiz({
        words: candidateWords,
        questionCount: count,
        direction,
        questionTypes,
      });

      return NextResponse.json({ questions, totalAvailableWords: candidateWords.length });
    }

    // Action 2: "grade"
    if (action === 'grade') {
      const { answers } = body;

      if (!answers || !Array.isArray(answers)) {
        return NextResponse.json({ error: 'Answers array required' }, { status: 400 });
      }

      const sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const nowIso = new Date().toISOString();
      const missedWordIds: string[] = [];
      const detailedResults = [];
      let score = 0;

      const allWords = await dataStore.getWords();
      const wordMap = new Map(allWords.map(w => [w.id, w]));

      for (const item of answers) {
        const { questionId, wordId, userAnswer, correctAnswer, acceptableAnswers = [] } = item;
        const isCorrect = checkAnswerTolerance(userAnswer, correctAnswer, acceptableAnswers);

        if (isCorrect) {
          score++;
        } else {
          missedWordIds.push(wordId);
        }

        const word = wordMap.get(wordId);
        let wordArabic = '';
        let wordEnglish = '';

        if (word) {
          wordArabic = word.arabic;
          wordEnglish = word.english;

          const rating = isCorrect ? 4 : 1;
          const srs = calculateNextReview(word, rating);

          await dataStore.updateWord(wordId, {
            timesTested: (word.timesTested || 0) + 1,
            timesCorrect: isCorrect ? (word.timesCorrect || 0) + 1 : (word.timesCorrect || 0),
            timesIncorrect: !isCorrect ? (word.timesIncorrect || 0) + 1 : (word.timesIncorrect || 0),
            memoryStatus: srs.memoryStatus,
            easeFactor: srs.easeFactor,
            intervalDays: srs.intervalDays,
            repetitionCount: srs.repetitionCount,
            nextReviewDate: srs.nextReviewDate,
            lastReviewedDate: nowIso,
          });
        }

        detailedResults.push({
          questionId,
          wordId,
          wordArabic,
          wordEnglish,
          userAnswer,
          correctAnswer,
          isCorrect,
        });
      }

      const total = answers.length;
      const accuracy = total > 0 ? Math.round((score / total) * 100) : 0;

      await dataStore.logSession({
        id: sessionId,
        date: nowIso,
        type: 'test',
        cardsStudied: total,
        score,
        totalQuestions: total,
        accuracyPercentage: accuracy,
        notes: `Quiz score: ${score}/${total} (${accuracy}%)`,
      });

      const result: QuizResult = {
        score,
        total,
        accuracy,
        missedWordIds: Array.from(new Set(missedWordIds)),
        detailedResults,
      };

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Error handling quiz request:', error);
    return NextResponse.json({ error: 'Failed to process quiz request' }, { status: 500 });
  }
}
