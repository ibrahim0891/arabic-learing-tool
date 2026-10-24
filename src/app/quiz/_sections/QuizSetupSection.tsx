'use client';

import React from 'react';
import Link from 'next/link';
import { WordSet } from '@/lib/types';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { ArabicText } from '@/components/ui/ArabicText';
import { QuizReadinessCard } from '../_components/QuizReadinessCard';
import { QuizStudyTipsCard } from '../_components/QuizStudyTipsCard';
import { BookOpen, Check } from 'lucide-react';

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
  { count: 5, label: '5 Questions', sub: 'Quick bite • ~2m' },
  { count: 10, label: '10 Questions', sub: 'Standard • ~4m' },
  { count: 15, label: '15 Questions', sub: 'Challenge • ~7m' },
  { count: 20, label: '20 Questions', sub: 'Comprehensive • ~10m' },
];

const WORD_FILTERS = [
  { id: 'all', label: 'All Studied Words', arabic: 'جَمِيعُ الكَلِمَاتِ', sub: 'Full vocabulary bank' },
  { id: 'revision', label: 'Due for Review', arabic: 'مُسْتَحِقَّةُ المُرَاجَعَةِ', sub: 'SRS scheduled review' },
  { id: 'struggling', label: 'Tricky Words', arabic: 'كَلِمَاتٌ صَعْبَةٌ', sub: 'Words missed before' },
  { id: 'new', label: 'Recently Added', arabic: 'كَلِمَاتٌ حَدِيثَةٌ', sub: 'Last added batch' },
];

const DIRECTIONS: { id: 'mixed' | 'ar-to-en' | 'en-to-ar'; label: string; sub: string; arabic: string }[] = [
  { id: 'mixed', label: 'Mixed Mode', arabic: 'مُخْتَلَط', sub: 'Balanced Arabic & English' },
  { id: 'ar-to-en', label: 'Arabic → English', arabic: 'عَرَبِيٌّ إِلَى إِنْجِلِيزِيّ', sub: 'Read Arabic, choose English' },
  { id: 'en-to-ar', label: 'English → Arabic', arabic: 'إِنْجِلِيزِيٌّ إِلَى عَرَبِيّ', sub: 'Write or choose Arabic' },
];

