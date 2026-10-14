import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import db from './db';
import { Word, WordSet, DashboardStats, StudySessionLog } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqzkgespanhdzbudaeoz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_aYl97LnIVJoQWLRslNWlWg_63YGRjK5';

// Direct Supabase client for API routes
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

// Helper to convert Supabase row (snake_case) to application Word (camelCase)
export function mapSupabaseWordToModel(row: any): Word {
  return {
    id: row.id,
    arabic: row.arabic,
    transliteration: row.transliteration || '',
    english: row.english,
    wordType: row.word_type || 'noun',
    presentTenseI: row.present_tense_i,
    presentTenseHe: row.present_tense_he,
    root: row.root,
    exampleArabic: row.example_arabic,
    exampleTransliteration: row.example_transliteration,
    exampleEnglish: row.example_english,
    explanation: row.explanation || '',
    topic: row.topic || 'daily life',
    difficulty: row.difficulty || 'beginner',
    setId: row.set_id,
    setName: row.set_name,
    dateAdded: row.date_added || new Date().toISOString(),
    timesTested: Number(row.times_tested || 0),
    timesCorrect: Number(row.times_correct || 0),
    timesIncorrect: Number(row.times_incorrect || 0),
    memoryStatus: row.memory_status || 'new',
    easeFactor: Number(row.ease_factor || 2.5),
    intervalDays: Number(row.interval_days || 0),
    repetitionCount: Number(row.repetition_count || 0),
    nextReviewDate: row.next_review_date || new Date().toISOString(),
    lastReviewedDate: row.last_reviewed_date,
  };
}

// Helper to convert Word model to Supabase row format
export function mapWordModelToSupabase(word: Partial<Word>): any {
  const row: any = {};
  if (word.id !== undefined) row.id = word.id;
  if (word.arabic !== undefined) row.arabic = word.arabic;
  if (word.transliteration !== undefined) row.transliteration = word.transliteration;
  if (word.english !== undefined) row.english = word.english;
  if (word.wordType !== undefined) row.word_type = word.wordType;
  if (word.presentTenseI !== undefined) row.present_tense_i = word.presentTenseI;
  if (word.presentTenseHe !== undefined) row.present_tense_he = word.presentTenseHe;
  if (word.root !== undefined) row.root = word.root;
  if (word.exampleArabic !== undefined) row.example_arabic = word.exampleArabic;
  if (word.exampleTransliteration !== undefined) row.example_transliteration = word.exampleTransliteration;
  if (word.exampleEnglish !== undefined) row.example_english = word.exampleEnglish;
  if (word.explanation !== undefined) row.explanation = word.explanation;
  if (word.topic !== undefined) row.topic = word.topic;
  if (word.difficulty !== undefined) row.difficulty = word.difficulty;
  if (word.setId !== undefined) row.set_id = word.setId;
  if (word.setName !== undefined) row.set_name = word.setName;
  if (word.dateAdded !== undefined) row.date_added = word.dateAdded;
  if (word.timesTested !== undefined) row.times_tested = word.timesTested;
  if (word.timesCorrect !== undefined) row.times_correct = word.timesCorrect;
  if (word.timesIncorrect !== undefined) row.times_incorrect = word.timesIncorrect;
  if (word.memoryStatus !== undefined) row.memory_status = word.memoryStatus;
  if (word.easeFactor !== undefined) row.ease_factor = word.easeFactor;
  if (word.intervalDays !== undefined) row.interval_days = word.intervalDays;
  if (word.repetitionCount !== undefined) row.repetition_count = word.repetitionCount;
  if (word.nextReviewDate !== undefined) row.next_review_date = word.nextReviewDate;
  if (word.lastReviewedDate !== undefined) row.last_reviewed_date = word.lastReviewedDate;
  return row;
}

/**
 * Universal Data Layer:
 * Tries Supabase first. If table is not yet created in Supabase project,
 * falls back gracefully to SQLite local database so the user is never blocked!
 */
