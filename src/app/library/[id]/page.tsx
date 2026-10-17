'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Sparkles,
  BookOpen,
  Loader2,
  CheckCircle2,
  Plus,
  Trash2,
  AlertTriangle,
  RotateCcw,
  Compass,
  MessageSquare,
  Briefcase,
  Plane,
  GraduationCap,
  Volume2,
  Calendar,
  Layers,
  Award,
  Check,
  ChevronRight
} from 'lucide-react';
import { Word, ExampleSentence, RootFamilyWord } from '@/lib/types';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';
import { Button } from '@/components/ui/Button';
import { useStats } from '@/context/StatsContext';

export default function WordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const wordId = params?.id as string;
  const { refreshStats } = useStats();

  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Root Family state
  const [rootFamily, setRootFamily] = useState<RootFamilyWord[]>([]);
  const [loadingRootFamily, setLoadingRootFamily] = useState(false);
  const [rootFamilyError, setRootFamilyError] = useState<string | null>(null);
  const [addingWordId, setAddingWordId] = useState<string | null>(null);
  const [addedWordIds, setAddedWordIds] = useState<Set<string>>(new Set());

  // Example sentences state
  const [selectedScenario, setSelectedScenario] = useState('generic');
  const [customInstruction, setCustomInstruction] = useState('');
  const [exampleCount, setExampleCount] = useState<number>(3);
  const [variationType, setVariationType] = useState<'balanced' | 'grammatical' | 'difficulty' | 'idiomatic'>('balanced');
  const [isGeneratingExamples, setIsGeneratingExamples] = useState(false);
  const [exampleErrorMsg, setExampleErrorMsg] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeletingExampleId, setIsDeletingExampleId] = useState<string | null>(null);

  // Fetch word details
  useEffect(() => {
    if (!wordId) return;

    async function loadWord() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/words/${wordId}`);
        if (!res.ok) {
          throw new Error('Word not found or error loading details');
        }
        const data: Word = await res.json();
        setWord(data);

        // Fetch or auto-load root family
        loadRootFamily(data);
      } catch (err: any) {
        console.error('Error loading word:', err);
        setError(err?.message || 'Failed to load word');
      } finally {
        setLoading(false);
      }
    }

    loadWord();
  }, [wordId]);

  // Load or fetch root family
  const loadRootFamily = async (currentWord: Word, force: boolean = false) => {
    // If the word already had cached root family in memory and not forcing
    if (!force && currentWord.rootFamily && currentWord.rootFamily.length > 0) {
      setRootFamily(currentWord.rootFamily);
      return;
    }

    setLoadingRootFamily(true);
    setRootFamilyError(null);

    try {
      // First check GET /api/words/[id]/root-family
      if (!force) {
        const getRes = await fetch(`/api/words/${currentWord.id}/root-family`);
        if (getRes.ok) {
          const getData = await getRes.json();
          if (getData.cached && getData.rootFamily && getData.rootFamily.length > 0) {
            setRootFamily(getData.rootFamily);
            if (getData.root && !currentWord.root) {
              setWord(prev => prev ? { ...prev, root: getData.root } : prev);
            }
            setLoadingRootFamily(false);
            return;
          }
        }
      }

      // If not cached or force regeneration requested, trigger POST
      const postRes = await fetch(`/api/words/${currentWord.id}/root-family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRegenerate: force }),
      });

      if (!postRes.ok) {
        throw new Error('Failed to generate root family');
      }

      const postData = await postRes.json();
      if (postData.rootFamily) {
        setRootFamily(postData.rootFamily);
      }
      if (postData.root && (!currentWord.root || force)) {
        setWord(prev => prev ? { ...prev, root: postData.root } : prev);
      }
    } catch (err: any) {
      console.error('Root family error:', err);
      setRootFamilyError(err?.message || 'Error communicating with AI root family service');
    } finally {
      setLoadingRootFamily(false);
    }
  };

  // Add derived root word to Library / Word Bank
  const handleAddDerivedWord = async (item: RootFamilyWord) => {
    if (!word || addedWordIds.has(item.id)) return;
    setAddingWordId(item.id);

    try {
      const payload: Partial<Word> = {
        id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        arabic: item.arabic,
        transliteration: item.transliteration,
        english: item.english,
        wordType: item.wordType || 'noun',
        root: word.root || undefined,
        exampleArabic: item.exampleArabic,
        exampleTransliteration: item.exampleTransliteration,
        exampleEnglish: item.exampleEnglish,
        explanation: item.pattern ? `Derived from root "${word.root || word.arabic}" with pattern: ${item.pattern}` : `Root family of "${word.arabic}"`,
        topic: word.topic || 'vocabulary',
        difficulty: word.difficulty || 'beginner',
        setId: word.setId || undefined,
        setName: word.setName || undefined,
        dateAdded: new Date().toISOString(),
        memoryStatus: 'new',
        timesTested: 0,
        timesCorrect: 0,
        timesIncorrect: 0,
      };

      const res = await fetch('/api/words', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setAddedWordIds(prev => new Set(prev).add(item.id));
        refreshStats();
      }
    } catch (err) {
      console.error('Error adding derived word:', err);
    } finally {
      setAddingWordId(null);
    }
  };

  // Example sentences generation
  const handleGenerateExamples = async () => {
    if (!word) return;
    setIsGeneratingExamples(true);
    setExampleErrorMsg(null);

    try {
      const res = await fetch(`/api/words/${word.id}/examples`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenario: selectedScenario,
          customInstruction: customInstruction.trim(),
          count: exampleCount,
          variationType,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate examples');
      }

      const data = await res.json();
      if (data.word) {
        setWord(data.word);
      }
    } catch (err: any) {
      console.error('Example generation error:', err);
      setExampleErrorMsg(err?.message || 'Error generating examples');
    } finally {
      setIsGeneratingExamples(false);
    }
  };

  // Delete an example sentence
  const handleDeleteExample = async (exampleId: string) => {
    if (!word) return;
    setIsDeletingExampleId(exampleId);
    setExampleErrorMsg(null);

    try {
      const res = await fetch(`/api/words/${word.id}/examples?exampleId=${encodeURIComponent(exampleId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete example');
      }
      const data = await res.json();
      if (data.word) {
        setWord(data.word);
      }
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Delete example error:', err);
      setExampleErrorMsg(err?.message || 'Error deleting example');
    } finally {
      setIsDeletingExampleId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center p-6">
        <Loader2 className="w-8 h-8 text-[var(--accent-ochre)] animate-spin mb-3" />
        <p className="text-sm font-medium text-[var(--ink-secondary)]">Loading word profile...</p>
      </div>
    );
  }

  if (error || !word) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] p-6 sm:p-12 max-w-3xl mx-auto">
        <div className="p-8 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-[var(--accent-terracotta)] mx-auto" />
          <h2 className="text-xl font-bold text-[var(--ink-primary)]">Word Not Found</h2>
          <p className="text-sm text-[var(--ink-muted)]">{error || 'This word could not be found in your vocabulary bank.'}</p>
          <Link
            href="/library"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--accent-ochre)] text-[#121316] font-semibold text-xs transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Vocabulary Library
          </Link>
        </div>
      </div>
    );
  }

  const rawAdditional = word.additionalExamples || [];
  const parsedAdditional: ExampleSentence[] = Array.isArray(rawAdditional) ? rawAdditional : [];
  const accuracy = word.timesTested > 0 ? Math.round((word.timesCorrect / word.timesTested) * 100) : 0;

  const scenarios = [
    { id: 'generic', label: 'Everyday / Generic', icon: Compass },
    { id: 'dialogue', label: 'Spoken Dialogue', icon: MessageSquare },
    { id: 'travel', label: 'Travel & Dining', icon: Plane },
    { id: 'business', label: 'Work & Professional', icon: Briefcase },
    { id: 'academic', label: 'Academic & Formal', icon: GraduationCap },
  ];

  const variations = [
    { id: 'balanced', label: 'Balanced Mix', desc: 'Practical mix of common phrases' },
    { id: 'grammatical', label: 'Grammar Variations', desc: 'Different tenses, subjects & negations' },
    { id: 'difficulty', label: 'Progression', desc: 'From beginner to expressive phrases' },
    { id: 'idiomatic', label: 'Idiomatic / Expressions', desc: 'Collocations & natural native phrasing' },
  ];

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-24 animate-fadeIn">
      {/* Top Breadcrumb Bar */}
      <div className="sticky top-0 z-40 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border-subtle)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          <Link
            href="/library"
            className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--accent-ochre)] transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Vocabulary Library</span>
          </Link>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[var(--ink-muted)] hidden sm:inline">
              Tested {word.timesTested}x ({accuracy}% accuracy)
            </span>
            <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]">
              {word.memoryStatus}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        
        {/* HERO WORD CARD */}
        <section className="relative overflow-hidden rounded-3xl bg-[var(--bg-surface)] border-2 border-[var(--accent-ochre)]/25 p-6 sm:p-10 shadow-lg">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent-ochre)]/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            
            {/* Arabic Main Focus */}
            <div className="md:col-span-7 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs uppercase font-bold tracking-wider text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-3 py-1 rounded-full">
                  {word.wordType}
                </span>
                {word.root && (
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] flex items-center gap-1.5">
                    Root: <strong className="font-arabic text-sm text-[var(--accent-ochre)] font-bold tracking-wider">{word.root}</strong>
                  </span>
                )}
                {word.topic && (
                  <span className="text-xs text-[var(--ink-muted)]">
                    Topic: {word.topic}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-4">
                <AudioPronounceButton arabicText={word.arabic} size="lg" />
                <h1 className="font-arabic text-5xl sm:text-6xl md:text-7xl font-bold text-[var(--accent-ochre)] harakat-text leading-tight">
                  {word.arabic}
                </h1>
              </div>

              {word.transliteration && (
                <p className="text-lg sm:text-xl font-mono text-[var(--ink-secondary)] tracking-wide font-medium">
                  {word.transliteration}
                </p>
              )}

              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[var(--ink-primary)]">
                {word.english}
              </h2>

              {word.explanation && (
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] leading-relaxed max-w-xl">
                  {word.explanation}
                </p>
              )}

              {word.presentTenseI && (
                <div className="pt-2">
                  <span className="font-arabic text-lg text-[var(--accent-cypress)] harakat-text font-semibold px-4 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] inline-block">
                    أَنَا {word.presentTenseI} • هُوَ {word.presentTenseHe || '-'}
                  </span>
                </div>
              )}
            </div>

            {/* Quick Primary Sentence Highlight */}
            <div className="md:col-span-5 p-6 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5 text-[var(--accent-ochre)]" />
                  Primary Example Sentence
                </span>
                <AudioPronounceButton arabicText={word.exampleArabic} size="sm" />
              </div>

              <p dir="rtl" className="font-arabic text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] harakat-text leading-relaxed text-right">
                {word.exampleArabic}
              </p>

              {word.exampleTransliteration && (
                <p className="text-xs font-mono text-[var(--ink-secondary)]">
                  {word.exampleTransliteration}
                </p>
              )}

              <p className="text-sm font-serif italic text-[var(--ink-primary)]">
                "{word.exampleEnglish}"
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 2: ROOT FAMILY (6-10 DERIVED WORDS) */}
        <section className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
            <div>
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif text-[var(--ink-primary)] flex items-center gap-2">
                    Root Word Family (عَائِلَةُ الْجِذْر)
                    {word.root && (
                      <span className="font-arabic text-xl text-[var(--accent-ochre)] font-bold px-2.5 py-0.5 rounded-lg bg-[var(--accent-ochre-dim)]">
                        {word.root}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                    Explore 6–10 related words derived from this root, their morphological patterns, and real usage.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => loadRootFamily(word, true)}
              isLoading={loadingRootFamily}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Regenerate Root Words
            </Button>
          </div>

          {/* Root Family Content */}
          {loadingRootFamily ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 animate-pulse">
                  <div className="h-6 bg-[var(--border-subtle)] rounded-md w-1/3" />
                  <div className="h-8 bg-[var(--border-subtle)] rounded-md w-2/3" />
                  <div className="h-4 bg-[var(--border-subtle)] rounded-md w-1/2" />
                  <div className="h-16 bg-[var(--border-subtle)] rounded-xl w-full mt-2" />
                </div>
              ))}
            </div>
          ) : rootFamilyError ? (
            <div className="p-6 rounded-2xl bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/25 text-center space-y-3">
              <p className="text-xs text-[var(--accent-terracotta)] font-medium">{rootFamilyError}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={() => loadRootFamily(word, true)}
              >
                Try Again
              </Button>
            </div>
          ) : rootFamily.length === 0 ? (
            <div className="p-10 rounded-2xl border-2 border-dashed border-[var(--border-subtle)] text-center space-y-4 bg-[var(--bg-surface)]">
              <Sparkles className="w-8 h-8 text-[var(--accent-ochre)] mx-auto opacity-70" />
              <div>
                <h4 className="font-semibold text-sm text-[var(--ink-primary)]">No Root Family Generated Yet</h4>
                <p className="text-xs text-[var(--ink-muted)] mt-1 max-w-md mx-auto">
                  Instruct the AI to derive 6–10 related words from the root "{word.root || word.arabic}" with simple example sentences.
                </p>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => loadRootFamily(word, true)}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Generate 6–10 Root Words with AI
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {rootFamily.map((item, index) => {
                const isAdded = addedWordIds.has(item.id);
                const isAdding = addingWordId === item.id;

                return (
                  <div
                    key={item.id || index}
                    className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/50 transition shadow-xs flex flex-col justify-between space-y-4"
                  >
                    <div>
                      {/* Pattern & Word Type Header */}
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
                          {item.wordType}
                        </span>
                        {item.pattern && (
                          <span className="text-[10px] font-arabic font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]">
                            {item.pattern}
                          </span>
                        )}
                      </div>

                      {/* Main Derived Word Display */}
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-arabic text-3xl font-bold text-[var(--ink-primary)] harakat-text">
                            {item.arabic}
                          </p>
                          <p className="text-xs font-mono text-[var(--ink-secondary)] mt-0.5">
                            {item.transliteration}
                          </p>
                        </div>
                        <AudioPronounceButton arabicText={item.arabic} size="sm" />
                      </div>

                      <p className="font-serif text-base font-bold text-[var(--accent-ochre)] mt-2">
                        {item.english}
                      </p>

                      {/* Context Sentence */}
                      <div className="mt-3.5 p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <p dir="rtl" className="font-arabic text-base sm:text-lg font-medium text-[var(--ink-primary)] harakat-text text-right flex-1 leading-relaxed">
                            {item.exampleArabic}
                          </p>
                          <AudioPronounceButton arabicText={item.exampleArabic} size="sm" />
                        </div>
                        {item.exampleTransliteration && (
                          <p className="text-[11px] font-mono text-[var(--ink-muted)]">
                            {item.exampleTransliteration}
                          </p>
                        )}
                        <p className="text-xs text-[var(--ink-secondary)] italic font-serif">
                          "{item.exampleEnglish}"
                        </p>
                      </div>
                    </div>

                    {/* Bottom Action: Add to Word Bank */}
                    <div className="pt-2 border-t border-[var(--border-subtle)]">
                      <button
                        type="button"
                        onClick={() => handleAddDerivedWord(item)}
                        disabled={isAdded || isAdding}
                        className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isAdded
                            ? 'bg-[var(--accent-cypress)]/15 text-[var(--accent-cypress)] border border-[var(--accent-cypress)]/30'
                            : 'bg-[var(--bg-surface-elevated)] hover:bg-[var(--accent-ochre-dim)] text-[var(--ink-secondary)] hover:text-[var(--accent-ochre)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {isAdding ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Adding to Word Bank...</span>
                          </>
                        ) : isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Saved in Word Bank</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span>+ Add to Word Bank</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* SECTION 3: CONTEXTUAL EXAMPLE SENTENCES & AI GENERATOR */}
        <section className="space-y-6 pt-4">
          <div className="border-b border-[var(--border-subtle)] pb-4">
            <h3 className="text-xl font-bold font-serif text-[var(--ink-primary)] flex items-center gap-2">
              Contextual Example Sentences ({1 + parsedAdditional.length})
            </h3>
            <p className="text-xs text-[var(--ink-muted)] mt-0.5">
              Read how "{word.arabic}" is used across different situations, or generate additional sentences.
            </p>
          </div>

          {/* AI Generator Box */}
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[var(--accent-ochre)]" />
              <h4 className="font-semibold text-sm text-[var(--ink-primary)]">
                Generate More Situational Examples with AI
              </h4>
            </div>

            {/* Scenario Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                Situation / Setting
              </label>
              <div className="flex flex-wrap gap-2">
                {scenarios.map((sc) => {
                  const Icon = sc.icon;
                  const isSelected = selectedScenario === sc.id;
                  return (
                    <Button
                      key={sc.id}
                      type="button"
                      variant="pill"
                      size="sm"
                      isActive={isSelected}
                      onClick={() => setSelectedScenario(sc.id)}
                      leftIcon={<Icon className="w-3.5 h-3.5" />}
                    >
                      {sc.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Variation Focus */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                Variation Focus
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                {variations.map((v) => {
                  const isSelected = variationType === v.id;
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVariationType(v.id as any)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        isSelected
                          ? 'border-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)]'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:border-[var(--accent-ochre)]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[var(--ink-primary)]">{v.label}</span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-ochre)]" />}
                      </div>
                      <p className="text-[11px] text-[var(--ink-muted)] mt-0.5 line-clamp-1">{v.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Custom Input & Generate Button */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-9">
                <input
                  type="text"
                  placeholder="Custom instruction (e.g. 'At a pharmacy counter', 'Talking to an elder')..."
                  value={customInstruction}
                  onChange={(e) => setCustomInstruction(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)]"
                />
              </div>

              <div className="sm:col-span-3 flex items-center gap-2">
                <select
                  value={exampleCount}
                  onChange={(e) => setExampleCount(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-medium focus:outline-none"
                >
                  <option value={2}>2 Sentences</option>
                  <option value={3}>3 Sentences</option>
                  <option value={4}>4 Sentences</option>
                  <option value={5}>5 Sentences</option>
                </select>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  onClick={handleGenerateExamples}
                  isLoading={isGeneratingExamples}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  Generate
                </Button>
              </div>
            </div>

            {exampleErrorMsg && (
              <div className="text-xs text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 px-3 py-2 rounded-xl">
                {exampleErrorMsg}
              </div>
            )}
          </div>

          {/* List of Sentences */}
          <div className="space-y-4">
            
            {/* Primary Default Sentence */}
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--accent-ochre)]/25 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2.5 py-0.5 rounded-full capitalize">
                  Default Sentence (Main)
                </span>
                <AudioPronounceButton arabicText={word.exampleArabic} size="sm" />
              </div>

              <p dir="rtl" className="font-arabic text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] harakat-text leading-relaxed text-right">
                {word.exampleArabic}
              </p>

              {word.exampleTransliteration && (
                <p className="text-sm font-mono text-[var(--ink-secondary)]">
                  {word.exampleTransliteration}
                </p>
              )}

              <p className="text-sm sm:text-base text-[var(--ink-primary)] italic font-serif">
                "{word.exampleEnglish}"
              </p>
            </div>

            {/* Generated Additional Examples */}
            {parsedAdditional.map((ex, idx) => (
              <div
                key={ex.id || idx}
                className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 hover:border-[var(--accent-ochre)]/40 transition shadow-xs"
              >
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[11px] font-semibold text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2.5 py-0.5 rounded-full capitalize">
                    {ex.scenario || 'Generated Example'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <AudioPronounceButton arabicText={ex.arabic} size="sm" />
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(confirmDeleteId === ex.id ? null : ex.id)}
                      disabled={isDeletingExampleId === ex.id}
                      className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                      title="Delete sentence"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Inline Delete Confirmation */}
                {confirmDeleteId === ex.id && (
                  <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                      <span>Delete this example sentence?</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--ink-secondary)] bg-[var(--bg-surface)] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExample(ex.id)}
                        disabled={isDeletingExampleId === ex.id}
                        className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition cursor-pointer"
                      >
                        {isDeletingExampleId === ex.id ? 'Deleting...' : 'Confirm'}
                      </button>
                    </div>
                  </div>
                )}

                <p dir="rtl" className="font-arabic text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] harakat-text leading-relaxed text-right">
                  {ex.arabic}
                </p>

                {ex.transliteration && (
                  <p className="text-sm font-mono text-[var(--ink-secondary)]">
                    {ex.transliteration}
                  </p>
                )}

                <p className="text-sm sm:text-base text-[var(--ink-primary)] italic font-serif">
                  "{ex.english}"
                </p>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
