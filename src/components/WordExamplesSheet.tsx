'use client';

import React, { useState } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  Loader2,
  ChevronRight,
  Sliders,
  MessageSquare,
  Briefcase,
  Plane,
  GraduationCap,
  Compass,
  CheckCircle2,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { Word, ExampleSentence } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';
import { Button } from './ui/Button';

interface WordExamplesSheetProps {
  word: Word;
  isOpen: boolean;
  onClose: () => void;
  onWordUpdated?: (updatedWord: Word) => void;
}

export const WordExamplesSheet: React.FC<WordExamplesSheetProps> = ({
  word,
  isOpen,
  onClose,
  onWordUpdated,
}) => {
  // Generation configuration state
  const [selectedScenario, setSelectedScenario] = useState('generic');
  const [customInstruction, setCustomInstruction] = useState('');
  const [exampleCount, setExampleCount] = useState<number>(3);
  const [variationType, setVariationType] = useState<'balanced' | 'grammatical' | 'difficulty' | 'idiomatic'>('balanced');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingExamples, setIsLoadingExamples] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<Word>(word);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);

  const handleDeleteExample = async (exampleId: string) => {
    setIsDeletingId(exampleId);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/words/${currentWord.id}/examples?exampleId=${encodeURIComponent(exampleId)}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete example');
      }
      const data = await res.json();
      if (data.word) {
        setCurrentWord(data.word);
        if (onWordUpdated) onWordUpdated(data.word);
      }
      setConfirmDeleteId(null);
    } catch (err: any) {
      console.error('Delete example error:', err);
      setErrorMsg(err?.message || 'Error deleting example');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Fetch the latest word data (including saved additionalExamples) whenever the sheet opens
  React.useEffect(() => {
    setCurrentWord(word);
    setErrorMsg(null);

    const fetchLatestWord = async () => {
      try {
        setIsLoadingExamples(true);
        const res = await fetch(`/api/words/${word.id}`);
        if (res.ok) {
          const freshWord: Word = await res.json();
          if (freshWord && freshWord.id === word.id) {
            setCurrentWord(freshWord);
            if (onWordUpdated) onWordUpdated(freshWord);
          }
        }
      } catch (err) {
        console.warn('Could not refresh word examples:', err);
      } finally {
        setIsLoadingExamples(false);
      }
    };

    fetchLatestWord();
  }, [word.id]);

  if (!isOpen) return null;

  const rawAdditional = currentWord.additionalExamples;
  const parsedAdditional: ExampleSentence[] = Array.isArray(rawAdditional)
    ? rawAdditional
    : typeof rawAdditional === 'string'
    ? (() => {
        try {
          const parsed = JSON.parse(rawAdditional);
          return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
          return [];
        }
      })()
    : [];

  // The primary/default sentence with fallbacks to initial word prop
  const defaultArabic = currentWord.exampleArabic || word.exampleArabic || '';
  const defaultTransliteration = currentWord.exampleTransliteration || word.exampleTransliteration || '';
  const defaultEnglish = currentWord.exampleEnglish || word.exampleEnglish || '';

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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    try {
      const res = await fetch(`/api/words/${currentWord.id}/examples`, {
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
        setCurrentWord(data.word);
        if (onWordUpdated) onWordUpdated(data.word);
      }
    } catch (err: any) {
      console.error('Example generation error:', err);
      setErrorMsg(err?.message || 'Error communicating with AI service');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex justify-end bg-black/60 backdrop-blur-xs animate-fadeIn">
      {/* Backdrop click to close */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* 50% Screen Width Side Sheet Panel */}
      <div className="relative w-full max-w-full md:w-1/2 h-full bg-[var(--bg-primary)] border-l border-[var(--border-strong)] shadow-2xl flex flex-col z-10 animate-fadeIn">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <span className="font-arabic text-3xl font-bold text-[var(--accent-ochre)] harakat-text">
                  {currentWord.arabic}
                </span>
                <span className="font-serif text-xl font-bold text-[var(--ink-primary)]">
                  {currentWord.english}
                </span>
                <span className="text-xs uppercase font-semibold text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2.5 py-0.5 rounded-full">
                  {currentWord.wordType}
                </span>
              </div>
              {currentWord.transliteration && (
                <p className="text-xs font-mono text-[var(--ink-secondary)] mt-0.5">
                  {currentWord.transliteration} {currentWord.root ? `• Root: ${currentWord.root}` : ''}
                </p>
              )}
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--accent-ochre-dim)] transition cursor-pointer"
            title="Close Sheet"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Sheet Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* AI Generator Control Box */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-ochre)]" />
                <h3 className="font-semibold text-sm text-[var(--ink-primary)]">
                  Generate New Contextual Examples with AI
                </h3>
              </div>
              <span className="text-xs text-[var(--ink-muted)] font-mono">
                {1 + parsedAdditional.length} sentences available
              </span>
            </div>

            {/* Scenario Pills */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                Predefined Situation / Scenario
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

            {/* Variation Focus Pills */}
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

            {/* Custom Prompt & Number of Sentences */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
              <div className="sm:col-span-9">
                <input
                  type="text"
                  placeholder="Custom instruction (e.g. 'Use negative past tense' or 'At an airport counter')..."
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
                  onClick={handleGenerate}
                  isLoading={isGenerating}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  Generate
                </Button>
              </div>
            </div>

            {errorMsg && (
              <div className="text-xs text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 px-3 py-2 rounded-xl">
                {errorMsg}
              </div>
            )}
          </div>

          {/* List of Sentences */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                Default Example Sentence
              </h4>
            </div>

            {/* Default Primary Sentence - Rendered Separately and Protected */}
            <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border-2 border-[var(--accent-ochre)]/20 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <span className="text-[11px] font-bold text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2.5 py-0.5 rounded-full capitalize">
                  Default Sentence (Main)
                </span>
                <AudioPronounceButton
                  arabicText={defaultArabic}
                  size="sm"
                  title="Pronounce default sentence"
                />
              </div>

              {/* Arabic Sentence */}
              <p
                dir="rtl"
                className="font-arabic text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] harakat-text leading-relaxed text-right"
              >
                {defaultArabic}
              </p>

              {/* Transliteration */}
              {defaultTransliteration && (
                <p className="text-sm font-mono text-[var(--ink-secondary)] font-medium text-left leading-normal">
                  {defaultTransliteration}
                </p>
              )}

              {/* English Translation */}
              <p className="text-sm sm:text-base text-[var(--ink-primary)] italic font-serif leading-relaxed text-left">
                "{defaultEnglish}"
              </p>
            </div>

            {/* Generated Additional Examples */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--ink-muted)]">
                  Additional Generated Examples ({parsedAdditional.length})
                </h4>
                {isLoadingExamples && (
                  <span className="text-xs text-[var(--ink-muted)] flex items-center gap-1.5 font-mono">
                    <Loader2 className="w-3 h-3 animate-spin text-[var(--accent-ochre)]" />
                    Syncing examples...
                  </span>
                )}
              </div>

              {parsedAdditional.length === 0 ? (
                <div className="p-6 rounded-2xl border border-dashed border-[var(--border-subtle)] text-center text-xs text-[var(--ink-muted)]">
                  No additional examples generated yet. Use the generator above to create contextual examples for different situations!
                </div>
              ) : (
                <div className="space-y-3">
                  {parsedAdditional.map((ex, idx) => (
                    <div
                      key={ex.id || idx}
                      className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 hover:border-[var(--accent-ochre)]/40 transition-colors shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <span className="text-[11px] font-semibold text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2.5 py-0.5 rounded-full capitalize">
                          {ex.scenario || 'Generated Example'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <AudioPronounceButton
                            arabicText={ex.arabic}
                            size="sm"
                            title="Pronounce Arabic sentence"
                          />

                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(confirmDeleteId === ex.id ? null : ex.id)}
                            disabled={isDeletingId === ex.id}
                            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-red-400 hover:bg-red-500/10 transition cursor-pointer"
                            title="Delete example sentence"
                            aria-label="Delete sentence"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Inline Confirmation Prompt */}
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
                              disabled={isDeletingId === ex.id}
                              className="px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] bg-[var(--bg-surface)] cursor-pointer"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteExample(ex.id)}
                              disabled={isDeletingId === ex.id}
                              className="px-3 py-1 rounded-lg text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                            >
                              {isDeletingId === ex.id ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                'Confirm Delete'
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Arabic Sentence */}
                      <p
                        dir="rtl"
                        className="font-arabic text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] harakat-text leading-relaxed text-right"
                      >
                        {ex.arabic}
                      </p>

                      {/* Transliteration */}
                      {ex.transliteration && (
                        <p className="text-sm font-mono text-[var(--ink-secondary)] font-medium text-left leading-normal">
                          {ex.transliteration}
                        </p>
                      )}

                      {/* English Translation */}
                      <p className="text-sm sm:text-base text-[var(--ink-primary)] italic font-serif leading-relaxed text-left">
                        "{ex.english}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs text-[var(--ink-muted)] shrink-0">
          <span>Target Word: <strong className="text-[var(--accent-ochre)] font-arabic text-base">{currentWord.arabic}</strong> ({currentWord.english})</span>
          <button
            onClick={onClose}
            className="btn-quiet px-4 py-1.5 rounded-xl text-xs cursor-pointer"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
