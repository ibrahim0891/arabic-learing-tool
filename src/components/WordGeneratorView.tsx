'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Check,
  AlertCircle,
  Loader2,
  BookmarkPlus,
  ArrowRight,
  Info,
  Inbox,
  Home,
  Coffee,
  Plane,
  Briefcase,
  Laptop,
  Smile,
  PenTool,
  Sliders,
  CheckCircle2,
  BookOpen,
  Volume2
} from 'lucide-react';
import { AudioPronounceButton } from './AudioPronounceButton';
import { DraftsManager } from './DraftsManager';
import { Button } from './ui/Button';

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
  const [autoDraftMsg, setAutoDraftMsg] = useState<string | null>(null);

  // Switch between AI Generator and Drafts collection
  const [activeTab, setActiveTab] = useState<'generate' | 'drafts'>('generate');
  const [draftsVersion, setDraftsVersion] = useState<number>(0);
  const [draftCount, setDraftCount] = useState<number>(0);

  const [generatedResult, setGeneratedResult] = useState<{
    title: string;
    themeContext: string;
    words: any[];
  } | null>(null);

  // Set of indices for selected words to save in the Word Bank
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Fetch draft count on mount and when drafts change
  useEffect(() => {
    async function loadDraftCount() {
      try {
        const res = await fetch('/api/drafts');
        if (res.ok) {
          const data = await res.json();
          setDraftCount(data.count || 0);
        }
      } catch (_) {}
    }
    loadDraftCount();
  }, [draftsVersion]);

  const beginnerTopics = [
    { id: 'daily life', title: 'Daily Life & Home', arabic: 'الحَيَاةُ اليَوْمِيَّة', icon: Home, note: 'Waking up, having breakfast, coffee, family routines' },
    { id: 'food', title: 'Food & Dining at a Cafe', arabic: 'الطَّعَامُ وَالمَطَاعِم', icon: Coffee, note: 'Ordering dishes, drinks, dining, cafe conversations' },
    { id: 'travel', title: 'Travel & Getting Around', arabic: 'السَّفَرُ وَالمَدِينَة', icon: Plane, note: 'Directions, taxis, airport navigation, commuting' },
    { id: 'work', title: 'Work, Office & School', arabic: 'العَمَلُ وَالدِّرَاسَة', icon: Briefcase, note: 'Colleagues, books, writing emails, meetings' },
    { id: 'technology', title: 'Technology & Digital Life', arabic: 'التِّكْنُولُوجِيَا وَالهَاتِف', icon: Laptop, note: 'Smartphones, apps, laptops, digital texting' },
    { id: 'emotions', title: 'Feelings & Everyday Small Talk', arabic: 'المَشَاعِرُ وَالحِوَار', icon: Smile, note: 'Greetings, mood, feelings, friendly banter' },
    { id: 'custom', title: 'Custom Topic Definition...', arabic: 'مَوْضُوعٌ مِنْ اخْتِيَارِك', icon: PenTool, note: 'Define any custom theme, scenario, or vocabulary focus' },
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
      if (data.words && Array.isArray(data.words)) {
        setSelectedIndices(new Set(data.words.map((_: any, idx: number) => idx)));
      }

      // Bump draft version and show auto-save confirmation
      setDraftsVersion(v => v + 1);
      if (data.autoSavedToDraftCount > 0) {
        setAutoDraftMsg(`${data.autoSavedToDraftCount} unique words automatically saved to your Drafts collection!`);
      } else {
        setAutoDraftMsg(null);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error communicating with AI tutor');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWordSelection = (index: number) => {
    setSelectedIndices(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!generatedResult || !generatedResult.words.length) return;
    if (selectedIndices.size === generatedResult.words.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(generatedResult.words.map((_, i) => i)));
    }
  };

  const handleSaveToLibrary = async () => {
    if (!generatedResult || !generatedResult.words.length) return;
    const wordsToSave = generatedResult.words.filter((_, idx) => selectedIndices.has(idx));
    if (wordsToSave.length === 0) {
      setError('Please select at least one word to save to your Word Bank.');
      return;
    }

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
          words: wordsToSave,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save words');
      }

      const data = await res.json();
      setSaveSuccessMsg(data.message || `${wordsToSave.length} words successfully added to your Word Bank!`);
      onSavedSuccess(data.savedCount);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error saving words');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full space-y-7 animate-fadeIn pb-16">
      
      {/* Top Header & Tab Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--ink-primary)] tracking-tight">
              Learn New Words
            </h1>
            <span className="font-arabic font-bold text-lg sm:text-xl text-[var(--accent-ochre)] harakat-text">
              • تَعَلَّمْ كَلِمَاتٍ جَدِيدَة
            </span>
          </div>
          <p className="text-xs text-[var(--ink-muted)] mt-1">
            Instruct Gemini AI to weave authentic thematic Arabic vocabulary with full diacritics, audio & contextual sentences.
          </p>
        </div>

        {/* Tab Navigation Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('generate')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'generate'
                ? 'bg-[#9a5d16] text-white shadow-sm font-bold'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)] border border-transparent'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Words</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 transition cursor-pointer ${
              activeTab === 'drafts'
                ? 'bg-[#9a5d16] text-white shadow-sm font-bold'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface)] border border-transparent'
            }`}
          >
            <Inbox className="w-4 h-4" />
            <span>Drafts Collection</span>
            {draftCount > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                activeTab === 'drafts'
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--bg-surface-elevated)] text-[var(--ink-muted)] border border-[var(--border-subtle)]'
              }`}>
                {draftCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Auto-Draft Notification */}
      {autoDraftMsg && activeTab === 'generate' && (
        <div className="p-3 bg-[var(--accent-cypress)]/10 border border-[var(--accent-cypress)]/30 rounded-xl text-xs text-[var(--accent-cypress)] flex items-center justify-between gap-3 animate-fadeIn">
          <span className="flex items-center gap-2 font-medium">
            <Check className="w-4 h-4" /> {autoDraftMsg}
          </span>
          <button
            type="button"
            onClick={() => setActiveTab('drafts')}
            className="font-bold underline hover:opacity-80 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <Inbox className="w-3.5 h-3.5" /> View Drafts Collection
          </button>
        </div>
      )}

      {/* Render Drafts Manager if activeTab === 'drafts' */}
      {activeTab === 'drafts' && (
        <DraftsManager
          onSavedToWordBank={(count) => {
            onSavedSuccess(count);
          }}
          onNavigateToStudy={onNavigateToStudy}
          draftsVersion={draftsVersion}
        />
      )}

      {/* Generator Form View */}
      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          
          {/* Left Column (4 cols): Configuration Options Sidebar */}
          <div className="lg:col-span-4 lg:sticky lg:top-20 space-y-4 self-start">
            <form onSubmit={handleGenerate} className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-5 shadow-xs relative overflow-hidden">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-ochre)]/5 rounded-full blur-2xl pointer-events-none -mr-10 -mt-10" />

              <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3 relative z-10">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-ochre)] flex items-center gap-2">
                  <Sliders className="w-4 h-4" />
                  Configuration Options
                </span>
                <span className="text-[10px] font-mono text-[var(--ink-muted)]">Gemini AI</span>
              </div>

              {/* 1. Thematic Scenario Selector */}
              <div className="space-y-2 relative z-10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--ink-secondary)] block">
                    1. Thematic Scenario
                  </label>
                  {topic && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
                      <strong className="text-[var(--accent-ochre)] capitalize">{topic}</strong>
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                  {beginnerTopics.map((s) => {
                    const isSelected = topic === s.id;
                    const Icon = s.icon;
                    return (
                      <div
                        key={s.id}
                        onClick={() => setTopic(s.id)}
                        className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all duration-200 select-none flex items-center justify-between gap-2 group ${
                          isSelected
                            ? 'bg-[var(--accent-ochre-dim)] border-[var(--accent-ochre)] ring-1 ring-[var(--accent-ochre)] shadow-xs'
                            : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/40'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1.5 rounded-lg transition-colors shrink-0 ${
                            isSelected
                              ? 'bg-[var(--accent-ochre)] text-[#121316]'
                              : 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] border border-[var(--border-subtle)]'
                          }`}>
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-[var(--ink-primary)] truncate">
                              {s.title}
                            </h4>
                            <span className="font-arabic text-xs text-[var(--accent-ochre)] font-bold harakat-text block truncate">
                              {s.arabic}
                            </span>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-ochre)] shrink-0" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Topic Input */}
              {topic === 'custom' && (
                <div className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--accent-ochre)] shadow-xs space-y-1.5 relative z-10 animate-fadeIn">
                  <label className="text-[11px] font-semibold text-[var(--ink-primary)] flex items-center gap-1.5">
                    <PenTool className="w-3 h-3 text-[var(--accent-ochre)]" />
                    <span>Custom Scenario:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Arabic bakery, job interview..."
                    value={customTopic}
                    onChange={(e) => setCustomTopic(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs focus:outline-none focus:border-[var(--accent-ochre)] placeholder:text-[var(--ink-muted)] transition"
                    required
                  />
                </div>
              )}

              {/* Word Count Selector */}
              <div className="space-y-1.5 relative z-10">
                <label className="text-xs font-semibold text-[var(--ink-secondary)] block">
                  2. Word Count
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 5, label: '5', sub: 'Quick' },
                    { val: 10, label: '10', sub: 'Default' },
                    { val: 15, label: '15', sub: 'Deep' },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => setCount(item.val)}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                        count === item.val
                          ? 'bg-[#9a5d16] text-white border-[#9a5d16] font-bold shadow-xs'
                          : 'bg-[var(--bg-surface-elevated)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/40'
                      }`}
                    >
                      <div className="text-xs">{item.label}</div>
                      <div className={`text-[9px] ${count === item.val ? 'text-white/85 font-medium' : 'text-[var(--ink-muted)]'}`}>{item.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Difficulty Level Selector */}
              <div className="space-y-1.5 relative z-10">
                <label className="text-xs font-semibold text-[var(--ink-secondary)] block">
                  3. Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'beginner', label: 'Beginner', arabic: 'مُبْتَدِئ' },
                    { id: 'intermediate', label: 'Inter.', arabic: 'مُتَوَسِّط' },
                    { id: 'advanced', label: 'Advanced', arabic: 'مُتَقَدِّم' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDifficulty(d.id as any)}
                      className={`p-2 rounded-xl border text-center transition cursor-pointer ${
                        difficulty === d.id
                          ? 'bg-[#9a5d16] text-white border-[#9a5d16] font-bold shadow-xs'
                          : 'bg-[var(--bg-surface-elevated)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/40'
                      }`}
                    >
                      <div className="text-xs">{d.label}</div>
                      <div className={`font-arabic text-[10px] leading-tight mt-0.5 truncate ${difficulty === d.id ? 'text-white/95 font-semibold' : 'text-[var(--ink-muted)]'}`}>{d.arabic}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Word Types Selector */}
              <div className="space-y-1.5 relative z-10">
                <label className="text-xs font-semibold text-[var(--ink-secondary)] block">
                  4. Word Types
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {[
                    { id: 'mixed', label: 'Mixed Types', desc: 'Nouns, verbs & traits' },
                    { id: 'verbs', label: 'Verbs (أَفْعَال)', desc: 'Actions' },
                    { id: 'nouns', label: 'Nouns (أَسْمَاء)', desc: 'Objects' },
                    { id: 'adjectives', label: 'Adjectives (صِفَات)', desc: 'Qualities' },
                  ].map((wt) => (
                    <button
                      key={wt.id}
                      type="button"
                      onClick={() => setWordType(wt.id)}
                      className={`p-2 rounded-xl border text-left transition cursor-pointer ${
                        wordType === wt.id
                          ? 'bg-[var(--accent-ochre-dim)] border-[var(--accent-ochre)] text-[var(--ink-primary)]'
                          : 'bg-[var(--bg-surface-elevated)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/40'
                      }`}
                    >
                      <div className="text-xs font-bold">{wt.label}</div>
                      <div className="text-[10px] text-[var(--ink-muted)] truncate mt-0.5">{wt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Tricky Words Toggle */}
              <div
                onClick={() => setIncludeRevision(!includeRevision)}
                className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-ochre)]/40 transition select-none relative z-10"
              >
                <input
                  type="checkbox"
                  id="includeRevision"
                  checked={includeRevision}
                  onChange={(e) => setIncludeRevision(e.target.checked)}
                  onClick={(e) => e.stopPropagation()}
                  className="mt-0.5 h-4 w-4 rounded accent-[var(--accent-ochre)] cursor-pointer shrink-0"
                />
                <div className="text-xs leading-snug">
                  <span className="font-semibold text-[var(--ink-primary)] block">Review Tricky Words</span>
                  <span className="text-[11px] text-[var(--ink-muted)]">Weaves struggled words into sentences.</span>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)] text-xs flex items-center gap-2 relative z-10">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Generate Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={isLoading}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="w-full uppercase tracking-wider text-xs font-bold py-3.5 shadow-sm relative z-10"
              >
                {isLoading ? 'Weaving Vocabulary...' : 'Generate Vocabulary Set'}
              </Button>
            </form>
          </div>

          {/* Right Column (8 cols): Generated Words & Loading State */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* ================= SKELETON LOADING ANIMATION ================= */}
            {isLoading && (
              <section className="space-y-6 animate-fadeIn" aria-busy="true">
                {/* Skeleton Storyline Header */}
                <div className="p-6 sm:p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 animate-pulse">
                  <div className="h-4 bg-[var(--border-subtle)] rounded w-28" />
                  <div className="h-8 bg-[var(--border-subtle)] rounded w-1/2" />
                  <div className="h-4 bg-[var(--border-subtle)] rounded w-3/4" />
                  <div className="pt-2 flex items-center gap-2 text-xs text-[var(--accent-ochre)] font-medium">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Gemini AI is weaving words with full harakāt, transliterations & context sentences...</span>
                  </div>
                </div>

                {/* Skeleton Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 animate-pulse">
                      <div className="flex justify-between">
                        <div className="h-4 bg-[var(--border-subtle)] rounded w-1/4" />
                        <div className="h-4 bg-[var(--border-subtle)] rounded w-1/6" />
                      </div>
                      <div className="h-9 bg-[var(--border-subtle)] rounded w-2/3" />
                      <div className="h-4 bg-[var(--border-subtle)] rounded w-1/2" />
                      <div className="h-16 bg-[var(--border-subtle)] rounded-xl w-full" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* ================= INITIAL STATE / EMPTY PLACEHOLDER WHEN NO RESULT & NOT LOADING ================= */}
            {!isLoading && !generatedResult && (
              <div className="p-12 rounded-2xl bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] text-center space-y-4 animate-fadeIn">
                <div className="w-12 h-12 rounded-2xl bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-[var(--ink-primary)]">
                    Configure your vocabulary set and click Generate
                  </h3>
                  <p className="text-xs text-[var(--ink-muted)]">
                    Choose your thematic scenario, word count, difficulty, and word types on the left panel, then let Gemini AI generate authentic Arabic vocabulary for you.
                  </p>
                </div>
              </div>
            )}

            {/* ================= GENERATED RESULTS CARD GRID ================= */}
            {!isLoading && generatedResult && (
              <section className="space-y-6 animate-fadeIn">
                
                {/* Situation Storyline Card */}
                <div className="p-6 sm:p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--accent-ochre)]/40 space-y-4 shadow-xs relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-[var(--accent-ochre)]/5 rounded-full blur-3xl pointer-events-none -mr-16 -mt-16" />

                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-[var(--accent-ochre)] uppercase tracking-wider bg-[var(--accent-ochre-dim)] px-2.5 py-0.5 rounded-full">
                        Thematic Storyline
                      </span>
                      <h3 className="editorial-title text-2xl font-bold text-[var(--ink-primary)] mt-1.5">
                        {generatedResult.title}
                      </h3>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        onClick={handleSaveToLibrary}
                        disabled={!!saveSuccessMsg || selectedIndices.size === 0}
                        isLoading={isSaving}
                        leftIcon={
                          saveSuccessMsg ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <BookmarkPlus className="w-4 h-4" />
                          )
                        }
                      >
                        {saveSuccessMsg
                          ? 'Saved to Word Bank!'
                          : selectedIndices.size === 0
                          ? 'Select words to save'
                          : selectedIndices.size === generatedResult.words.length
                          ? `Save All ${generatedResult.words.length} Words`
                          : `Save Selected (${selectedIndices.size}/${generatedResult.words.length})`}
                      </Button>
                    </div>
                  </div>

                  <p className="relative z-10 text-sm text-[var(--ink-secondary)] leading-relaxed italic border-l-3 border-[var(--accent-ochre)] pl-3.5 font-serif">
                    "{generatedResult.themeContext}"
                  </p>

                  {saveSuccessMsg && (
                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-[var(--accent-cypress)] bg-[var(--accent-cypress)]/10 p-3 rounded-xl border border-[var(--accent-cypress)]/25">
                      <span className="font-semibold">✓ {saveSuccessMsg}</span>
                      <button
                        onClick={onNavigateToStudy}
                        className="font-bold underline hover:text-[var(--ink-primary)] flex items-center gap-1 cursor-pointer shrink-0"
                      >
                        Start Practicing Flashcards Now <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Toolbar Header with Counter and Select All */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-2 px-1">
                  <div className="text-xs uppercase tracking-wider font-bold text-[var(--ink-secondary)]">
                    Generated Vocabulary ({selectedIndices.size} of {generatedResult.words.length} selected)
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="text-xs font-semibold text-[var(--accent-ochre)] hover:underline flex items-center gap-2 cursor-pointer bg-[var(--bg-surface)] px-3 py-1.5 rounded-lg border border-[var(--border-subtle)]"
                    >
                      <input
                        type="checkbox"
                        readOnly
                        checked={selectedIndices.size === generatedResult.words.length && generatedResult.words.length > 0}
                        className="h-3.5 w-3.5 rounded accent-[var(--accent-ochre)] cursor-pointer pointer-events-none"
                      />
                      <span>
                        {selectedIndices.size === generatedResult.words.length ? 'Deselect All' : 'Select All'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* High-Density Card Grid */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {generatedResult.words.map((w, idx) => {
                    const isChecked = selectedIndices.has(idx);
                    return (
                      <div
                        key={idx}
                        onClick={() => toggleWordSelection(idx)}
                        className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 select-none group shadow-xs ${
                          isChecked
                            ? 'bg-[var(--bg-surface)] border-[var(--accent-ochre)] ring-1 ring-[var(--accent-ochre)]/40 shadow-sm'
                            : 'bg-[var(--bg-surface)]/60 border-[var(--border-subtle)] opacity-55 hover:opacity-85'
                        }`}
                      >
                        <div className="space-y-3">
                          {/* Top Badges & Select Toggle */}
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-secondary)]">
                                {w.wordType}
                              </span>
                              {w.root && (
                                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]">
                                  Root: <strong className="font-arabic font-bold">{w.root}</strong>
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => toggleWordSelection(idx)}
                                className="h-4 w-4 rounded accent-[var(--accent-ochre)] cursor-pointer"
                                aria-label={`Select word ${w.arabic}`}
                              />
                            </div>
                          </div>

                          {/* Arabic Word & Audio */}
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-arabic text-3xl sm:text-4xl font-bold text-[var(--accent-ochre)] harakat-text leading-tight group-hover:scale-[1.02] transition-transform origin-right">
                                {w.arabic}
                              </p>
                              {w.transliteration && (
                                <p className="text-xs font-mono text-[var(--ink-secondary)] mt-1 font-medium">
                                  ({w.transliteration})
                                </p>
                              )}
                            </div>
                            <div onClick={(e) => e.stopPropagation()} className="shrink-0 mt-1">
                              <AudioPronounceButton arabicText={w.arabic} size="md" />
                            </div>
                          </div>

                          {/* English Meaning */}
                          <h4 className="font-serif text-lg font-bold text-[var(--ink-primary)]">
                            {w.english}
                          </h4>

                          {/* Verb Conjugation if present */}
                          {w.presentTenseI && (
                            <div className="p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--accent-cypress)] font-arabic font-semibold">
                              أَنَا {w.presentTenseI} • هُوَ {w.presentTenseHe || '-'}
                            </div>
                          )}

                          {/* Plural and Opposite Linguistic Forms if present */}
                          {(w.pluralArabic || w.oppositeArabic) && (
                            <div className="flex flex-wrap gap-2 text-xs">
                              {w.pluralArabic && (
                                <div className="p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex-1 min-w-[120px] space-y-0.5">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-cypress)] block">
                                    Plural • الْجَمْع
                                  </span>
                                  <span className="font-arabic font-bold text-[var(--accent-ochre)] text-sm harakat-text block">
                                    {w.pluralArabic}
                                  </span>
                                  {w.pluralEnglish && (
                                    <span className="text-[10px] text-[var(--ink-muted)] block">
                                      {w.pluralEnglish}
                                    </span>
                                  )}
                                </div>
                              )}

                              {w.oppositeArabic && (
                                <div className="p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex-1 min-w-[120px] space-y-0.5">
                                  <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--accent-ochre)] block">
                                    Opposite • الضِّدّ
                                  </span>
                                  <span className="font-arabic font-bold text-[var(--accent-ochre)] text-sm harakat-text block">
                                    {w.oppositeArabic}
                                  </span>
                                  {w.oppositeEnglish && (
                                    <span className="text-[10px] text-[var(--ink-muted)] block">
                                      {w.oppositeEnglish}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Context Sentence Box */}
                          {w.exampleArabic && (
                            <div className="p-3.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1.5">
                              <div className="flex items-start justify-between gap-2">
                                <p dir="rtl" className="font-arabic text-base font-medium text-[var(--ink-primary)] harakat-text text-right flex-1 leading-relaxed">
                                  {w.exampleArabic}
                                </p>
                                <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                                  <AudioPronounceButton arabicText={w.exampleArabic} size="sm" />
                                </div>
                              </div>

                              {w.exampleTransliteration && (
                                <p className="text-[10px] font-mono text-[var(--ink-muted)]">
                                  {w.exampleTransliteration}
                                </p>
                              )}

                              <p className="text-xs font-serif italic text-[var(--ink-secondary)]">
                                "{w.exampleEnglish}"
                              </p>
                            </div>
                          )}

                          {w.explanation && (
                            <p className="text-[11px] text-[var(--ink-muted)] flex items-start gap-1.5 pt-0.5">
                              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--accent-ochre)]" />
                              <span>{w.explanation}</span>
                            </p>
                          )}
                        </div>

                        {/* Card Bottom Selection Bar */}
                        <div className="pt-2 border-t border-[var(--border-subtle)]/50 flex items-center justify-between text-[11px]">
                          <span className={isChecked ? 'text-[var(--accent-ochre)] font-bold' : 'text-[var(--ink-muted)]'}>
                            {isChecked ? '✓ Will be added to Word Bank' : 'Excluded from saving'}
                          </span>
                          <span className="text-[10px] font-mono text-[var(--ink-muted)]">#{idx + 1}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
