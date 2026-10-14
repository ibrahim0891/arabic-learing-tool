import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-store';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { action = 'reset_all' } = body;

    if (action === 'reset_all') {
      // 1. Wipe Supabase tables
      try {
        await supabase.from('test_history').delete().neq('id', 'dummy');
        await supabase.from('study_sessions').delete().neq('id', 'dummy');
        await supabase.from('words').delete().neq('id', 'dummy');
        await supabase.from('word_sets').delete().neq('id', 'dummy');
      } catch (err) {
        console.warn('Supabase reset warning:', err);
      }

      // 2. Wipe SQLite tables
      try {
        db.prepare('DELETE FROM test_history').run();
        db.prepare('DELETE FROM study_sessions').run();
        db.prepare('DELETE FROM words').run();
        db.prepare('DELETE FROM word_sets').run();
      } catch (err) {
        console.warn('SQLite reset warning:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'All vocabulary, progress, study sessions, and word sets have been completely reset.',
      });
    }

    if (action === 'reset_progress_only') {
      // Keep words and sets, but reset test history, study sessions, and set all words back to 'new' with 0 repetition
      try {
        await supabase.from('test_history').delete().neq('id', 'dummy');
        await supabase.from('study_sessions').delete().neq('id', 'dummy');
        await supabase.from('words').update({
          times_tested: 0,
          times_correct: 0,
          times_incorrect: 0,
          memory_status: 'new',
          ease_factor: 2.5,
          interval_days: 0,
          repetition_count: 0,
          next_review_date: new Date().toISOString(),
          last_reviewed_date: null,
        }).neq('id', 'dummy');
      } catch (err) {
        console.warn('Supabase progress reset warning:', err);
      }

      try {
        db.prepare('DELETE FROM test_history').run();
        db.prepare('DELETE FROM study_sessions').run();
        db.prepare(`
          UPDATE words SET
            timesTested = 0,
            timesCorrect = 0,
            timesIncorrect = 0,
            memoryStatus = 'new',
            easeFactor = 2.5,
            intervalDays = 0,
            repetitionCount = 0,
            nextReviewDate = ?,
            lastReviewedDate = NULL
        `).run(new Date().toISOString());
      } catch (err) {
        console.warn('SQLite progress reset warning:', err);
      }

      return NextResponse.json({
        success: true,
        message: 'Your learning progress and quiz history have been reset. Your saved words have been kept!',
      });
    }

    return NextResponse.json({ error: 'Invalid reset action' }, { status: 400 });
  } catch (error) {
    console.error('Error during reset:', error);
    return NextResponse.json({ error: 'Failed to complete reset' }, { status: 500 });
  }
}