const QUESTION_TYPES = [
  { id: 'multiple-choice', label: 'Multiple Choice', desc: '4 curated options with distractors' },
  { id: 'typing', label: 'Typing Mode', desc: 'Type with virtual or physical keyboard' },
  { id: 'fill-in-blank', label: 'Fill in the Blank', desc: 'Select missing root or word in context' },
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
  const currentSet = sets.find((s) => s.id === selectedSetId);
  const selectedSetTitle =
    selectedSetId === 'all'
      ? 'All Saved Words'
      : currentSet
      ? `${currentSet.title} (${currentSet.wordsCount} words)`
      : 'All Words';

  return (
    <div className="p-6 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-6 animate-fadeIn pb-16">
      {/* 1. Page Heading Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[26px] sm:text-[28px] leading-[38px] sm:leading-[42px] font-semibold text-[var(--ink-primary)] tracking-tight">
              Test Your Arabic Vocabulary
            </h1>
            <ArabicText as="span" size="sm" color="accent" weight="medium">
              اِخْتَبِرْ مَعْلُومَاتِك
            </ArabicText>
          </div>
          <p className="text-[13px] sm:text-[14px] leading-[21px] text-[var(--ink-secondary)] max-w-2xl">
            Evaluate retention and reinforce vocabulary through active recall. Configure your test preferences below to generate a tailored quiz.
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

      {/* 2. Main Two-Column Setup Arena */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Configuration Form (8 of 12 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-5">
          <Panel padding="lg" className="space-y-6 bg-[var(--bg-surface)]">
            {/* 1. Target Vocabulary Collection */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)] flex items-center justify-between">
                <span>1. Vocabulary Source</span>
                <span className="text-[11px] font-normal text-[var(--ink-muted)]">
                  {sets.length} topic set{sets.length === 1 ? '' : 's'} available
                </span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                    <span className="text-[13px] block">★ All Saved Words</span>
                    <span className="text-[11px] text-[var(--ink-muted)] font-normal block mt-0.5">
                      Full active vocabulary bank (Recommended)
                    </span>
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
                        <span className="text-[13px] block truncate">{s.title}</span>
                        <span className="text-[11px] text-[var(--ink-muted)] font-normal block mt-0.5">
                          {s.wordsCount} words • {s.difficulty}
                        </span>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-[var(--accent-ochre)] shrink-0 ml-2" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Number of Questions */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)] flex items-center justify-between">
                <span>2. Question Count</span>
                <span className="text-[11px] font-normal text-[var(--ink-muted)]">Session length</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {QUESTION_COUNTS.map((item) => {
                  const isSelected = questionCount === item.count;
                  return (
                    <button
                      key={item.count}
                      type="button"
                      onClick={() => onQuestionCountChange(item.count)}
                      aria-pressed={isSelected}
                      className={`p-3 rounded-[8px] border text-center transition cursor-pointer select-none flex flex-col justify-center items-center ${
                        isSelected
                          ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] font-bold ring-1 ring-[var(--accent-ochre)]'
                          : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)]/50'
                      }`}
                    >
                      <span className="text-[13px] font-semibold">{item.label}</span>
                      <span className="text-[11px] text-[var(--ink-muted)] mt-0.5">{item.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Word Selection Filter */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)] flex items-center justify-between">
                <span>3. Word Selection Filter</span>
                <span className="text-[11px] font-normal text-[var(--ink-muted)]">Target retention tier</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {WORD_FILTERS.map((item) => {
                  const isSelected = filter === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onFilterChange(item.id)}
                      aria-pressed={isSelected}
                      className={`p-3 rounded-[8px] border text-left transition cursor-pointer select-none flex flex-col justify-between min-h-[72px] ${
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
                        className="text-[11px] !leading-none mt-1 text-right block"
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
              <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)] flex items-center justify-between">
                <span>4. Quiz Direction</span>
                <span className="text-[11px] font-normal text-[var(--ink-muted)]">Language pairing</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {DIRECTIONS.map((d) => {
                  const isSelected = direction === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => onDirectionChange(d.id)}
                      aria-pressed={isSelected}
                      className={`p-3.5 rounded-[8px] border text-left transition cursor-pointer select-none flex flex-col justify-between min-h-[76px] ${
                        isSelected
                          ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] ring-1 ring-[var(--accent-ochre)] font-medium'
                          : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)]/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[13px] font-bold">{d.label}</span>
                        <ArabicText as="span" size="sm" color={isSelected ? 'accent' : 'secondary'}>
                          {d.arabic}
                        </ArabicText>
                      </div>
                      <span className="text-[11px] text-[var(--ink-muted)] mt-1">{d.sub}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 5. Question Types */}
            <div className="space-y-2">
              <label className="text-[12px] font-bold uppercase tracking-wider text-[var(--ink-secondary)] flex items-center justify-between">
                <span>5. Question Formats</span>
                <span className="text-[11px] font-normal text-[var(--ink-muted)]">Toggle question types</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {QUESTION_TYPES.map((qt) => {
                  const isChecked = selectedTypes.includes(qt.id);
                  return (
                    <button
                      key={qt.id}
                      type="button"
                      onClick={() => onToggleType(qt.id)}
                      aria-pressed={isChecked}
                      className={`p-3.5 rounded-[8px] border text-left transition cursor-pointer select-none flex items-start gap-3 ${
                        isChecked
                          ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)]'
                          : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 rounded-[4px] border mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                          isChecked
                            ? 'bg-[var(--accent-ochre)] border-[var(--accent-ochre)] text-white'
                            : 'border-[var(--border-subtle)] bg-[var(--bg-surface)]'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[12px] font-bold block">{qt.label}</span>
                        <span className="text-[11px] text-[var(--ink-muted)] leading-tight block mt-0.5">
                          {qt.desc}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </Panel>
        </div>

        {/* Right Column: Readiness Summary & Active Recall Tips (4 of 12 columns) */}
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
    </div>
  );
};
