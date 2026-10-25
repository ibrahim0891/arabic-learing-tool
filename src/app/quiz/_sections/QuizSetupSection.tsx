'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { WordSet } from '@/lib/types';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ArabicText } from '@/components/ui/ArabicText';
import { QuizReadinessCard } from '../_components/QuizReadinessCard';
import { QuizStudyTipsCard } from '../_components/QuizStudyTipsCard';
import {
  BookOpen,
  Check,
  GraduationCap,
  SlidersHorizontal,
  X,
  ArrowRight,
} from 'lucide-react';

interface QuizSetupSectionProps {
  sets: WordSet[];
  selectedSetId: string;
  onSetIdChange: (id: string) => void;
  questionCount: number;
  onQuestionCountChange: (count: number) => void;
  filter: string;
  onFilterChange: (filter: string) => void;
  direction: 'mixed' | 'ar-to-en' | 'en-to-ar';
  onDirectionChange: (dir: 'mixed' | 'ar-to-en' | 'en-to-ar') => void;
  selectedTypes: string[];
  onToggleType: (type: string) => void;
  isGenerating: boolean;
  error: string | null;
  onStartQuiz: () => void;
}

const QUESTION_COUNTS = [
  { count: 5,  label: '5 Qs',  sub: 'Quick • ~2m' },
  { count: 10, label: '10 Qs', sub: 'Standard • ~4m' },
  { count: 15, label: '15 Qs', sub: 'Challenge • ~7m' },
  { count: 20, label: '20 Qs', sub: 'Full • ~10m' },
];

const WORD_FILTERS = [
  { id: 'all',       label: 'All Words',       arabic: 'جَمِيعُ الكَلِمَاتِ',          sub: 'Full vocabulary bank' },
  { id: 'revision',  label: 'Due for Review',  arabic: 'مُسْتَحِقَّةُ المُرَاجَعَةِ',   sub: 'SRS scheduled review' },
  { id: 'struggling',label: 'Tricky Words',    arabic: 'كَلِمَاتٌ صَعْبَةٌ',            sub: 'Words missed before' },
  { id: 'new',       label: 'Recent Batch',    arabic: 'كَلِمَاتٌ حَدِيثَةٌ',           sub: 'Last added set' },
];

const DIRECTIONS: { id: 'mixed' | 'ar-to-en' | 'en-to-ar'; label: string; sub: string; arabic: string }[] = [
  { id: 'mixed',     label: 'Mixed Mode',         arabic: 'مُخْتَلَط',                      sub: 'Balanced Arabic & English' },
  { id: 'ar-to-en',  label: 'Arabic → English',   arabic: 'عَرَبِيٌّ إِلَى إِنْجِلِيزِيّ', sub: 'Read Arabic, choose English' },
  { id: 'en-to-ar',  label: 'English → Arabic',   arabic: 'إِنْجِلِيزِيٌّ إِلَى عَرَبِيّ', sub: 'Write or choose Arabic' },
];

const QUESTION_TYPES = [
  { id: 'multiple-choice', label: 'Multiple Choice', desc: '4 curated options with distractors' },
  { id: 'typing',          label: 'Typing Mode',      desc: 'Type with virtual or physical keyboard' },
  { id: 'fill-in-blank',  label: 'Fill in the Blank', desc: 'Select missing root or word in context' },
];

