'use client';

import React from 'react';
import Link from 'next/link';
import { Word } from '@/lib/types';
import { ArabicText } from '@/components/ui/ArabicText';
import { Badge } from '@/components/ui/Badge';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';
import {
  CheckSquare,
  Square,
  Layers,
  Edit2,
  Trash2,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

interface WordListItemCardProps {
  word: Word;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  onEdit: (word: Word) => void;
  onDelete: (id: string, arabic: string) => void;
}

export const WordListItemCard: React.FC<WordListItemCardProps> = ({
  word,
  isSelected,
  onToggleSelect,
  onEdit,
  onDelete,
}) => {
  const totalTests = (word.timesCorrect || 0) + (word.timesIncorrect || 0);
  const accuracy = totalTests > 0 ? Math.round(((word.timesCorrect || 0) / totalTests) * 100) : 0;

  const statusVariant = {
    mastered: 'ochre',
    learning: 'success',
    struggling: 'danger',
    new: 'neutral',
  }[word.memoryStatus || 'new'] as 'ochre' | 'success' | 'danger' | 'neutral';

  const statusLabel = {
    new: 'New Word',
    learning: 'Learning',
    struggling: 'Needs Practice',
    mastered: 'Mastered',
  }[word.memoryStatus || 'new'] || word.memoryStatus;

  return (
    <div
      className={`p-3.5 sm:p-5 rounded-[12px] border transition-all duration-150 flex flex-col gap-3.5 sm:gap-4 w-full min-w-0 overflow-hidden ${
        isSelected
          ? 'bg-[var(--bg-accent-tint)]/60 border-[var(--accent-ochre)] shadow-xs ring-1 ring-[var(--accent-ochre)]'
          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/50 hover:shadow-2xs'
      }`}
    >
      {/* 1. Card Top Metadata Row */}
      <div className="flex items-center justify-between gap-2 pb-2.5 sm:pb-3 border-b border-[var(--border-subtle)]/70 min-w-0">
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 flex-wrap">
          {/* Checkbox */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSelect(word.id);
            }}
            className="p-1 -ml-1 rounded text-[var(--ink-muted)] hover:text-[var(--accent-ochre)] cursor-pointer transition shrink-0"
            title={isSelected ? 'Deselect word' : 'Select word'}
            aria-label={`Select ${word.arabic}`}
          >
            {isSelected ? (
              <CheckSquare className="w-4 h-4 text-[var(--accent-ochre)]" />
            ) : (
              <Square className="w-4 h-4 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]" />
            )}
          </button>

          <AudioPronounceButton arabicText={word.arabic} size="sm" />

          {/* Part of Speech */}
          <Badge variant="ochre" className="!text-[10px] uppercase font-bold tracking-wider">
            {word.wordType}
          </Badge>

          {/* Root Badge */}
          {word.root && (
            <span className="text-[11px] sm:text-[12px] px-2 py-0.5 rounded-[6px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] flex items-center gap-1 shrink-0">
              <span className="text-[10px] text-[var(--ink-muted)]">Root:</span>
              <strong className="font-arabic text-[13px] sm:text-[14px] text-[var(--accent-ochre)] font-bold tracking-wide">
                {word.root}
              </strong>
            </span>
          )}

          {/* Verb Conjugation */}
          {word.presentTenseI && (
            <span className="font-arabic text-[11px] sm:text-[12px] text-[var(--accent-cypress)] px-2 py-0.5 rounded-[6px] bg-[var(--accent-cypress-dim)]/40 border border-[var(--accent-cypress)]/20 font-semibold shrink-0">
              أَنَا {word.presentTenseI} • هُوَ {word.presentTenseHe || '-'}
            </span>
          )}
        </div>

        {/* Right side: Status Badge & Stats */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-[var(--ink-muted)] font-medium hidden md:inline">
            Tested {word.timesTested}x ({accuracy}%)
          </span>
          <Badge variant={statusVariant} className="whitespace-nowrap">{statusLabel}</Badge>
        </div>
      </div>

      {/* 2. Main Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5 items-start min-w-0">
        {/* Left: Arabic word & English Translation (5 of 12 cols) */}
        <div className="lg:col-span-5 space-y-1.5 min-w-0">
          <Link
            href={`/library/${word.id}`}
            className="group block hover:opacity-90 transition min-w-0"
            title="Click to view word details & root family"
          >
            <div className="flex items-baseline gap-2.5 sm:gap-3 flex-wrap min-w-0">
              <ArabicText
                as="span"
                size="2xl"
                weight="bold"
                color="accent"
                className="text-[28px] sm:text-[38px] leading-[44px] sm:leading-[54px] group-hover:brightness-95 block break-words"
              >
                {word.arabic}
              </ArabicText>
              {word.transliteration && (
                <span className="text-[12px] sm:text-[13px] font-mono text-[var(--ink-secondary)] tracking-wide font-medium break-all">
                  ({word.transliteration})
                </span>
              )}
            </div>
          </Link>

          <Link
            href={`/library/${word.id}`}
            className="font-serif text-[16px] sm:text-[20px] font-bold text-[var(--ink-primary)] hover:text-[var(--accent-ochre)] transition block break-words"
            title="Click to view word details & root family"
          >
            {word.english}
          </Link>

          {word.explanation && (
            <p className="text-[12px] text-[var(--ink-secondary)] leading-relaxed line-clamp-2">
              {word.explanation}
            </p>
          )}
        </div>

        {/* Right: Contextual Example Sentence Showcase (7 of 12 cols) */}
        <div className="lg:col-span-7 p-3 sm:p-3.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-2 min-w-0 w-full overflow-hidden">
          <div className="flex items-start justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-ochre)] flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Context Sentence
            </span>
            <AudioPronounceButton
              arabicText={word.exampleArabic}
              size="sm"
              title="Listen to example sentence"
            />
          </div>

          <ArabicText
            as="p"
            size="md"
            weight="medium"
            className="text-[16px] sm:text-[19px] leading-[26px] sm:leading-[30px] text-right break-words"
          >
            {word.exampleArabic}
          </ArabicText>

          {word.exampleTransliteration && (
            <p className="text-[11px] font-mono text-[var(--ink-secondary)] text-left leading-normal break-words">
              {word.exampleTransliteration}
            </p>
          )}

          {word.exampleEnglish && (
            <p className="text-[12px] sm:text-[13px] text-[var(--ink-primary)] italic text-left font-serif leading-relaxed break-words">
              "{word.exampleEnglish}"
            </p>
          )}
        </div>
      </div>

      {/* 3. Card Bottom Action Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2.5 border-t border-[var(--border-subtle)]/70 min-w-0">
        {/* Left: Tags & Mobile Action Buttons */}
        <div className="flex items-center justify-between sm:justify-start gap-2 text-[11px] text-[var(--ink-muted)]">
          <div className="flex items-center gap-1.5 flex-wrap">
            {word.topic && (
              <span className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-secondary)] font-medium capitalize whitespace-nowrap">
                {word.topic}
              </span>
            )}
            {word.difficulty && (
              <span className="capitalize whitespace-nowrap">{word.difficulty}</span>
            )}
          </div>

          {/* On mobile: Edit and Delete buttons sit neatly on the right of the tags row */}
          <div className="flex sm:hidden items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(word)}
              className="p-1.5 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] rounded-[6px] border border-[var(--border-subtle)] transition cursor-pointer"
              title="Edit word details"
              aria-label="Edit word"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(word.id, word.arabic)}
              className="p-1.5 text-[var(--ink-secondary)] hover:text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)]/10 rounded-[6px] border border-[var(--border-subtle)] hover:border-[var(--accent-terracotta)]/30 transition cursor-pointer"
              title="Delete word"
              aria-label="Delete word"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Root Family CTA & Desktop Action Buttons */}
        <div className="flex items-center gap-2">
          <Link
            href={`/library/${word.id}`}
            className="w-full sm:w-auto justify-center px-3.5 py-1.5 text-[12px] font-semibold rounded-[8px] bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] border border-[var(--border-accent)] hover:bg-[var(--accent-ochre)] hover:text-white transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Explore morphological root family, patterns, and contextual examples"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Root Family & Examples</span>
            <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          </Link>

          {/* On desktop: Edit & Delete buttons */}
          <div className="hidden sm:flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onEdit(word)}
              className="p-2 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] rounded-[8px] border border-[var(--border-subtle)] transition cursor-pointer"
              title="Edit word details"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => onDelete(word.id, word.arabic)}
              className="p-2 text-[var(--ink-secondary)] hover:text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)]/10 rounded-[8px] border border-[var(--border-subtle)] hover:border-[var(--accent-terracotta)]/30 transition cursor-pointer"
              title="Delete word"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
