import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import db from './db';
import { Word, WordSet, DashboardStats, StudySessionLog, DraftWord, DailySentence, ConversationSession, ChatMessage, RootFamilyWord } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xqzkgespanhdzbudaeoz.supabase.co';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_aYl97LnIVJoQWLRslNWlWg_63YGRjK5';

// Direct Supabase client for API routes
export const supabase = createSupabaseClient(supabaseUrl, supabaseKey);

// Helper to convert Supabase row (snake_case) to DraftWord
export function mapSupabaseDraftToModel(row: any): DraftWord {
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
    createdAt: row.created_at || new Date().toISOString(),
    sourceTopic: row.source_topic,
  };
}

export function mapDraftModelToSupabase(draft: Partial<DraftWord>): any {
  return {
    id: draft.id,
    arabic: draft.arabic,
    transliteration: draft.transliteration || '',
    english: draft.english,
    word_type: draft.wordType || 'noun',
    present_tense_i: draft.presentTenseI || null,
    present_tense_he: draft.presentTenseHe || null,
    root: draft.root || null,
    example_arabic: draft.exampleArabic || '',
    example_transliteration: draft.exampleTransliteration || '',
    example_english: draft.exampleEnglish || '',
    explanation: draft.explanation || '',
    topic: draft.topic || 'daily life',
    difficulty: draft.difficulty || 'beginner',
    created_at: draft.createdAt || new Date().toISOString(),
    source_topic: draft.sourceTopic || null,
  };
}