export const QuizSetupSection: React.FC<QuizSetupSectionProps> = ({
  sets,
  selectedSetId,
  onSetIdChange,
  questionCount,
  onQuestionCountChange,
  filter,
  onFilterChange,
  direction,
  onDirectionChange,
  selectedTypes,
  onToggleType,
  isGenerating,
  error,
  onStartQuiz,
}) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const currentSet = sets.find((s) => s.id === selectedSetId);
  const selectedSetTitle =
    selectedSetId === 'all'
      ? 'All Saved Words'
      : currentSet
      ? `${currentSet.title} (${currentSet.wordsCount} words)`
      : 'All Words';

  // Escape key + scroll lock
  useEffect(() => {
    if (!isDrawerOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsDrawerOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  /* ─── Shared config form body ─────────────────────────────── */
  const configBody = (
    <div className="flex flex-col gap-6">

      {/* 1. Vocabulary Source */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)]">
            1. Vocabulary Source
          </label>
          <span className="text-[11px] text-[var(--ink-muted)]">{sets.length} set{sets.length === 1 ? '' : 's'} available</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onSetIdChange('all')}
            className={`p-3 rounded-[8px] border text-left transition cursor-pointer select-none flex items-center justify-between ${
              selectedSetId === 'all'
                ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] font-bold ring-1 ring-[var(--accent-ochre)]'
                : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)]/50'
            }`}
          >
            <div>
              <span className="text-[12px] font-semibold block">★ All Saved Words</span>
              <span className="text-[11px] text-[var(--ink-muted)] font-normal mt-0.5 block">Full vocabulary bank</span>
            </div>
            {selectedSetId === 'all' && <Check className="w-4 h-4 text-[var(--accent-ochre)] shrink-0 ml-2" />}
          </button>

          {sets.slice(0, 5).map((s) => {
            const isSelected = selectedSetId === s.id;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => onSetIdChange(s.id)}
                className={`p-3 rounded-[8px] border text-left transition cursor-pointer select-none flex items-center justify-between ${
                  isSelected
                    ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] font-bold ring-1 ring-[var(--accent-ochre)]'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)]/50'
                }`}
              >
                <div className="truncate">
                  <span className="text-[12px] font-semibold block truncate">{s.title}</span>
                  <span className="text-[11px] text-[var(--ink-muted)] font-normal mt-0.5 block">{s.wordsCount} words • {s.difficulty}</span>
                </div>
                {isSelected && <Check className="w-4 h-4 text-[var(--accent-ochre)] shrink-0 ml-2" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Question Count — always 4-col grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)]">2. Question Count</label>
          <span className="text-[11px] text-[var(--ink-muted)]">Session length</span>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {QUESTION_COUNTS.map((item) => {
            const isSelected = questionCount === item.count;
            return (
              <button
                key={item.count}
                type="button"
                onClick={() => onQuestionCountChange(item.count)}
                aria-pressed={isSelected}
                className={`p-2.5 rounded-[8px] border text-center transition cursor-pointer select-none flex flex-col items-center justify-center ${
                  isSelected
                    ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] font-bold ring-1 ring-[var(--accent-ochre)]'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)]/50'
                }`}
              >
                <span className="text-[13px] font-bold">{item.label}</span>
                <span className="text-[10px] text-[var(--ink-muted)] mt-0.5 leading-tight">{item.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Word Selection Filter */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)]">3. Word Filter</label>
          <span className="text-[11px] text-[var(--ink-muted)]">Target retention tier</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {WORD_FILTERS.map((item) => {
            const isSelected = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onFilterChange(item.id)}
                aria-pressed={isSelected}
                className={`p-3 rounded-[8px] border text-left transition cursor-pointer select-none flex flex-col justify-between min-h-[68px] ${
                  isSelected
                    ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] font-bold ring-1 ring-[var(--accent-ochre)]'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)]/50'
                }`}
              >
                <div>
                  <span className="text-[12px] font-semibold block leading-tight">{item.label}</span>
                  <span className="text-[10px] text-[var(--ink-muted)] leading-tight">{item.sub}</span>
                </div>
                <ArabicText
                  as="span"
                  size="sm"
                  weight="medium"
                  color={isSelected ? 'accent' : 'secondary'}
                  className="text-[11px] !leading-none text-right block"
                >
                  {item.arabic}
                </ArabicText>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Quiz Direction */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)]">4. Quiz Direction</label>
          <span className="text-[11px] text-[var(--ink-muted)]">Language pairing</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {DIRECTIONS.map((d) => {
            const isSelected = direction === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => onDirectionChange(d.id)}
                aria-pressed={isSelected}
                className={`p-3 rounded-[8px] border text-left transition cursor-pointer select-none flex flex-col justify-between min-h-[68px] ${
                  isSelected
                    ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] ring-1 ring-[var(--accent-ochre)] font-medium'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)]/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[12px] font-bold">{d.label}</span>
                  <ArabicText as="span" size="sm" color={isSelected ? 'accent' : 'secondary'} className="shrink-0">
                    {d.arabic}
                  </ArabicText>
                </div>
                <span className="text-[11px] text-[var(--ink-muted)] mt-1">{d.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Question Formats */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)]">5. Question Formats</label>
          <span className="text-[11px] text-[var(--ink-muted)]">Toggle types</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {QUESTION_TYPES.map((qt) => {
            const isChecked = selectedTypes.includes(qt.id);
            return (
              <button
                key={qt.id}
                type="button"
                onClick={() => onToggleType(qt.id)}
                aria-pressed={isChecked}
                className={`p-3 rounded-[8px] border text-left transition cursor-pointer select-none flex items-start gap-3 ${
                  isChecked
                    ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)]'
                    : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] opacity-75 hover:opacity-100'
                }`}
              >
                <div className={`w-4 h-4 rounded-[4px] border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                  isChecked
                    ? 'bg-[var(--accent-ochre)] border-[var(--accent-ochre)] text-white'
                    : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                }`}>
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[12px] font-bold block">{qt.label}</span>
                  <span className="text-[11px] text-[var(--ink-muted)] leading-tight block mt-0.5">{qt.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-6 animate-fadeIn pb-24 lg:pb-16">

      {/* ── Page Heading ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[26px] sm:text-[28px] leading-[38px] sm:leading-[42px] font-semibold text-[var(--ink-primary)] tracking-tight">
              Test Your Vocabulary
            </h1>
            <ArabicText as="span" size="sm" color="accent" weight="medium">
              اِخْتَبِرْ مَعْلُومَاتِك
            </ArabicText>
          </div>
          <p className="text-[13px] sm:text-[14px] leading-[21px] text-[var(--ink-secondary)] max-w-2xl">
            Evaluate retention through active recall. Configure your test preferences and generate a tailored quiz.
          </p>
        </div>

        <Link
          href="/library"
          className="flex items-center gap-2 px-3.5 py-2 rounded-[8px] border text-[12px] font-semibold transition cursor-pointer self-start sm:self-auto bg-[var(--bg-surface)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:text-[var(--ink-primary)] hover:border-[var(--accent-ochre)]"
        >
          <BookOpen className="w-4 h-4 text-[var(--accent-ochre)]" />
          <span>View Word Bank</span>
        </Link>
      </div>

      {/* ── Mobile: Summary card + Configure button ──────────── */}
      <div className="lg:hidden flex flex-col gap-3">
        {/* Mini readiness summary */}
        <div className="p-4 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[var(--ink-primary)]">Quiz Overview</span>
            <Badge variant="ochre">{questionCount} Questions</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[12px]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--ink-muted)]">Source</span>
              <span className="font-semibold text-[var(--ink-primary)] truncate">{selectedSetTitle}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--ink-muted)]">Filter</span>
              <span className="font-semibold text-[var(--ink-primary)]">
                {WORD_FILTERS.find(f => f.id === filter)?.label || filter}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--ink-muted)]">Direction</span>
              <span className="font-semibold text-[var(--ink-primary)]">
                {DIRECTIONS.find(d => d.id === direction)?.label || direction}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[var(--ink-muted)]">Types</span>
              <span className="font-semibold text-[var(--ink-primary)]">{selectedTypes.length} active</span>
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-[8px] bg-red-500/10 border border-red-500/20 text-[11px] text-red-500">
              {error}
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={onStartQuiz}
            isLoading={isGenerating}
            leftIcon={<GraduationCap className="w-4 h-4" />}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full font-bold"
          >
            {isGenerating ? 'Preparing Quiz...' : 'Start Quiz Now'}
          </Button>
        </div>

        {/* Configure button */}
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] hover:border-[var(--accent-ochre)]/50 text-[13px] font-semibold text-[var(--ink-primary)] transition-all cursor-pointer active:scale-[0.99] shadow-2xs"
        >
          <SlidersHorizontal className="w-4 h-4 text-[var(--accent-ochre)]" />
          <span>Customize Quiz Settings</span>
        </button>
      </div>

      {/* ── Desktop: Two-Column Layout ────────────────────────── */}
      <div className="hidden lg:grid lg:grid-cols-12 gap-6 items-start">
        {/* Left: Config Panel */}
        <div className="lg:col-span-8">
          <Panel padding="lg" className="space-y-6 bg-[var(--bg-surface)]">
            {configBody}
          </Panel>
        </div>

        {/* Right: Readiness + Tips */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          <QuizReadinessCard
            questionCount={questionCount}
            direction={direction}
            filter={filter}
            selectedSetTitle={selectedSetTitle}
            isGenerating={isGenerating}
            error={error}
            onStartQuiz={onStartQuiz}
          />
          <QuizStudyTipsCard />
        </div>
      </div>

      {/* ── Mobile Bottom-Sheet Drawer (portal) ──────────────── */}
      {isDrawerOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quiz configuration"
          className="fixed inset-0 z-[9999] flex flex-col justify-end"
        >
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative w-full flex flex-col rounded-t-[24px] bg-[var(--bg-surface)] shadow-2xl animate-slideUp"
            style={{ maxHeight: '92dvh' }}
          >
            {/* Sticky Header */}
            <div className="shrink-0 flex flex-col items-center px-5 pt-3 pb-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-t-[24px]">
              {/* Drag pill */}
              <div className="w-10 h-[5px] rounded-full bg-[var(--border-subtle)] mb-3" />

              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)] shadow-2xs">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-[16px] font-bold text-[var(--ink-primary)] leading-tight">Quiz Settings</h3>
                    <span className="text-[11px] text-[var(--ink-secondary)]">Customize your test parameters</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="w-9 h-9 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition cursor-pointer active:scale-95"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
              {configBody}
            </div>

            {/* Pinned Action Bar */}
            <div className="shrink-0 px-5 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shadow-[0_-6px_20px_rgba(0,0,0,0.07)] flex flex-col gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button
                variant="primary"
                size="lg"
                onClick={() => { setIsDrawerOpen(false); onStartQuiz(); }}
                isLoading={isGenerating}
                leftIcon={<GraduationCap className="w-4 h-4" />}
                rightIcon={<ArrowRight className="w-4 h-4" />}
                className="w-full justify-center font-bold text-[15px] py-3.5"
              >
                {isGenerating ? 'Preparing Quiz...' : `Start ${questionCount}-Question Quiz`}
              </Button>
              <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] px-0.5">
                <span>Active formats: {selectedTypes.length} of {QUESTION_TYPES.length}</span>
                <span className="font-arabic text-[13px] text-[var(--accent-ochre)]">اِبْدَأِ الاِخْتِبَار</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
