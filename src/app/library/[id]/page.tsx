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
  Layers,
  Check,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sliders,
  Award,
  Calendar,
  Clock,
  TrendingUp,
  FileText,
  Volume2
} from 'lucide-react';
import { Word, ExampleSentence, RootFamilyWord } from '@/lib/types';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';
import { WordBreakdownPanel } from '@/components/WordBreakdownPanel';
import { Button } from '@/components/ui/Button';
import { useStats } from '@/context/StatsContext';

// Keep the example-sentence breakdown faithful to the sentence as written
const EXAMPLE_REGISTER =
  'Analyze the sentence exactly as written — Modern Standard Arabic with full harakat or Educated Spoken Arabic (اللَّهْجَة الْبَيْضَاء).';

type TabKey = 'rootFamily' | 'examples' | 'details';

export default function WordDetailPage() {
  const params = useParams();
  const router = useRouter();
  const wordId = params?.id as string;
  const { refreshStats } = useStats();

  const [word, setWord] = useState<Word | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('rootFamily');

  // Root Family state
  const [rootFamily, setRootFamily] = useState<RootFamilyWord[]>([]);
  const [loadingRootFamily, setLoadingRootFamily] = useState(false);
  const [rootFamilyError, setRootFamilyError] = useState<string | null>(null);
  const [addingWordId, setAddingWordId] = useState<string | null>(null);
  const [addedWordIds, setAddedWordIds] = useState<Set<string>>(new Set());

  // Linguistic Forms (Plural / Opposite) state
  const [loadingForms, setLoadingForms] = useState(false);
  const [formsError, setFormsError] = useState<string | null>(null);
  const [addingFormType, setAddingFormType] = useState<'plural' | 'opposite' | null>(null);
  const [addedFormTypes, setAddedFormTypes] = useState<Set<'plural' | 'opposite'>>(new Set());

  // Example sentences state
  const [selectedScenario, setSelectedScenario] = useState('generic');
  const [customInstruction, setCustomInstruction] = useState('');
  const [exampleCount, setExampleCount] = useState<number>(3);
  const [variationType, setVariationType] = useState<'balanced' | 'grammatical' | 'difficulty' | 'idiomatic'>('balanced');
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
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

        // Auto-load linguistic forms (plural/opposite)
        loadLinguisticForms(data);
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
    if (!force && currentWord.rootFamily && currentWord.rootFamily.length > 0) {
      setRootFamily(currentWord.rootFamily);
      return;
    }

    setLoadingRootFamily(true);
    setRootFamilyError(null);

    try {
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

  // Load or generate linguistic forms (plural / opposite)
  const loadLinguisticForms = async (currentWord: Word, force: boolean = false) => {
    if (!force && (currentWord.pluralArabic || currentWord.oppositeArabic)) {
      return;
    }

    setLoadingForms(true);
    setFormsError(null);

    try {
      if (!force) {
        const getRes = await fetch(`/api/words/${currentWord.id}/forms`);
        if (getRes.ok) {
          const getData = await getRes.json();
          if (getData.cached && (getData.plural || getData.opposite)) {
            setWord(prev => {
              if (!prev) return prev;
              return {
                ...prev,
                pluralArabic: getData.plural?.arabic ?? prev.pluralArabic,
                pluralTransliteration: getData.plural?.transliteration ?? prev.pluralTransliteration,
                pluralEnglish: getData.plural?.english ?? prev.pluralEnglish,
                oppositeArabic: getData.opposite?.arabic ?? prev.oppositeArabic,
                oppositeTransliteration: getData.opposite?.transliteration ?? prev.oppositeTransliteration,
                oppositeEnglish: getData.opposite?.english ?? prev.oppositeEnglish,
              };
            });
            setLoadingForms(false);
            return;
          }
        }
      }

      // Instruct AI to generate forms
      const postRes = await fetch(`/api/words/${currentWord.id}/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRegenerate: force }),
      });

      if (!postRes.ok) {
        throw new Error('Failed to generate linguistic forms');
      }

      const postData = await postRes.json();
      if (postData.word) {
        setWord(postData.word);
      } else if (postData.plural || postData.opposite) {
        setWord(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            pluralArabic: postData.plural?.arabic ?? prev.pluralArabic,
            pluralTransliteration: postData.plural?.transliteration ?? prev.pluralTransliteration,
            pluralEnglish: postData.plural?.english ?? prev.pluralEnglish,
            oppositeArabic: postData.opposite?.arabic ?? prev.oppositeArabic,
            oppositeTransliteration: postData.opposite?.transliteration ?? prev.oppositeTransliteration,
            oppositeEnglish: postData.opposite?.english ?? prev.oppositeEnglish,
          };
        });
      }
    } catch (err: any) {
      console.error('Linguistic forms error:', err);
      setFormsError(err?.message || 'Error generating linguistic forms');
    } finally {
      setLoadingForms(false);
    }
  };

  // Add plural or opposite form directly to Word Bank as a new entry
  const handleAddFormToWordBank = async (formType: 'plural' | 'opposite') => {
    if (!word || addedFormTypes.has(formType)) return;
    setAddingFormType(formType);

    const isPlural = formType === 'plural';
    const arabic = isPlural ? word.pluralArabic : word.oppositeArabic;
    const transliteration = isPlural ? word.pluralTransliteration : word.oppositeTransliteration;
    const english = isPlural ? word.pluralEnglish : word.oppositeEnglish;

    if (!arabic) return;

    try {
      const payload: Partial<Word> = {
        id: `word_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        arabic,
        transliteration: transliteration || '',
        english: english || (isPlural ? `Plural of ${word.english}` : `Opposite of ${word.english}`),
        wordType: isPlural ? (word.wordType === 'noun' ? 'noun' : 'adjective') : (word.wordType || 'noun'),
        root: word.root || undefined,
        exampleArabic: isPlural
          ? `هَذِهِ هِيَ ${arabic}.`
          : `عَكْسُ الكَلِمَةِ هُوَ ${arabic}.`,
        exampleTransliteration: '',
        exampleEnglish: isPlural
          ? `These are ${english || 'the plural forms'}.`
          : `The opposite is ${english || 'the antonym'}.`,
        explanation: isPlural
          ? `Plural form (الْجَمْع) of "${word.arabic}" (${word.english}).`
          : `Opposite / antonym (الضِّدّ) of "${word.arabic}" (${word.english}).`,
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
        setAddedFormTypes(prev => new Set(prev).add(formType));
        refreshStats();
      }
    } catch (err) {
      console.error('Error adding linguistic form to word bank:', err);
    } finally {
      setAddingFormType(null);
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
  const totalSentencesCount = 1 + parsedAdditional.length;

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
    <div className="p-6 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-6 animate-fadeIn pb-16">
      
      {/* Sleek Minimal Breadcrumb Header (No duplicate navbar) */}
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink-secondary)] hover:text-[var(--accent-ochre)] transition group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Word Bank</span>
          <span className="text-[var(--ink-muted)]">/</span>
          <span className="font-arabic font-bold text-sm text-[var(--accent-ochre)]">{word.arabic}</span>
        </Link>

        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--ink-muted)] hidden sm:inline">
            Tested {word.timesTested}x • {accuracy}% correct
          </span>
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
            word.memoryStatus === 'mastered' ? 'bg-[var(--accent-cypress)]/15 text-[var(--accent-cypress)]' :
            word.memoryStatus === 'struggling' ? 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]' :
            word.memoryStatus === 'learning' ? 'bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]' :
            'bg-[var(--bg-surface-elevated)] text-[var(--ink-muted)]'
          }`}>
            {word.memoryStatus}
          </span>
        </div>
      </div>

      {/* 2-COLUMN SPLIT MASTER-DETAIL LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
        
        {/* LEFT COLUMN: Pinned Word Profile & SRS Dossier (Sticky on Desktop) */}
        <aside className="lg:col-span-4 xl:col-span-4 space-y-4 lg:sticky lg:top-20 self-start">
          
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-52 h-52 bg-[var(--accent-ochre)]/5 rounded-full blur-2xl pointer-events-none -mr-12 -mt-12" />

            {/* Badges / Word Meta */}
            <div className="flex items-center gap-2 flex-wrap relative z-10">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2.5 py-0.5 rounded-full">
                {word.wordType}
              </span>
              {word.root && (
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] flex items-center gap-1.5">
                  Root: <strong className="font-arabic text-sm text-[var(--accent-ochre)] font-bold tracking-wider">{word.root}</strong>
                </span>
              )}
              {word.topic && (
                <span className="text-[11px] text-[var(--ink-muted)]">
                  {word.topic}
                </span>
              )}
            </div>

            {/* Arabic Word Display & Audio */}
            <div className="space-y-1.5 relative z-10">
              <div className="flex items-center justify-between gap-3">
                <h1 className="font-arabic text-4xl sm:text-5xl font-bold text-[var(--accent-ochre)] harakat-text leading-tight">
                  {word.arabic}
                </h1>
                <AudioPronounceButton arabicText={word.arabic} size="lg" />
              </div>
              {word.transliteration && (
                <p className="text-sm sm:text-base font-mono text-[var(--ink-secondary)] font-medium">
                  ({word.transliteration})
                </p>
              )}
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)] pt-1">
                {word.english}
              </h2>
            </div>

            {/* Verb Conjugation if applicable */}
            {word.presentTenseI && (
              <div className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block">Verb Conjugation</span>
                <span className="font-arabic text-sm text-[var(--accent-cypress)] harakat-text font-semibold">
                  أَنَا {word.presentTenseI} • هُوَ {word.presentTenseHe || '-'}
                </span>
              </div>
            )}

            {/* LINGUISTIC FORMS (Plural & Opposite) */}
            <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-ochre)] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Linguistic Forms (الصِّيَغ اللُّغَوِيَّة)
                </span>
                <button
                  type="button"
                  onClick={() => loadLinguisticForms(word, true)}
                  disabled={loadingForms}
                  className="text-[10px] font-semibold text-[var(--ink-secondary)] hover:text-[var(--accent-ochre)] flex items-center gap-1 transition cursor-pointer"
                  title="Regenerate forms with AI"
                >
                  <RotateCcw className={`w-3 h-3 ${loadingForms ? 'animate-spin' : ''}`} />
                  <span>{loadingForms ? 'Regenerating...' : 'Regenerate'}</span>
                </button>
              </div>

              {loadingForms && !word.pluralArabic && !word.oppositeArabic && (
                <div className="py-4 text-center space-y-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-ochre)] mx-auto" />
                  <p className="text-xs text-[var(--ink-muted)]">Generating plural & opposite forms with AI...</p>
                </div>
              )}

              {formsError && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>{formsError}</span>
                </div>
              )}

              {/* Forms Container */}
              <div className="space-y-2.5">
                {/* 1. Plural Form (الْجَمْع) */}
                {word.pluralArabic ? (
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-cypress)] bg-[var(--accent-cypress-dim)] px-2 py-0.5 rounded-full">
                        Plural • الْجَمْع
                      </span>
                      <div className="flex items-center gap-1">
                        <AudioPronounceButton arabicText={word.pluralArabic} size="sm" />
                        <button
                          type="button"
                          onClick={() => handleAddFormToWordBank('plural')}
                          disabled={addedFormTypes.has('plural') || addingFormType === 'plural'}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer ${
                            addedFormTypes.has('plural')
                              ? 'bg-[var(--accent-cypress-dim)] text-[var(--accent-cypress)] cursor-default'
                              : 'bg-[var(--accent-ochre)] text-white hover:opacity-90 shadow-2xs'
                          }`}
                          title="Save plural to Word Bank"
                        >
                          {addingFormType === 'plural' ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : addedFormTypes.has('plural') ? (
                            <>
                              <Check className="w-2.5 h-2.5" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-arabic text-xl font-bold text-[var(--accent-ochre)] harakat-text leading-tight">
                          {word.pluralArabic}
                        </p>
                        {word.pluralTransliteration && (
                          <p className="text-[11px] font-mono text-[var(--ink-secondary)]">
                            ({word.pluralTransliteration})
                          </p>
                        )}
                      </div>
                      <p className="font-serif text-xs font-semibold text-[var(--ink-primary)] text-right">
                        {word.pluralEnglish}
                      </p>
                    </div>
                  </div>
                ) : (
                  !loadingForms && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)]/40 border border-dashed border-[var(--border-subtle)] text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
                      <span>Plural (الْجَمْع): Not applicable for this word</span>
                    </div>
                  )
                )}

                {/* 2. Opposite / Antonym (الضِّدّ) */}
                {word.oppositeArabic ? (
                  <div className="p-3 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2 py-0.5 rounded-full">
                        Opposite • الضِّدّ
                      </span>
                      <div className="flex items-center gap-1">
                        <AudioPronounceButton arabicText={word.oppositeArabic} size="sm" />
                        <button
                          type="button"
                          onClick={() => handleAddFormToWordBank('opposite')}
                          disabled={addedFormTypes.has('opposite') || addingFormType === 'opposite'}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 transition cursor-pointer ${
                            addedFormTypes.has('opposite')
                              ? 'bg-[var(--accent-cypress-dim)] text-[var(--accent-cypress)] cursor-default'
                              : 'bg-[var(--accent-ochre)] text-white hover:opacity-90 shadow-2xs'
                          }`}
                          title="Save opposite to Word Bank"
                        >
                          {addingFormType === 'opposite' ? (
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                          ) : addedFormTypes.has('opposite') ? (
                            <>
                              <Check className="w-2.5 h-2.5" />
                              <span>Added</span>
                            </>
                          ) : (
                            <>
                              <Plus className="w-2.5 h-2.5" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-arabic text-xl font-bold text-[var(--accent-ochre)] harakat-text leading-tight">
                          {word.oppositeArabic}
                        </p>
                        {word.oppositeTransliteration && (
                          <p className="text-[11px] font-mono text-[var(--ink-secondary)]">
                            ({word.oppositeTransliteration})
                          </p>
                        )}
                      </div>
                      <p className="font-serif text-xs font-semibold text-[var(--ink-primary)] text-right">
                        {word.oppositeEnglish}
                      </p>
                    </div>
                  </div>
                ) : (
                  !loadingForms && (
                    <div className="p-2.5 rounded-lg bg-[var(--bg-surface)]/40 border border-dashed border-[var(--border-subtle)] text-[11px] text-[var(--ink-muted)] flex items-center justify-between">
                      <span>Opposite (الضِّدّ): Not applicable for this word</span>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Quick SRS Spaced Repetition Stats */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-center">
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]/60">
                <span className="text-[10px] text-[var(--ink-muted)] block">Accuracy</span>
                <span className="text-xs sm:text-sm font-bold text-[var(--accent-cypress)]">{accuracy}%</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]/60">
                <span className="text-[10px] text-[var(--ink-muted)] block">Tested</span>
                <span className="text-xs sm:text-sm font-bold text-[var(--ink-primary)]">{word.timesTested}x</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]/60">
                <span className="text-[10px] text-[var(--ink-muted)] block">Interval</span>
                <span className="text-xs sm:text-sm font-bold text-[var(--accent-ochre)]">{word.intervalDays || 0}d</span>
              </div>
            </div>

          </div>

        </aside>

        {/* RIGHT COLUMN: Expansive Tabbed Workspace */}
        <section className="lg:col-span-8 xl:col-span-8 space-y-5 min-w-0">
          
          {/* TAB NAVIGATION BAR */}
          <div className="flex items-center gap-1.5 sm:gap-2 border-b border-[var(--border-subtle)] pb-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('rootFamily')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'rootFamily'
                  ? 'bg-[var(--accent-ochre)] text-white shadow-xs font-bold'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Root Family (عَائِلَةُ الْجِذْر)</span>
              <span className="sm:hidden">Roots</span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                activeTab === 'rootFamily' ? 'bg-white/20 text-white' : 'bg-[var(--bg-surface-elevated)] text-[var(--ink-muted)]'
              }`}>
                {rootFamily.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('examples')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'examples'
                  ? 'bg-[var(--accent-ochre)] text-white shadow-xs font-bold'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Contextual Examples (أَمْثِلَة)</span>
              <span className="sm:hidden">Examples</span>
              <span className={`px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold ${
                activeTab === 'examples' ? 'bg-white/20 text-white' : 'bg-[var(--bg-surface-elevated)] text-[var(--ink-muted)]'
              }`}>
                {totalSentencesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('details')}
              className={`px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg sm:rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 sm:gap-2 transition cursor-pointer shrink-0 ${
                activeTab === 'details'
                  ? 'bg-[var(--accent-ochre)] text-white shadow-xs font-bold'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Linguistic Analysis & Stats</span>
              <span className="sm:hidden">Analysis</span>
            </button>
          </div>

        {/* ========================================================================= */}
        {/* TAB 1: ROOT FAMILY (6-10 DERIVED WORDS)                                  */}
        {/* ========================================================================= */}
        {activeTab === 'rootFamily' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Toolbar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-4 rounded-xl border border-[var(--border-subtle)]">
              <div>
                <h3 className="text-sm font-bold text-[var(--ink-primary)] flex items-center gap-2">
                  <span>Morphological Derivations for Root:</span>
                  <span className="font-arabic text-base text-[var(--accent-ochre)] font-bold px-2 py-0.5 rounded bg-[var(--accent-ochre-dim)]">
                    {word.root || word.arabic}
                  </span>
                </h3>
                <p className="text-xs text-[var(--ink-muted)] mt-0.5">
                  Understand how Arabic templates (*awzān*) derive nouns, verbs, and participles from this core root.
                </p>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => loadRootFamily(word, true)}
                isLoading={loadingRootFamily}
                leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                className="shrink-0"
              >
                Regenerate Root Words
              </Button>
            </div>

            {/* Root Family Grid */}
            {loadingRootFamily ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 animate-pulse">
                    <div className="h-4 bg-[var(--border-subtle)] rounded w-1/3" />
                    <div className="h-7 bg-[var(--border-subtle)] rounded w-2/3" />
                    <div className="h-4 bg-[var(--border-subtle)] rounded w-1/2" />
                    <div className="h-16 bg-[var(--border-subtle)] rounded-xl w-full" />
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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {rootFamily.map((item, index) => {
                  const isAdded = addedWordIds.has(item.id);
                  const isAdding = addingWordId === item.id;

                  return (
                    <div
                      key={item.id || index}
                      className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/50 transition shadow-xs flex flex-col justify-between space-y-3 group"
                    >
                      <div className="space-y-2.5">
                        {/* Header Badges */}
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
                            {item.wordType}
                          </span>
                          {item.pattern && (
                            <span className="text-[10px] font-arabic font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] truncate max-w-[140px]" title={item.pattern}>
                              {item.pattern}
                            </span>
                          )}
                        </div>

                        {/* Arabic Word & Audio */}
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="font-arabic text-2xl sm:text-3xl font-bold text-[var(--ink-primary)] harakat-text group-hover:text-[var(--accent-ochre)] transition-colors">
                              {item.arabic}
                            </p>
                            <p className="text-[11px] font-mono text-[var(--ink-secondary)] mt-0.5">
                              {item.transliteration}
                            </p>
                          </div>
                          <AudioPronounceButton arabicText={item.arabic} size="sm" />
                        </div>

                        <p className="font-serif text-sm font-bold text-[var(--accent-ochre)]">
                          {item.english}
                        </p>

                        {/* Sentence Box */}
                        <div className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1.5">
                          <div className="flex items-start justify-between gap-1.5">
                            <p dir="rtl" className="font-arabic text-lg sm:text-xl font-medium text-[var(--ink-primary)] harakat-text text-right flex-1 leading-relaxed">
                              {item.exampleArabic}
                            </p>
                            <AudioPronounceButton arabicText={item.exampleArabic} size="sm" />
                          </div>
                          {item.exampleTransliteration && (
                            <p className="text-xs font-mono text-[var(--ink-muted)]">
                              {item.exampleTransliteration}
                            </p>
                          )}
                          <p className="text-sm text-[var(--ink-secondary)] italic font-serif">
                            "{item.exampleEnglish}"
                          </p>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        type="button"
                        onClick={() => handleAddDerivedWord(item)}
                        disabled={isAdded || isAdding}
                        className={`w-full py-1.5 px-3 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                          isAdded
                            ? 'bg-[var(--accent-cypress)]/15 text-[var(--accent-cypress)] border border-[var(--accent-cypress)]/30'
                            : 'bg-[var(--bg-surface-elevated)] hover:bg-[var(--accent-ochre-dim)] text-[var(--ink-secondary)] hover:text-[var(--accent-ochre)] border border-[var(--border-subtle)]'
                        }`}
                      >
                        {isAdding ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Adding...</span>
                          </>
                        ) : isAdded ? (
                          <>
                            <Check className="w-3 h-3" />
                            <span>In Word Bank</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-3 h-3" />
                            <span>+ Add to Word Bank</span>
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CONTEXTUAL EXAMPLES (EXPANSIVE FULL-WIDTH STUDY FEED)             */}
        {/* ========================================================================= */}
        {activeTab === 'examples' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Contextual Examples Header & Generator Toggle Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--bg-surface)] p-4 sm:p-5 rounded-2xl border border-[var(--border-subtle)] shadow-xs">
              <div>
                <h3 className="text-sm font-bold text-[var(--ink-primary)] flex items-center gap-2">
                  <span>Contextual Examples</span>
                  <span className="font-arabic text-sm text-[var(--accent-ochre)] font-bold px-2 py-0.5 rounded bg-[var(--accent-ochre-dim)]">
                    {word.arabic}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-muted)]">
                    {totalSentencesCount} {totalSentencesCount === 1 ? 'sentence' : 'sentences'}
                  </span>
                </h3>
                <p className="text-xs text-[var(--ink-muted)] mt-1">
                  Master how this word functions across natural spoken dialogue, professional, and everyday contexts.
                </p>
              </div>

              <Button
                type="button"
                variant={isGeneratorOpen ? 'outline' : 'primary'}
                size="sm"
                onClick={() => setIsGeneratorOpen(!isGeneratorOpen)}
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                rightIcon={isGeneratorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                className="shrink-0"
              >
                {isGeneratorOpen ? 'Close Generator' : 'Generate New Examples'}
              </Button>
            </div>

            {/* EXPANDABLE AI GENERATOR PANEL */}
            {isGeneratorOpen && (
              <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--accent-ochre)]/30 space-y-5 shadow-xs animate-fadeIn">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
                  <div className="flex items-center gap-2 text-[var(--accent-ochre)]">
                    <Sparkles className="w-4 h-4" />
                    <h4 className="font-bold text-sm text-[var(--ink-primary)]">
                      AI Situational Example Generator
                    </h4>
                  </div>
                  <span className="text-[11px] text-[var(--ink-muted)]">
                    Customize scenario, grammar focus, or register
                  </span>
                </div>

                {/* Scenario Selection */}
                <div className="space-y-2">
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
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                    Variation Focus
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                    {variations.map((v) => {
                      const isSelected = variationType === v.id;
                      return (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setVariationType(v.id as any)}
                          className={`p-3 rounded-xl border text-left cursor-pointer transition text-xs ${
                            isSelected
                              ? 'border-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] shadow-xs'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] hover:border-[var(--accent-ochre)]/40'
                          }`}
                        >
                          <div className="font-bold text-[var(--ink-primary)]">{v.label}</div>
                          <div className="text-[11px] text-[var(--ink-muted)] line-clamp-2 mt-1">{v.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Prompt & Submit Bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end pt-1">
                  <div className="md:col-span-7 space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                      Custom Prompt or Topic (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 'At a train station', 'Expressing urgent need', 'Casual conversation'..."
                      value={customInstruction}
                      onChange={(e) => setCustomInstruction(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)]"
                    />
                  </div>

                  <div className="md:col-span-2 space-y-1.5">
                    <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                      Batch Count
                    </label>
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
                  </div>

                  <div className="md:col-span-3">
                    <Button
                      type="button"
                      variant="primary"
                      size="md"
                      onClick={handleGenerateExamples}
                      isLoading={isGeneratingExamples}
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      className="w-full"
                    >
                      Generate Sentences
                    </Button>
                  </div>
                </div>

                {exampleErrorMsg && (
                  <div className="text-xs text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 px-3.5 py-2.5 rounded-xl border border-[var(--accent-terracotta)]/25">
                    {exampleErrorMsg}
                  </div>
                )}
              </div>
            )}

            {/* FULL-WIDTH SENTENCE CARDS FEED */}
            <div className="space-y-4">
              {/* 1. Primary Default Sentence */}
              <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--accent-ochre)]/30 space-y-4 shadow-xs relative">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2.5 py-1 rounded-full">
                      Primary Context Sentence
                    </span>
                    <span className="text-[11px] text-[var(--ink-muted)] hidden sm:inline">
                      Core sentence learned with this word
                    </span>
                  </div>
                  <AudioPronounceButton arabicText={word.exampleArabic} size="sm" />
                </div>

                <div className="space-y-2">
                  <p dir="rtl" className="font-arabic text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] harakat-text leading-[2] sm:leading-[2.2] text-right">
                    {word.exampleArabic}
                  </p>

                  {word.exampleTransliteration && (
                    <p className="text-xs sm:text-sm font-mono text-[var(--ink-secondary)] font-medium">
                      {word.exampleTransliteration}
                    </p>
                  )}

                  <p className="text-sm sm:text-base font-serif italic text-[var(--ink-primary)]">
                    &ldquo;{word.exampleEnglish}&rdquo;
                  </p>
                </div>

                <WordBreakdownPanel
                  arabic={word.exampleArabic}
                  english={word.exampleEnglish}
                  register={EXAMPLE_REGISTER}
                  wordId={word.id}
                  initialBreakdown={word.exampleBreakdown}
                  className="pt-2"
                />
              </div>

              {/* 2. Additional Generated Sentences */}
              {parsedAdditional.length === 0 ? (
                <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-[var(--border-subtle)] text-center space-y-3 bg-[var(--bg-surface)]">
                  <BookOpen className="w-8 h-8 text-[var(--ink-muted)] mx-auto opacity-60" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--ink-primary)]">No situational examples yet</p>
                    <p className="text-xs text-[var(--ink-muted)] max-w-md mx-auto">
                      Generate context-rich sentences to practice this word in daily dialogue, travel, work, or specific grammatical variations.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsGeneratorOpen(true)}
                    leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Open Sentence Generator
                  </Button>
                </div>
              ) : (
                parsedAdditional.map((ex, idx) => (
                  <div
                    key={ex.id || idx}
                    className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 hover:border-[var(--accent-ochre)]/40 transition shadow-xs"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-[10px] font-semibold text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2.5 py-0.5 rounded-full capitalize">
                        {ex.scenario || 'Generated Example'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <AudioPronounceButton arabicText={ex.arabic} size="sm" />
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(confirmDeleteId === ex.id ? null : ex.id)}
                          disabled={isDeletingExampleId === ex.id}
                          className="p-1 rounded text-[var(--ink-muted)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                          title="Delete sentence"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {confirmDeleteId === ex.id && (
                      <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 animate-fadeIn">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          Delete this example sentence?
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1 rounded bg-[var(--bg-surface)] text-[var(--ink-secondary)] text-xs cursor-pointer hover:text-[var(--ink-primary)]"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteExample(ex.id)}
                            disabled={isDeletingExampleId === ex.id}
                            className="px-2.5 py-1 rounded bg-red-600 text-white font-bold text-xs cursor-pointer hover:bg-red-700"
                          >
                            {isDeletingExampleId === ex.id ? 'Deleting...' : 'Confirm Delete'}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <p dir="rtl" className="font-arabic text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] harakat-text leading-[2] sm:leading-[2.2] text-right">
                        {ex.arabic}
                      </p>

                      {ex.transliteration && (
                        <p className="text-xs sm:text-sm font-mono text-[var(--ink-secondary)] font-medium">
                          {ex.transliteration}
                        </p>
                      )}

                      <p className="text-sm sm:text-base font-serif italic text-[var(--ink-primary)]">
                        &ldquo;{ex.english}&rdquo;
                      </p>
                    </div>

                    <WordBreakdownPanel
                      arabic={ex.arabic}
                      english={ex.english}
                      register={EXAMPLE_REGISTER}
                      wordId={word.id}
                      exampleId={ex.id}
                      initialBreakdown={ex.breakdown}
                      className="pt-2"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: LINGUISTIC DETAILS & STATS                                        */}
        {/* ========================================================================= */}
        {activeTab === 'details' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 animate-fadeIn">
            
            {/* Card 1: Linguistic Breakdown */}
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5 text-[var(--accent-ochre)] border-b border-[var(--border-subtle)] pb-3">
                <FileText className="w-4 h-4" />
                <h4 className="font-bold text-sm text-[var(--ink-primary)]">Linguistic Breakdown</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Arabic Root:</span>
                  <span className="font-arabic text-base font-bold text-[var(--accent-ochre)]">{word.root || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Part of Speech:</span>
                  <span className="font-semibold text-[var(--ink-primary)] uppercase tracking-wider">{word.wordType}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Difficulty Level:</span>
                  <span className="capitalize font-semibold text-[var(--ink-primary)]">{word.difficulty}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Thematic Topic:</span>
                  <span className="font-semibold text-[var(--ink-primary)]">{word.topic || 'General'}</span>
                </div>
                {word.presentTenseI && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[var(--ink-muted)]">Verb Conjugation:</span>
                    <span className="font-arabic text-sm text-[var(--accent-cypress)]">أَنَا {word.presentTenseI}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Card 2: Spaced Repetition (SM-2) */}
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5 text-[var(--accent-ochre)] border-b border-[var(--border-subtle)] pb-3">
                <TrendingUp className="w-4 h-4" />
                <h4 className="font-bold text-sm text-[var(--ink-primary)]">Memory & Spaced Repetition</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Mastery Status:</span>
                  <span className="font-bold uppercase tracking-wider text-[var(--accent-ochre)]">{word.memoryStatus}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Times Tested:</span>
                  <span className="font-bold text-[var(--ink-primary)]">{word.timesTested}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Times Correct:</span>
                  <span className="font-bold text-[var(--accent-cypress)]">{word.timesCorrect}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Accuracy Rate:</span>
                  <span className="font-bold text-[var(--ink-primary)]">{accuracy}%</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[var(--ink-muted)]">Review Interval:</span>
                  <span className="font-semibold text-[var(--ink-primary)]">{word.intervalDays || 0} days</span>
                </div>
              </div>
            </div>

            {/* Card 3: Study Timeline */}
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-xs">
              <div className="flex items-center gap-2.5 text-[var(--accent-ochre)] border-b border-[var(--border-subtle)] pb-3">
                <Calendar className="w-4 h-4" />
                <h4 className="font-bold text-sm text-[var(--ink-primary)]">Study Timeline</h4>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Date Added:</span>
                  <span className="text-[var(--ink-secondary)]">{new Date(word.dateAdded).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Next Review:</span>
                  <span className="text-[var(--ink-secondary)]">
                    {word.nextReviewDate ? new Date(word.nextReviewDate).toLocaleDateString() : 'Ready now'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[var(--border-subtle)]/50">
                  <span className="text-[var(--ink-muted)]">Last Reviewed:</span>
                  <span className="text-[var(--ink-secondary)]">
                    {word.lastReviewedDate ? new Date(word.lastReviewedDate).toLocaleDateString() : 'Never'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[var(--ink-muted)]">Word Set:</span>
                  <span className="font-semibold text-[var(--ink-primary)] truncate max-w-[150px]">{word.setName || 'Direct Add'}</span>
                </div>
              </div>
            </div>

          </div>
        )}

        </section>
      </div>
    </div>
  );
}