export const dataStore = {
  // Get all words
  async getWords(filters?: { query?: string; status?: string; topic?: string; setId?: string; revision?: boolean }): Promise<Word[]> {
    try {
      let query = supabase.from('words').select('*');
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('memory_status', filters.status);
      }
      if (filters?.topic && filters.topic !== 'all') {
        query = query.eq('topic', filters.topic);
      }
      if (filters?.setId && filters.setId !== 'all') {
        query = query.eq('set_id', filters.setId);
      }
      if (filters?.revision) {
        query = query.lte('next_review_date', new Date().toISOString()).neq('memory_status', 'new');
      }
      if (filters?.query) {
        query = query.or(`arabic.ilike.%${filters.query}%,transliteration.ilike.%${filters.query}%,english.ilike.%${filters.query}%,example_arabic.ilike.%${filters.query}%`);
      }

      query = query.order('date_added', { ascending: false });

      const { data, error } = await query;
      if (!error && data) {
        return data.map(mapSupabaseWordToModel);
      }
    } catch (err) {
      // Supabase error, fall through to SQLite
    }

    // Local SQLite Fallback
    let sql = 'SELECT * FROM words WHERE 1=1';
    const params: any[] = [];
    if (filters?.query) {
      sql += ' AND (arabic LIKE ? OR transliteration LIKE ? OR english LIKE ? OR exampleArabic LIKE ?)';
      const term = `%${filters.query}%`;
      params.push(term, term, term, term);
    }
    if (filters?.status && filters.status !== 'all') {
      sql += ' AND memoryStatus = ?';
      params.push(filters.status);
    }
    if (filters?.topic && filters.topic !== 'all') {
      sql += ' AND topic = ?';
      params.push(filters.topic);
    }
    if (filters?.setId && filters.setId !== 'all') {
      sql += ' AND setId = ?';
      params.push(filters.setId);
    }
    if (filters?.revision) {
      sql += " AND nextReviewDate <= ? AND memoryStatus != 'new'";
      params.push(new Date().toISOString());
    }
    sql += ' ORDER BY dateAdded DESC';
    return db.prepare(sql).all(...params) as Word[];
  },

  // Save single word
  async insertWord(word: Partial<Word>): Promise<Word> {
    const supabasePayload = mapWordModelToSupabase(word);
    try {
      const { data, error } = await supabase.from('words').insert([supabasePayload]).select().single();
      if (!error && data) {
        // Also sync SQLite for offline backup
        try {
          db.prepare(`
            INSERT OR REPLACE INTO words (
              id, arabic, transliteration, english, wordType, presentTenseI, presentTenseHe, root,
              exampleArabic, exampleTransliteration, exampleEnglish, explanation, topic, difficulty,
              setId, setName, dateAdded, timesTested, timesCorrect, timesIncorrect, memoryStatus,
              easeFactor, intervalDays, repetitionCount, nextReviewDate
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            word.id, word.arabic, word.transliteration || '', word.english, word.wordType || 'noun',
            word.presentTenseI || null, word.presentTenseHe || null, word.root || null,
            word.exampleArabic || '', word.exampleTransliteration || '', word.exampleEnglish || '',
            word.explanation || '', word.topic || 'daily life', word.difficulty || 'beginner',
            word.setId || null, word.setName || null, word.dateAdded || new Date().toISOString(),
            word.timesTested || 0, word.timesCorrect || 0, word.timesIncorrect || 0,
            word.memoryStatus || 'new', word.easeFactor || 2.5, word.intervalDays || 0,
            word.repetitionCount || 0, word.nextReviewDate || new Date().toISOString()
          );
        } catch (_) {}
        return mapSupabaseWordToModel(data);
      }
    } catch (err) {}

    // Fallback SQLite
    db.prepare(`
      INSERT OR REPLACE INTO words (
        id, arabic, transliteration, english, wordType, presentTenseI, presentTenseHe, root,
        exampleArabic, exampleTransliteration, exampleEnglish, explanation, topic, difficulty,
        setId, setName, dateAdded, timesTested, timesCorrect, timesIncorrect, memoryStatus,
        easeFactor, intervalDays, repetitionCount, nextReviewDate
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      word.id, word.arabic, word.transliteration || '', word.english, word.wordType || 'noun',
      word.presentTenseI || null, word.presentTenseHe || null, word.root || null,
      word.exampleArabic || '', word.exampleTransliteration || '', word.exampleEnglish || '',
      word.explanation || '', word.topic || 'daily life', word.difficulty || 'beginner',
      word.setId || null, word.setName || null, word.dateAdded || new Date().toISOString(),
      word.timesTested || 0, word.timesCorrect || 0, word.timesIncorrect || 0,
      word.memoryStatus || 'new', word.easeFactor || 2.5, word.intervalDays || 0,
      word.repetitionCount || 0, word.nextReviewDate || new Date().toISOString()
    );
    return db.prepare('SELECT * FROM words WHERE id = ?').get(word.id) as Word;
  },

  // Save generated word set and words batch
  async saveWordSet(set: WordSet, words: Partial<Word>[]): Promise<{ savedCount: number }> {
    // Attempt Supabase
    try {
      const setPayload = {
        id: set.id,
        title: set.title,
        theme_context: set.themeContext,
        topic: set.topic,
        difficulty: set.difficulty,
        created_at: set.createdAt,
        words_count: words.length,
      };

      const wordsPayload = words.map(w => mapWordModelToSupabase(w));

      const { error: setError } = await supabase.from('word_sets').insert([setPayload]);
      if (!setError) {
        const { error: wordsError } = await supabase.from('words').insert(wordsPayload);
        if (!wordsError) {
          // Also sync SQLite
          try {
            db.prepare('INSERT OR REPLACE INTO word_sets VALUES (?, ?, ?, ?, ?, ?, ?)').run(
              set.id, set.title, set.themeContext, set.topic, set.difficulty, set.createdAt, words.length
            );
            for (const w of words) {
              this.insertWord(w);
            }
          } catch (_) {}
          return { savedCount: words.length };
        }
      }
    } catch (err) {}

    // Fallback SQLite
    db.prepare('INSERT OR REPLACE INTO word_sets VALUES (?, ?, ?, ?, ?, ?, ?)').run(
      set.id, set.title, set.themeContext, set.topic, set.difficulty, set.createdAt, words.length
    );
    for (const w of words) {
      db.prepare(`
        INSERT OR REPLACE INTO words (
          id, arabic, transliteration, english, wordType, presentTenseI, presentTenseHe, root,
          exampleArabic, exampleTransliteration, exampleEnglish, explanation, topic, difficulty,
          setId, setName, dateAdded, timesTested, timesCorrect, timesIncorrect, memoryStatus,
          easeFactor, intervalDays, repetitionCount, nextReviewDate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        w.id, w.arabic, w.transliteration || '', w.english, w.wordType || 'noun',
        w.presentTenseI || null, w.presentTenseHe || null, w.root || null,
        w.exampleArabic || '', w.exampleTransliteration || '', w.exampleEnglish || '',
        w.explanation || '', w.topic || 'daily life', w.difficulty || 'beginner',
        w.setId || null, w.setName || null, w.dateAdded || new Date().toISOString(),
        0, 0, 0, 'new', 2.5, 0, 0, w.nextReviewDate || new Date().toISOString()
      );
    }
    return { savedCount: words.length };
  },

  // Update single word
  async updateWord(id: string, updates: Partial<Word>): Promise<Word | null> {
    const supabasePayload = mapWordModelToSupabase(updates);
    try {
      const { data, error } = await supabase.from('words').update(supabasePayload).eq('id', id).select().single();
      if (!error && data) {
        // Also update local SQLite
        try {
          db.prepare(`
            UPDATE words SET
              timesTested = COALESCE(?, timesTested),
              timesCorrect = COALESCE(?, timesCorrect),
              timesIncorrect = COALESCE(?, timesIncorrect),
              memoryStatus = COALESCE(?, memoryStatus),
              easeFactor = COALESCE(?, easeFactor),
              intervalDays = COALESCE(?, intervalDays),
              repetitionCount = COALESCE(?, repetitionCount),
              nextReviewDate = COALESCE(?, nextReviewDate),
              lastReviewedDate = COALESCE(?, lastReviewedDate)
            WHERE id = ?
          `).run(
            updates.timesTested, updates.timesCorrect, updates.timesIncorrect, updates.memoryStatus,
            updates.easeFactor, updates.intervalDays, updates.repetitionCount, updates.nextReviewDate,
            updates.lastReviewedDate, id
          );
        } catch (_) {}
        return mapSupabaseWordToModel(data);
      }
    } catch (err) {}

    // Fallback SQLite
    db.prepare(`
      UPDATE words SET
        timesTested = COALESCE(?, timesTested),
        timesCorrect = COALESCE(?, timesCorrect),
        timesIncorrect = COALESCE(?, timesIncorrect),
        memoryStatus = COALESCE(?, memoryStatus),
        easeFactor = COALESCE(?, easeFactor),
        intervalDays = COALESCE(?, intervalDays),
        repetitionCount = COALESCE(?, repetitionCount),
        nextReviewDate = COALESCE(?, nextReviewDate),
        lastReviewedDate = COALESCE(?, lastReviewedDate),
        arabic = COALESCE(?, arabic),
        english = COALESCE(?, english)
      WHERE id = ?
    `).run(
      updates.timesTested, updates.timesCorrect, updates.timesIncorrect, updates.memoryStatus,
      updates.easeFactor, updates.intervalDays, updates.repetitionCount, updates.nextReviewDate,
      updates.lastReviewedDate, updates.arabic, updates.english, id
    );
    return db.prepare('SELECT * FROM words WHERE id = ?').get(id) as Word;
  },

  // Delete word
  async deleteWord(id: string): Promise<boolean> {
    try {
      await supabase.from('words').delete().eq('id', id);
    } catch (_) {}
    db.prepare('DELETE FROM words WHERE id = ?').run(id);
    return true;
  },

  // Get word sets
  async getWordSets(): Promise<WordSet[]> {
    try {
      const { data, error } = await supabase.from('word_sets').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map((row: any) => ({
          id: row.id,
          title: row.title,
          themeContext: row.theme_context,
          topic: row.topic,
          difficulty: row.difficulty,
          createdAt: row.created_at,
          wordsCount: Number(row.words_count || 0),
        }));
      }
    } catch (_) {}
    return db.prepare('SELECT * FROM word_sets ORDER BY createdAt DESC').all() as WordSet[];
  },

  // Log study session
  async logSession(session: StudySessionLog): Promise<void> {
    try {
      await supabase.from('study_sessions').insert([{
        id: session.id,
        date: session.date,
        type: session.type,
        cards_studied: session.cardsStudied,
        score: session.score,
        total_questions: session.totalQuestions,
        accuracy_percentage: session.accuracyPercentage,
        notes: session.notes,
      }]);
    } catch (_) {}

    try {
      db.prepare(`
        INSERT INTO study_sessions (id, date, type, cardsStudied, score, totalQuestions, accuracyPercentage, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        session.id, session.date, session.type, session.cardsStudied, session.score || null,
        session.totalQuestions || null, session.accuracyPercentage || null, session.notes || null
      );
    } catch (_) {}
  }
};
