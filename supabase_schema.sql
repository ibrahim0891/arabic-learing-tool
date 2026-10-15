-- Run this SQL in your Supabase SQL Editor:
-- Project: https://supabase.com/dashboard/project/xqzkgespanhdzbudaeoz/sql

-- 1. Word Sets (Thematic Situations / Storylines)
CREATE TABLE IF NOT EXISTS public.word_sets (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  theme_context TEXT NOT NULL,
  topic TEXT NOT NULL,
  difficulty TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  words_count INTEGER NOT NULL DEFAULT 0
);

-- 2. Words (Vocabulary with diacritics, transliteration, sentences, and SM-2 memory parameters)
CREATE TABLE IF NOT EXISTS public.words (
  id TEXT PRIMARY KEY,
  arabic TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  english TEXT NOT NULL,
  word_type TEXT NOT NULL DEFAULT 'noun',
  present_tense_i TEXT,
  present_tense_he TEXT,
  root TEXT,
  example_arabic TEXT NOT NULL,
  example_transliteration TEXT NOT NULL,
  example_english TEXT NOT NULL,
  explanation TEXT,
  topic TEXT NOT NULL DEFAULT 'daily life',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  set_id TEXT REFERENCES public.word_sets(id) ON DELETE SET NULL,
  set_name TEXT,
  date_added TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  times_tested INTEGER NOT NULL DEFAULT 0,
  times_correct INTEGER NOT NULL DEFAULT 0,
  times_incorrect INTEGER NOT NULL DEFAULT 0,
  memory_status TEXT NOT NULL DEFAULT 'new', -- 'new', 'learning', 'struggling', 'mastered'
  ease_factor NUMERIC NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  next_review_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_reviewed_date TIMESTAMPTZ
);

-- Indexes for lightning-fast queries
CREATE INDEX IF NOT EXISTS idx_words_arabic ON public.words(arabic);
CREATE INDEX IF NOT EXISTS idx_words_memory_status ON public.words(memory_status);
CREATE INDEX IF NOT EXISTS idx_words_next_review ON public.words(next_review_date);
CREATE INDEX IF NOT EXISTS idx_words_set_id ON public.words(set_id);

-- 3. Study Sessions
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id TEXT PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  type TEXT NOT NULL, -- 'flashcard' or 'test'
  cards_studied INTEGER NOT NULL,
  score INTEGER,
  total_questions INTEGER,
  accuracy_percentage NUMERIC,
  notes TEXT
);

-- 4. Test History
CREATE TABLE IF NOT EXISTS public.test_history (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES public.study_sessions(id) ON DELETE CASCADE,
  word_id TEXT REFERENCES public.words(id) ON DELETE CASCADE,
  is_correct INTEGER NOT NULL,
  tested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Draft Words (Auto-saved generated words collection to review/select later)
CREATE TABLE IF NOT EXISTS public.draft_words (
  id TEXT PRIMARY KEY,
  arabic TEXT NOT NULL,
  transliteration TEXT NOT NULL,
  english TEXT NOT NULL,
  word_type TEXT NOT NULL DEFAULT 'noun',
  present_tense_i TEXT,
  present_tense_he TEXT,
  root TEXT,
  example_arabic TEXT NOT NULL,
  example_transliteration TEXT NOT NULL,
  example_english TEXT NOT NULL,
  explanation TEXT,
  topic TEXT NOT NULL DEFAULT 'daily life',
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  source_topic TEXT
);

CREATE INDEX IF NOT EXISTS idx_draft_words_arabic ON public.draft_words(arabic);

-- Enable Row Level Security (RLS) with open public access policies for anonymous/dev usage
ALTER TABLE public.word_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.draft_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on word_sets" ON public.word_sets FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on word_sets" ON public.word_sets FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on word_sets" ON public.word_sets FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on word_sets" ON public.word_sets FOR DELETE USING (true);

CREATE POLICY "Allow public read access on words" ON public.words FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on words" ON public.words FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on words" ON public.words FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on words" ON public.words FOR DELETE USING (true);

CREATE POLICY "Allow public read access on draft_words" ON public.draft_words FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on draft_words" ON public.draft_words FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access on draft_words" ON public.draft_words FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access on draft_words" ON public.draft_words FOR DELETE USING (true);

CREATE POLICY "Allow public read access on study_sessions" ON public.study_sessions FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on study_sessions" ON public.study_sessions FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read access on test_history" ON public.test_history FOR SELECT USING (true);
CREATE POLICY "Allow public insert access on test_history" ON public.test_history FOR INSERT WITH CHECK (true);