// Helper to convert Supabase row (snake_case) to application Word (camelCase)
export function mapSupabaseWordToModel(row: any): Word {
  return {
    id: row.id,
    arabic: row.arabic,
    transliteration: row.transliteration || '',
    english: row.english,
    wordType: row.word_type || row.wordType || 'noun',
    presentTenseI: row.present_tense_i ?? row.presentTenseI,
    presentTenseHe: row.present_tense_he ?? row.presentTenseHe,
    root: row.root,
    exampleArabic: row.example_arabic ?? row.exampleArabic ?? '',
    exampleTransliteration: row.example_transliteration ?? row.exampleTransliteration ?? '',
    exampleEnglish: row.example_english ?? row.exampleEnglish ?? '',
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
    additionalExamples: typeof row.additional_examples === 'string'
      ? (() => { try { return JSON.parse(row.additional_examples); } catch (_) { return []; } })()
      : Array.isArray(row.additional_examples)
      ? row.additional_examples
      : typeof row.additionalExamples === 'string'
      ? (() => { try { return JSON.parse(row.additionalExamples); } catch (_) { return []; } })()
      : Array.isArray(row.additionalExamples)
      ? row.additionalExamples
      : [],
    rootFamily: typeof row.root_family === 'string'
      ? (() => { try { return JSON.parse(row.root_family); } catch (_) { return []; } })()
      : Array.isArray(row.root_family)
      ? row.root_family
      : typeof row.rootFamily === 'string'
      ? (() => { try { return JSON.parse(row.rootFamily); } catch (_) { return []; } })()
      : Array.isArray(row.rootFamily)
      ? row.rootFamily
      : [],
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
  if (word.additionalExamples !== undefined) row.additional_examples = JSON.stringify(word.additionalExamples);
  if (word.rootFamily !== undefined) row.root_family = JSON.stringify(word.rootFamily);
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
        const words = data.map(mapSupabaseWordToModel);
        // Merge local SQLite additionalExamples if Supabase schema lacks the column
        try {
          const examplesById = new Map<string, any[]>();
          const examplesByArabic = new Map<string, any[]>();

          // 1. From dedicated word_additional_examples table
          try {
            const dedicatedRows = db.prepare("SELECT word_id, arabic, examples FROM word_additional_examples WHERE examples IS NOT NULL AND examples != ''").all() as any[];
            for (const item of dedicatedRows) {
              try {
                const parsed = JSON.parse(item.examples);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  if (item.word_id) examplesById.set(item.word_id, parsed);
                  if (item.arabic) {
                    const cleanArabic = item.arabic.replace(/[\u064B-\u065F\u0670]/g, '').trim();
                    examplesByArabic.set(cleanArabic, parsed);
                  }
                }
              } catch (_) {}
            }
          } catch (_) {}

          // 2. From words table as fallback
          try {
            const localWordsWithExamples = db
              .prepare("SELECT id, arabic, additionalExamples FROM words WHERE additionalExamples IS NOT NULL AND additionalExamples != ''")
              .all() as { id: string; arabic: string; additionalExamples: string }[];
            
            for (const item of localWordsWithExamples) {
              try {
                const parsed = JSON.parse(item.additionalExamples);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  if (!examplesById.has(item.id)) examplesById.set(item.id, parsed);
                  if (item.arabic) {
                    const cleanArabic = item.arabic.replace(/[\u064B-\u065F\u0670]/g, '').trim();
                    if (!examplesByArabic.has(cleanArabic)) examplesByArabic.set(cleanArabic, parsed);
                  }
                }
              } catch (_) {}
            }
          } catch (_) {}

          for (const w of words) {
            const cleanArabic = (w.arabic || '').replace(/[\u064B-\u065F\u0670]/g, '').trim();
            const localEx = examplesById.get(w.id) || examplesByArabic.get(cleanArabic);
            if (localEx && (!w.additionalExamples || w.additionalExamples.length === 0)) {
              w.additionalExamples = localEx;
            }
          }

          // 3. Merge root family from word_root_families table
          try {
            const rootFamilyRows = db.prepare("SELECT word_id, root, arabic, family FROM word_root_families WHERE family IS NOT NULL AND family != ''").all() as any[];
            const familyById = new Map<string, any[]>();
            const familyByRoot = new Map<string, any[]>();
            const familyByArabic = new Map<string, any[]>();

            for (const item of rootFamilyRows) {
              try {
                const parsed = JSON.parse(item.family);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  if (item.word_id) familyById.set(item.word_id, parsed);
                  if (item.root) familyByRoot.set(item.root.replace(/\s+/g, '').trim(), parsed);
                  if (item.arabic) {
                    const cleanArabic = item.arabic.replace(/[\u064B-\u065F\u0670]/g, '').trim();
                    familyByArabic.set(cleanArabic, parsed);
                  }
                }
              } catch (_) {}
            }

            for (const w of words) {
              const cleanArabic = (w.arabic || '').replace(/[\u064B-\u065F\u0670]/g, '').trim();
              const cleanRoot = (w.root || '').replace(/\s+/g, '').trim();
              const localFam = familyById.get(w.id) || (cleanRoot ? familyByRoot.get(cleanRoot) : undefined) || familyByArabic.get(cleanArabic);
              if (localFam && (!w.rootFamily || w.rootFamily.length === 0)) {
                w.rootFamily = localFam;
              }
            }
          } catch (_) {}
        } catch (mergeErr) {
          console.error('Error merging local SQLite examples:', mergeErr);
        }

        return words;
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
    const rawRows = db.prepare(sql).all(...params) as any[];
    return rawRows.map(mapSupabaseWordToModel);
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
    let supabaseUpdatedData: any = null;

    // 1. Try Supabase update
    try {
      const { data, error } = await supabase.from('words').update(supabasePayload).eq('id', id).select().single();
      if (!error && data) {
        supabaseUpdatedData = data;
      } else if (error && supabasePayload.additional_examples) {
        // If Supabase table doesn't have additional_examples column yet, update other fields
        const strippedPayload = { ...supabasePayload };
        delete strippedPayload.additional_examples;
        if (Object.keys(strippedPayload).length > 0) {
          const retryRes = await supabase.from('words').update(strippedPayload).eq('id', id).select().single();
          if (!retryRes.error && retryRes.data) {
            supabaseUpdatedData = retryRes.data;
          }
        }
      }
    } catch (err) {}

    // 2. Persist additional examples to dedicated table
    if (updates.additionalExamples !== undefined) {
      try {
        const jsonExamples = JSON.stringify(updates.additionalExamples);
        const cleanArabic = (updates.arabic || '').replace(/[\u064B-\u065F\u0670]/g, '').trim();
        db.prepare(`
          INSERT OR REPLACE INTO word_additional_examples (word_id, arabic, examples, updated_at)
          VALUES (?, ?, ?, ?)
        `).run(id, cleanArabic, jsonExamples, new Date().toISOString());
      } catch (exErr) {
        console.error('Error saving to word_additional_examples:', exErr);
      }
    }

    // 3. Always update and persist to local SQLite words table
    try {
      const existingLocal = db.prepare('SELECT id, arabic FROM words WHERE id = ?').get(id) as any;
      if (!existingLocal) {
        let baseData = supabaseUpdatedData;
        if (!baseData) {
          const { data } = await supabase.from('words').select('*').eq('id', id).maybeSingle();
          baseData = data;
        }
        if (baseData) {
          db.prepare(`
            INSERT OR REPLACE INTO words (
              id, arabic, transliteration, english, wordType, presentTenseI, presentTenseHe, root,
              exampleArabic, exampleTransliteration, exampleEnglish, explanation, topic, difficulty,
              setId, setName, dateAdded, timesTested, timesCorrect, timesIncorrect, memoryStatus,
              easeFactor, intervalDays, repetitionCount, nextReviewDate, lastReviewedDate, additionalExamples
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            baseData.id, baseData.arabic, baseData.transliteration || '', baseData.english, baseData.word_type || baseData.wordType || 'noun',
            baseData.present_tense_i ?? baseData.presentTenseI ?? null, baseData.present_tense_he ?? baseData.presentTenseHe ?? null, baseData.root || null,
            baseData.example_arabic ?? baseData.exampleArabic ?? '', baseData.example_transliteration ?? baseData.exampleTransliteration ?? '', baseData.example_english ?? baseData.exampleEnglish ?? '',
            baseData.explanation || '', baseData.topic || 'daily life', baseData.difficulty || 'beginner',
            baseData.set_id ?? baseData.setId ?? null, baseData.set_name ?? baseData.setName ?? null, baseData.date_added ?? baseData.dateAdded ?? new Date().toISOString(),
            baseData.times_tested ?? baseData.timesTested ?? 0, baseData.times_correct ?? baseData.timesCorrect ?? 0, baseData.times_incorrect ?? baseData.timesIncorrect ?? 0,
            baseData.memory_status ?? baseData.memoryStatus ?? 'new', baseData.ease_factor ?? baseData.easeFactor ?? 2.5, baseData.interval_days ?? baseData.intervalDays ?? 0,
            baseData.repetition_count ?? baseData.repetitionCount ?? 0, baseData.next_review_date ?? baseData.nextReviewDate ?? new Date().toISOString(),
            baseData.last_reviewed_date ?? baseData.lastReviewedDate ?? null,
            updates.additionalExamples !== undefined ? JSON.stringify(updates.additionalExamples) : null
          );
        }
      } else {
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
            english = COALESCE(?, english),
            additionalExamples = COALESCE(?, additionalExamples)
          WHERE id = ?
        `).run(
          updates.timesTested ?? null, updates.timesCorrect ?? null, updates.timesIncorrect ?? null, updates.memoryStatus ?? null,
          updates.easeFactor ?? null, updates.intervalDays ?? null, updates.repetitionCount ?? null, updates.nextReviewDate ?? null,
          updates.lastReviewedDate ?? null, updates.arabic ?? null, updates.english ?? null,
          updates.additionalExamples !== undefined ? JSON.stringify(updates.additionalExamples) : null,
          id
        );
      }
    } catch (sqliteErr) {
      console.error('Error updating SQLite word:', sqliteErr);
    }

    // Return the updated word with additionalExamples properly merged
    const localRow = db.prepare('SELECT * FROM words WHERE id = ?').get(id);
    if (localRow) {
      const wordModel = mapSupabaseWordToModel(localRow);
      if (updates.additionalExamples !== undefined) {
        wordModel.additionalExamples = updates.additionalExamples;
      }
      return wordModel;
    }

    if (supabaseUpdatedData) {
      const wordModel = mapSupabaseWordToModel(supabaseUpdatedData);
      if (updates.additionalExamples !== undefined) {
        wordModel.additionalExamples = updates.additionalExamples;
      }
      return wordModel;
    }

    // Fallback if neither query returned, load existing word and apply updates
    const all = await this.getWords();
    const fallbackWord = all.find(w => w.id === id);
    if (fallbackWord) {
      return {
        ...fallbackWord,
        ...updates,
        additionalExamples: updates.additionalExamples !== undefined ? updates.additionalExamples : fallbackWord.additionalExamples,
      };
    }

    return null;
  },

  // Delete word
  async deleteWord(id: string): Promise<boolean> {
    try {
      await supabase.from('words').delete().eq('id', id);
    } catch (_) {}
    try {
      db.prepare('DELETE FROM words WHERE id = ?').run(id);
      db.prepare('DELETE FROM word_additional_examples WHERE word_id = ?').run(id);
    } catch (_) {}
    return true;
  },

  // Delete multiple words
  async deleteWords(ids: string[]): Promise<boolean> {
    if (!ids || ids.length === 0) return true;
    try {
      await supabase.from('words').delete().in('id', ids);
    } catch (_) {}
    const placeholders = ids.map(() => '?').join(',');
    try {
      db.prepare(`DELETE FROM words WHERE id IN (${placeholders})`).run(...ids);
      db.prepare(`DELETE FROM word_additional_examples WHERE word_id IN (${placeholders})`).run(...ids);
    } catch (_) {}
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
  },

  // Get aggregated dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const allWords = await this.getWords();
    const nowIso = new Date().toISOString();
    const todayStr = nowIso.split('T')[0];

    const totalWords = allWords.length;
    const totalLearned = allWords.filter(w => w.memoryStatus !== 'new').length;
    const currentlyStudying = allWords.filter(w => w.memoryStatus === 'learning').length;
    const struggling = allWords.filter(w => w.memoryStatus === 'struggling').length;
    const mastered = allWords.filter(w => w.memoryStatus === 'mastered').length;
    const readyForRevision = allWords.filter(w => w.memoryStatus !== 'new' && w.nextReviewDate <= nowIso).length;

    let recentSessions: StudySessionLog[] = [];
    let todayStudiedCount = 0;

    try {
      const { data } = await supabase.from('study_sessions').select('*').order('date', { ascending: false }).limit(6);
      if (data && data.length > 0) {
        recentSessions = data.map((r: any) => ({
          id: r.id,
          date: r.date,
          type: r.type,
          cardsStudied: Number(r.cards_studied || 0),
          score: r.score,
          totalQuestions: r.total_questions,
          accuracyPercentage: r.accuracy_percentage,
          notes: r.notes,
        }));
        todayStudiedCount = recentSessions
          .filter(s => (s.date || '').startsWith(todayStr))
          .reduce((acc, curr) => acc + (curr.cardsStudied || 0), 0);
      }
    } catch (_) {}

    if (recentSessions.length === 0) {
      try {
        recentSessions = db.prepare('SELECT * FROM study_sessions ORDER BY date DESC LIMIT 6').all() as StudySessionLog[];
        const todayRow = db.prepare("SELECT SUM(cardsStudied) as totalCards FROM study_sessions WHERE date LIKE ?").get(`${todayStr}%`) as { totalCards: number | null };
        todayStudiedCount = todayRow?.totalCards || 0;
      } catch (_) {}
    }

    return {
      totalWords,
      totalLearned,
      currentlyStudying,
      struggling,
      mastered,
      readyForRevision,
      todayStudiedCount,
      dailyGoal: 20,
      recentSessions,
      accuracyRate: totalLearned > 0 ? Math.min(100, Math.round(((mastered + currentlyStudying) / totalLearned) * 100)) : 85,
    };
  },

  // ================= DRAFT WORDS COLLECTION =================
  async getDraftWords(): Promise<DraftWord[]> {
    try {
      const { data, error } = await supabase.from('draft_words').select('*').order('created_at', { ascending: false });
      if (!error && data) {
        return data.map(mapSupabaseDraftToModel);
      }
    } catch (_) {}

    try {
      return db.prepare('SELECT * FROM draft_words ORDER BY createdAt DESC').all() as DraftWord[];
    } catch (_) {
      return [];
    }
  },

  // Save new unique draft words (ignores words already in draft or already in library)
  async saveDraftWords(words: Partial<DraftWord>[]): Promise<{ addedCount: number }> {
    const existingDrafts = await this.getDraftWords();
    const existingWords = await this.getWords();

    const knownArabic = new Set<string>([
      ...existingDrafts.map(d => d.arabic.replace(/[\u064B-\u065F\u0670]/g, '').trim()),
      ...existingWords.map(w => w.arabic.replace(/[\u064B-\u065F\u0670]/g, '').trim()),
    ]);

    const newDrafts: DraftWord[] = [];
    const nowIso = new Date().toISOString();

    for (const w of words) {
      if (!w.arabic) continue;
      const stripped = w.arabic.replace(/[\u064B-\u065F\u0670]/g, '').trim();
      if (knownArabic.has(stripped)) {
        continue; // Skip duplicates automatically
      }
      knownArabic.add(stripped);

      const draftItem: DraftWord = {
        id: w.id || `draft_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        arabic: w.arabic.trim(),
        transliteration: w.transliteration || '',
        english: (w.english || '').trim(),
        wordType: w.wordType || 'noun',
        presentTenseI: w.presentTenseI,
        presentTenseHe: w.presentTenseHe,
        root: w.root,
        exampleArabic: w.exampleArabic || '',
        exampleTransliteration: w.exampleTransliteration || '',
        exampleEnglish: w.exampleEnglish || '',
        explanation: w.explanation || '',
        topic: w.topic || 'daily life',
        difficulty: (w.difficulty as any) || 'beginner',
        createdAt: nowIso,
        sourceTopic: w.sourceTopic || w.topic,
      };
      newDrafts.push(draftItem);
    }

    if (newDrafts.length === 0) {
      return { addedCount: 0 };
    }

    // Insert to Supabase
    try {
      const payload = newDrafts.map(mapDraftModelToSupabase);
      await supabase.from('draft_words').insert(payload);
    } catch (_) {}

    // Insert to SQLite
    try {
      const insert = db.prepare(`
        INSERT OR REPLACE INTO draft_words (
          id, arabic, transliteration, english, wordType, presentTenseI, presentTenseHe, root,
          exampleArabic, exampleTransliteration, exampleEnglish, explanation, topic, difficulty,
          createdAt, sourceTopic
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      for (const d of newDrafts) {
        insert.run(
          d.id, d.arabic, d.transliteration, d.english, d.wordType,
          d.presentTenseI || null, d.presentTenseHe || null, d.root || null,
          d.exampleArabic, d.exampleTransliteration, d.exampleEnglish, d.explanation,
          d.topic, d.difficulty, d.createdAt, d.sourceTopic || null
        );
      }
    } catch (_) {}

    return { addedCount: newDrafts.length };
  },

  // Delete single draft word (e.g. after moving to word bank or rejecting)
  async deleteDraftWord(id: string): Promise<boolean> {
    try {
      await supabase.from('draft_words').delete().eq('id', id);
    } catch (_) {}
    try {
      db.prepare('DELETE FROM draft_words WHERE id = ?').run(id);
    } catch (_) {}
    return true;
  },

  // Clear all drafts
  async clearDraftWords(): Promise<boolean> {
    try {
      await supabase.from('draft_words').delete().neq('id', 'dummy');
    } catch (_) {}
    try {
      db.prepare('DELETE FROM draft_words').run();
    } catch (_) {}
    return true;
  },

  // Get current daily sentence
  async getDailySentence(): Promise<DailySentence | null> {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('daily_sentences')
        .select('*')
        .eq('id', 'current_daily_sentence')
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          arabic: data.arabic,
          transliteration: data.transliteration || '',
          english: data.english,
          slotDate: data.slot_date || data.slotDate || '',
          slotIndex: Number(data.slot_index ?? data.slotIndex ?? 0),
          updatedAt: data.updated_at || data.updatedAt || new Date().toISOString(),
        };
      }
    } catch (_) {}

    // 2. Try SQLite
    try {
      const row = db.prepare('SELECT * FROM daily_sentences WHERE id = ?').get('current_daily_sentence') as any;
      if (row) {
        return {
          id: row.id,
          arabic: row.arabic,
          transliteration: row.transliteration || '',
          english: row.english,
          slotDate: row.slotDate,
          slotIndex: Number(row.slotIndex || 0),
          updatedAt: row.updatedAt,
        };
      }
    } catch (_) {}

    return null;
  },

  // Set / Replace current daily sentence
  async setDailySentence(sentence: DailySentence): Promise<DailySentence> {
    // 1. Save to Supabase
    try {
      const payload = {
        id: 'current_daily_sentence',
        arabic: sentence.arabic,
        transliteration: sentence.transliteration,
        english: sentence.english,
        slot_date: sentence.slotDate,
        slot_index: sentence.slotIndex,
        updated_at: sentence.updatedAt,
      };
      await supabase.from('daily_sentences').upsert([payload]);
    } catch (_) {}

    // 2. Save to SQLite
    try {
      db.prepare(`
        INSERT OR REPLACE INTO daily_sentences (
          id, arabic, transliteration, english, slotDate, slotIndex, updatedAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        'current_daily_sentence',
        sentence.arabic,
        sentence.transliteration,
        sentence.english,
        sentence.slotDate,
        sentence.slotIndex,
        sentence.updatedAt
      );
    } catch (_) {}

    return sentence;
  },

  // Save new conversation session
  async saveConversation(conv: ConversationSession): Promise<ConversationSession> {
    // 1. Save to Supabase
    try {
      const payload = {
        id: conv.id,
        title: conv.title,
        topic: conv.topic,
        difficulty: conv.difficulty,
        speaker_count: conv.speakerCount,
        speakers: JSON.stringify(conv.speakers),
        messages: JSON.stringify(conv.messages),
        created_at: conv.createdAt,
      };
      await supabase.from('conversations').upsert([payload]);
    } catch (_) {}

    // 2. Save to SQLite
    try {
      db.prepare(`
        INSERT OR REPLACE INTO conversations (
          id, title, topic, difficulty, speakerCount, speakers, messages, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        conv.id,
        conv.title,
        conv.topic,
        conv.difficulty,
        conv.speakerCount,
        JSON.stringify(conv.speakers),
        JSON.stringify(conv.messages),
        conv.createdAt
      );
    } catch (_) {}

    return conv;
  },

  // Get all conversations list
  async getConversations(): Promise<ConversationSession[]> {
    // 1. Try Supabase
    try {
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data) && data.length > 0) {
        return data.map((row: any) => ({
          id: row.id,
          title: row.title,
          topic: row.topic,
          difficulty: row.difficulty,
          speakerCount: Number(row.speaker_count || row.speakerCount || 2),
          speakers: typeof row.speakers === 'string' ? (() => { try { return JSON.parse(row.speakers); } catch (_) { return []; } })() : (row.speakers || []),
          messages: typeof row.messages === 'string' ? (() => { try { return JSON.parse(row.messages); } catch (_) { return []; } })() : (row.messages || []),
          createdAt: row.created_at || row.createdAt || new Date().toISOString(),
        }));
      }
    } catch (_) {}

    // 2. Try SQLite
    try {
      const rows = db.prepare('SELECT * FROM conversations ORDER BY createdAt DESC').all() as any[];
      if (Array.isArray(rows) && rows.length > 0) {
        return rows.map((row: any) => ({
          id: row.id,
          title: row.title,
          topic: row.topic,
          difficulty: row.difficulty,
          speakerCount: Number(row.speakerCount || 2),
          speakers: typeof row.speakers === 'string' ? (() => { try { return JSON.parse(row.speakers); } catch (_) { return []; } })() : (row.speakers || []),
          messages: typeof row.messages === 'string' ? (() => { try { return JSON.parse(row.messages); } catch (_) { return []; } })() : (row.messages || []),
          createdAt: row.createdAt || new Date().toISOString(),
        }));
      }
    } catch (_) {}

    return [];
  },

  // Delete conversation by ID
  async deleteConversation(id: string): Promise<boolean> {
    try {
      await supabase.from('conversations').delete().eq('id', id);
    } catch (_) {}
    try {
      db.prepare('DELETE FROM conversations WHERE id = ?').run(id);
    } catch (_) {}
    return true;
  },

  // Save 6-10 generated root family words to Supabase cloud & SQLite cache
  async saveRootFamily(wordId: string, root: string, arabic: string, family: RootFamilyWord[]): Promise<void> {
    const jsonFamily = JSON.stringify(family);
    const cleanArabic = (arabic || '').replace(/[\u064B-\u065F\u0670]/g, '').trim();
    const cleanRoot = (root || '').trim();

    // 1. Try Supabase dedicated table
    try {
      await supabase.from('word_root_families').upsert([{
        word_id: wordId,
        root: cleanRoot,
        arabic: cleanArabic,
        family: family,
        updated_at: new Date().toISOString(),
      }]);
    } catch (_) {}

    // 1b. Also update root_family on words table in Supabase
    try {
      await supabase.from('words').update({ root_family: family }).eq('id', wordId);
    } catch (_) {}

    // 2. Persist to local SQLite word_root_families
    try {
      db.prepare(`
        INSERT OR REPLACE INTO word_root_families (word_id, root, arabic, family, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(wordId, cleanRoot, cleanArabic, jsonFamily, new Date().toISOString());
    } catch (e) {
      console.error('Error saving root family to SQLite:', e);
    }

    // 2b. Also persist into SQLite words table
    try {
      db.prepare('UPDATE words SET rootFamily = ? WHERE id = ?').run(jsonFamily, wordId);
    } catch (_) {}
  },

  // Retrieve root family words for a given word
  async getRootFamily(wordId: string, root?: string, arabic?: string): Promise<RootFamilyWord[]> {
    // 1. Try Supabase cloud table first
    try {
      const { data, error } = await supabase.from('word_root_families').select('family').eq('word_id', wordId).maybeSingle();
      if (!error && data?.family) {
        const parsed = typeof data.family === 'string' ? JSON.parse(data.family) : data.family;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    // 2. Try Supabase words table
    try {
      const { data, error } = await supabase.from('words').select('root_family').eq('id', wordId).maybeSingle();
      if (!error && data?.root_family) {
        const parsed = typeof data.root_family === 'string' ? JSON.parse(data.root_family) : data.root_family;
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    // 3. Try SQLite word_root_families table
    try {
      const row = db.prepare('SELECT family FROM word_root_families WHERE word_id = ?').get(wordId) as any;
      if (row?.family) {
        const parsed = JSON.parse(row.family);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}

    // 4. Try SQLite by root match or clean Arabic match
    try {
      if (root) {
        const cleanRoot = root.trim();
        const row = db.prepare('SELECT family FROM word_root_families WHERE root = ?').get(cleanRoot) as any;
        if (row?.family) {
          const parsed = JSON.parse(row.family);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
      if (arabic) {
        const cleanArabic = arabic.replace(/[\u064B-\u065F\u0670]/g, '').trim();
        const row = db.prepare('SELECT family FROM word_root_families WHERE arabic = ?').get(cleanArabic) as any;
        if (row?.family) {
          const parsed = JSON.parse(row.family);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      }
    } catch (_) {}

    return [];
  }
};
