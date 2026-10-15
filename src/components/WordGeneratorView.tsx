'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  BookmarkPlus,
  ArrowRight,
  Info
} from 'lucide-react';
import { AudioPronounceButton } from './AudioPronounceButton';

interface WordGeneratorProps {
  onSavedSuccess: (newWordsCount: number) => void;
  onNavigateToStudy: () => void;
}

export const WordGeneratorView: React.FC<WordGeneratorProps> = ({
  onSavedSuccess,
  onNavigateToStudy,
}) => {
  const [count, setCount] = useState<number>(10);
  const [topic, setTopic] = useState<string>('daily life');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [wordType, setWordType] = useState<string>('mixed');
  const [includeRevision, setIncludeRevision] = useState<boolean>(true);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    themeContext: string;
    words: any[];
  } | null>(null);

  const beginnerTopics = [
    { id: 'daily life', title: 'Daily Life & Home', arabic: 'الحَيَاةُ اليَوْمِيَّة', note: 'Waking up, having breakfast, coffee, family life' },
    { id: 'food', title: 'Food & Ordering at a Cafe', arabic: 'الطَّعَامُ وَالمَطَاعِم', note: 'Favorite dishes, drinks, ordering, dining with friends' },
    { id: 'travel', title: 'Travel & Getting Around', arabic: 'السَّفَرُ وَالمَدِينَة', note: 'Asking for directions, taking a taxi, trains, airport' },
    { id: 'work', title: 'Work, Office & School', arabic: 'العَمَلُ وَالدِّرَاسَة', note: 'Colleagues, books, writing emails, meetings' },
    { id: 'technology', title: 'Technology & Internet', arabic: 'التِّكْنُولُوجِيَا وَالهَاتِف', note: 'Smartphones, apps, laptops, texting' },
    { id: 'emotions', title: 'Feelings & Everyday Small Talk', arabic: 'المَشَاعِرُ وَالحِوَار', note: 'Saying hello, how are you, happy, tired, patient' },
    { id: 'custom', title: 'Choose Your Own Topic...', arabic: 'مَوْضُوعٌ مِنْ اخْتِيَارِك', note: 'Type anything you want to learn words about' },
  ];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSaveSuccessMsg(null);
    setGeneratedResult(null);

    const effectiveTopic = topic === 'custom' ? (customTopic.trim() || 'Everyday Conversation') : topic;

    try {
      const res = await fetch('/api/word-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          count,
          topic: effectiveTopic,
          difficulty,
          wordType,
          includeRevision,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate vocabulary set');
      }

      const data = await res.json();
      setGeneratedResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with AI tutor');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToLibrary = async () => {
    if (!generatedResult || !generatedResult.words.length) return;
    setIsSaving(true);
    setError(null);

    try {
      const effectiveTopic = topic === 'custom' ? (customTopic.trim() || 'Everyday Conversation') : topic;
      const res = await fetch('/api/word-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          title: generatedResult.title,
          themeContext: generatedResult.themeContext,
          topic: effectiveTopic,
          difficulty,
          words: generatedResult.words,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save words');
      }

      const data = await res.json();
      setSaveSuccessMsg(data.message || 'Words successfully added to your Word Bank!');
      onSavedSuccess(data.savedCount);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error saving words');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-12 animate-fadeIn max-w-4xl mx-auto">
      {/* Friendly Header */}
      <div className="space-y-2 border-b border-[var(--border-subtle)] pb-6">
        <div className="text-xs uppercase tracking-wider font-semibold text-[var(--accent-ochre)]">
          AI Word Generator
        </div>
        <h1 className="editorial-title text-3xl sm:text-4xl font-semibold text-[var(--ink-primary)]">
          What would you like to learn today?
        </h1>
        <p className="text-sm text-[var(--ink-secondary)] max-w-2xl leading-relaxed">
          Pick a situation or topic below. The AI will teach you useful words that connect together in a natural story, complete with audio, vowel marks (harakat), and easy examples.
        </p>
      </div>

      {/* Generator Form */}
      <form onSubmit={handleGenerate} className="space-y-8">
        {/* Step 1: Choose a topic */}
        <div className="space-y-3">
          <label className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)] block">
            1. Pick a Topic
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {beginnerTopics.map((s) => {
              const isSelected = topic === s.id;
              return (
                <div
                  key={s.id}
                  onClick={() => setTopic(s.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[var(--accent-ochre-dim)] border-[var(--accent-ochre)] ring-1 ring-[var(--accent-ochre)]'
                      : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex justify-between items-baseline mb-1">
                    <span className="font-semibold text-sm text-[var(--ink-primary)]">
                      {s.title}
                    </span>
                    <span className="font-arabic text-lg text-[var(--accent-ochre)] font-bold">
                      {s.arabic}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)]">{s.note}</p>
                </div>
              );
            })}
          </div>

          {topic === 'custom' && (
            <div className="pt-2">
              <input
                type="text"
                placeholder="Type your own topic: e.g. Shopping at the market, visiting the doctor, playing football..."
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--accent-ochre)] text-[var(--ink-primary)] text-sm focus:outline-none placeholder:text-[var(--ink-muted)]"
                required
              />
            </div>
          )}
        </div>

        {/* Step 2, 3, 4: Simple Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 pt-4 border-t border-[var(--border-subtle)]">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)] block mb-1.5">
              2. How Many Words?
            </label>
            <select
              value={count}
              onChange={(e) => setCount(Number(e.target.value))}
              className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm focus:outline-none focus:border-[var(--accent-ochre)]"
            >
              <option value={5}>5 words (Quick lesson)</option>
              <option value={10}>10 words (Recommended)</option>
              <option value={15}>15 words (Challenge)</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)] block mb-1.5">
              3. Difficulty Level
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as any)}
              className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm focus:outline-none focus:border-[var(--accent-ochre)]"
            >
              <option value="beginner">Beginner (Easy everyday words)</option>
              <option value="intermediate">Intermediate (Conversational)</option>
              <option value="advanced">Advanced (Rich vocabulary)</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)] block mb-1.5">
              4. Word Types
            </label>
            <select
              value={wordType}
              onChange={(e) => setWordType(e.target.value)}
              className="w-full p-2.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm focus:outline-none focus:border-[var(--accent-ochre)]"
            >
              <option value="mixed">Mixed (Nouns, Verbs & Adjectives)</option>
              <option value="verbs">Verbs only (Actions)</option>
              <option value="nouns">Nouns only (Things & Objects)</option>
              <option value="adjectives">Adjectives only (Descriptions)</option>
              <option value="expressions">Everyday Expressions & Phrases</option>
            </select>
          </div>
        </div>

        {/* Review integration toggle */}
        <div className="flex items-start gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
          <input
            type="checkbox"
            id="includeRevision"
            checked={includeRevision}
            onChange={(e) => setIncludeRevision(e.target.checked)}
            className="mt-1 h-4 w-4 rounded accent-[var(--accent-ochre)] cursor-pointer"
          />
          <label htmlFor="includeRevision" className="text-xs text-[var(--ink-secondary)] cursor-pointer leading-relaxed">
            <span className="font-semibold text-[var(--ink-primary)] block">Review words I struggled with</span>
            The AI tutor will weave words you found tricky into the example sentences, so you can practice them naturally!
          </label>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-4 rounded-lg bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Generate Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-ochre py-3.5 px-8 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Weaving Storyline & Crafting Words...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Generate My Words</span>
            </>
          )}
        </button>
      </form>

      {/* ================= SKELETON LOADING ANIMATION ================= */}
      {isLoading && (
        <section className="space-y-8 pt-8 border-t border-[var(--border-subtle)] animate-fadeIn" aria-busy="true">
          {/* Skeleton Storyline Header */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <div className="space-y-2.5 w-full max-w-md">
                <div className="h-3 w-24 rounded-md skeleton-shimmer" />
                <div className="h-7 w-3/4 rounded-lg skeleton-shimmer" />
                <div className="h-4 w-full rounded-md skeleton-shimmer" />
              </div>
              <div className="h-10 w-36 rounded-xl skeleton-shimmer shrink-0" />
            </div>
            <div className="pt-2 flex items-center gap-2 text-xs text-[var(--accent-ochre)] font-medium">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Gemini is generating words with full harakāt, transliterations & context sentences...</span>
            </div>
          </div>

          {/* Skeleton Word Rows */}
          <div className="space-y-4">
            <div className="h-3 w-32 rounded-md skeleton-shimmer" />

            <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-[var(--border-subtle)]">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start px-3"
                >
                  {/* Left: Arabic word & root placeholder */}
                  <div className="md:col-span-4 space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full skeleton-shimmer shrink-0" />
                      <div className="h-9 w-28 rounded-lg skeleton-shimmer" />
                    </div>
                    <div className="h-3 w-20 rounded-md skeleton-shimmer ml-11" />
                    <div className="h-3 w-24 rounded-md skeleton-shimmer ml-11" />
                  </div>

                  {/* Middle: English translation placeholder */}
                  <div className="md:col-span-3 space-y-2">
                    <div className="h-3 w-16 rounded-md skeleton-shimmer" />
                    <div className="h-5 w-32 rounded-md skeleton-shimmer" />
                    <div className="h-4 w-24 rounded-md skeleton-shimmer" />
                  </div>

                  {/* Right: Example sentence + transliteration placeholder */}
                  <div className="md:col-span-5 space-y-2.5 pl-0 md:pl-4 border-l-0 md:border-l border-[var(--border-subtle)]">
                    <div className="flex justify-between items-center">
                      <div className="h-3 w-24 rounded-md skeleton-shimmer" />
                      <div className="w-7 h-7 rounded-full skeleton-shimmer" />
                    </div>
                    <div className="h-7 w-5/6 rounded-lg skeleton-shimmer ml-auto" />
                    <div className="h-3 w-4/6 rounded-md skeleton-shimmer" />
                    <div className="h-3 w-3/5 rounded-md skeleton-shimmer" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Generated Word List */}
      {!isLoading && generatedResult && (
        <section className="space-y-8 pt-8 border-t border-[var(--border-subtle)] animate-fadeIn">
          {/* Situation Storyline Card */}
          <div className="p-6 sm:p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--accent-ochre)]/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-[var(--accent-ochre)] uppercase tracking-wider">
                  Storyline
                </span>
                <h3 className="editorial-title text-2xl font-semibold text-[var(--ink-primary)] mt-0.5">
                  {generatedResult.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={handleSaveToLibrary}
                disabled={isSaving || !!saveSuccessMsg}
                className="btn-ochre py-2.5 px-5 rounded-lg text-xs font-semibold flex items-center gap-2 cursor-pointer self-start sm:self-auto disabled:opacity-60"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : saveSuccessMsg ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <BookmarkPlus className="w-4 h-4" />
                )}
                <span>{saveSuccessMsg ? 'Saved to Word Bank!' : 'Save Words to Word Bank'}</span>
              </button>
            </div>

            <p className="text-sm text-[var(--ink-secondary)] leading-relaxed italic border-l-2 border-[var(--accent-ochre)] pl-3.5">
              "{generatedResult.themeContext}"
            </p>

            {saveSuccessMsg && (
              <div className="pt-2 flex items-center justify-between text-xs text-[var(--accent-cypress)]">
                <span>✓ {saveSuccessMsg}</span>
                <button
                  onClick={onNavigateToStudy}
                  className="font-bold underline hover:text-[var(--ink-primary)] flex items-center gap-1 cursor-pointer"
                >
                  Start Practicing Flashcards Now <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Words List */}
          <div className="space-y-4">
            <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)]">
              Your {generatedResult.words.length} New Words
            </div>

            <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-[var(--border-subtle)]">
              {generatedResult.words.map((w, idx) => (
                <div
                  key={idx}
                  className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start hover:bg-[var(--accent-ochre-dim)]/40 px-3 rounded-lg transition-colors"
                >
                  {/* Arabic Word + Audio Button */}
                  <div className="md:col-span-4 space-y-1">
                    <div className="flex items-center gap-3">
                      <AudioPronounceButton arabicText={w.arabic} size="sm" />
                      <span className="font-arabic text-3xl font-bold text-[var(--accent-ochre)] harakat-text">
                        {w.arabic}
                      </span>
                    </div>
                    <div className="text-xs font-mono text-[var(--ink-muted)] pl-9">
                      {w.transliteration}
                    </div>
                    {w.root && (
                      <div className="text-xs text-[var(--ink-muted)] pl-9">
                        3-Letter Root: <strong className="text-[var(--ink-secondary)]">{w.root}</strong>
                      </div>
                    )}
                  </div>

                  {/* Meaning & Verb Forms */}
                  <div className="md:col-span-3 space-y-1">
                    <span className="text-[11px] font-semibold text-[var(--ink-muted)] uppercase tracking-wider">
                      {w.wordType}
                    </span>
                    <div className="font-serif text-lg font-semibold text-[var(--ink-primary)]">
                      {w.english}
                    </div>

                    {w.presentTenseI && (
                      <div className="text-xs text-[var(--ink-secondary)] pt-1">
                        <span className="font-arabic text-base text-[var(--accent-cypress)]">
                          أَنَا {w.presentTenseI} • هُوَ {w.presentTenseHe || '-'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Sentence Example in Context */}
                  <div className="md:col-span-5 space-y-1.5 pl-0 md:pl-4 border-l-0 md:border-l border-[var(--border-subtle)]">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-[var(--ink-muted)]">
                        Example Sentence:
                      </span>
                      <AudioPronounceButton arabicText={w.exampleArabic} size="sm" />
                    </div>
                    <p className="font-arabic text-lg font-semibold text-[var(--ink-primary)] harakat-text text-right leading-loose">
                      {w.exampleArabic}
                    </p>
                    {w.exampleTransliteration && (
                      <p className="text-xs text-[var(--ink-muted)] font-mono">
                        {w.exampleTransliteration}
                      </p>
                    )}
                    <p className="text-xs text-[var(--ink-secondary)] italic">
                      "{w.exampleEnglish}"
                    </p>
                    {w.explanation && (
                      <p className="text-xs text-[var(--ink-muted)] pt-1 flex items-start gap-1">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--accent-ochre)]" />
                        <span>{w.explanation}</span>
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
