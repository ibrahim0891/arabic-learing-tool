'use client';

import React from 'react';
import { RotateCw } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ArabicText } from '@/components/ui/ArabicText';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';
import { Word } from '@/lib/types';

interface FlashcardStudyCardProps {
  word: Word;
  isFlipped: boolean;
  onFlip: () => void;
  isPracticeMode?: boolean;
}

export const FlashcardStudyCard: React.FC<FlashcardStudyCardProps> = ({
  word,
  isFlipped,
  onFlip,
  isPracticeMode = false,
}) => {
  const partOfSpeech = word.wordType || 'VOCABULARY';

  const getMemoryBadge = () => {
    switch (word.memoryStatus) {
      case 'mastered':
        return <Badge variant="success">Mastered</Badge>;
      case 'struggling':
        return <Badge variant="danger">Needs Practice</Badge>;
      case 'learning':
        return <Badge variant="ochre">Learning</Badge>;
      default:
        return <Badge variant="neutral">New Word</Badge>;
    }
  };

  const nextDueText = isPracticeMode
    ? 'Practice Mode'
    : word.nextReviewDate
    ? `Due: ${new Date(word.nextReviewDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`
    : 'New due in: TBD';

  return (
    <div
      className="w-full min-h-[310px] xs:min-h-[350px] sm:min-h-[470px] perspective-1000 cursor-pointer select-none touch-manipulation"
      onClick={onFlip}
    >
      <div
        className={`relative w-full h-full min-h-[310px] xs:min-h-[350px] sm:min-h-[470px] rounded-[12px] transition-transform duration-500 transform-style-3d ${
          isFlipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* ======================= FRONT OF CARD ======================= */}
        <div className="absolute inset-0 w-full h-full backface-hidden rounded-[12px] p-4 sm:p-8 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs hover:border-[var(--accent-ochre)]/60 transition-colors">
          {/* Top Bar on Front */}
          <div
            className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[var(--border-subtle)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Badge variant="ochre" className="uppercase tracking-wider text-[10px] sm:text-[11px]">
                {partOfSpeech}
              </Badge>
              {word.root && (
                <span className="text-[10px] sm:text-[11px] font-mono text-[var(--ink-secondary)]">
                  Root: {word.root}
                </span>
              )}
            </div>

            <AudioPronounceButton
              arabicText={word.arabic}
              size="sm"
              label="Listen"
              className="border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface)] text-[var(--ink-primary)]"
            />
          </div>

          {/* Center Content: Big Arabic Text */}
          <div className="flex-1 flex flex-col items-center justify-center text-center py-4 sm:py-6">
            <ArabicText
              size="hero"
              color="accent"
              weight="semibold"
              align="center"
              className="font-arabic text-4xl xs:text-5xl sm:text-6xl text-[var(--accent-ochre)] select-text leading-tight"
            >
              {word.arabic}
            </ArabicText>

            <span className="text-[12px] leading-[18px] text-[var(--ink-secondary)] opacity-80 pt-3 sm:pt-4">
              <span className="sm:hidden">Tap card anywhere to flip</span>
              <span className="hidden sm:inline">
                Click anywhere or press <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[10px] text-[var(--ink-primary)]">Space</kbd> to flip card
              </span>
            </span>
          </div>

          {/* Bottom Bar on Front */}
          <div
            className="flex items-center justify-between pt-2.5 sm:pt-3 border-t border-[var(--border-subtle)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              {getMemoryBadge()}
              <span className="text-[10px] sm:text-[11px] leading-[16px] text-[var(--ink-secondary)]">
                {nextDueText}
              </span>
            </div>

            <button
              type="button"
              onClick={onFlip}
              className="flex items-center gap-1.5 text-[11px] sm:text-[12px] font-medium text-[var(--ink-secondary)] hover:text-[var(--accent-ochre)] transition-colors cursor-pointer bg-transparent border-0"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Show answer</span>
            </button>
          </div>
        </div>

        {/* ======================= BACK OF CARD ======================= */}
        <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-[12px] p-4 sm:p-8 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-accent)] shadow-xs overflow-y-auto">
          {/* Top Bar on Back */}
          <div
            className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-[var(--border-subtle)] shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Badge variant="ochre" className="uppercase tracking-wider">
                {partOfSpeech}
              </Badge>
              {word.root && (
                <span className="text-[11px] font-mono text-[var(--ink-secondary)]">
                  Root: {word.root}
                </span>
              )}
            </div>

            <AudioPronounceButton
              arabicText={word.arabic}
              size="sm"
              label="Listen"
              className="border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface)] text-[var(--ink-primary)]"
            />
          </div>

          {/* Center Content on Back */}
          <div className="flex-1 flex flex-col items-center justify-center py-4 text-center gap-3">
            {/* Arabic + Transliteration */}
            <div className="flex flex-col items-center gap-0.5">
              <ArabicText
                size="xl"
                color="primary"
                weight="semibold"
                align="center"
                className="font-arabic text-3xl sm:text-4xl text-[var(--ink-primary)] select-text"
              >
                {word.arabic}
              </ArabicText>
              {word.transliteration && (
                <span className="text-[13px] font-mono text-[var(--ink-secondary)]">
                  {word.transliteration}
                </span>
              )}
            </div>

            {/* Primary English Meaning */}
            <div className="py-0.5">
              <h2 className="text-[24px] sm:text-[26px] font-semibold text-[var(--ink-primary)] tracking-tight">
                {word.english}
              </h2>
            </div>

            {/* Conjugation if Verb */}
            {word.presentTenseI && (
              <div className="px-3 py-1 rounded-[6px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[12px] text-[var(--ink-secondary)] inline-flex items-center gap-2">
                <span>Conjugation:</span>
                <span dir="rtl" className="font-arabic text-[15px] text-[var(--accent-cypress)] font-semibold">
                  أَنَا {word.presentTenseI} • هُوَ {word.presentTenseHe || '-'}
                </span>
              </div>
            )}

            {/* Example sentence with translation */}
            {word.exampleArabic && (
              <div
                className="w-full max-w-lg mt-1 p-3 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex flex-col gap-1 text-right"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[var(--accent-ochre)] uppercase tracking-wider">
                    Context Example
                  </span>
                  <AudioPronounceButton
                    arabicText={word.exampleArabic}
                    size="sm"
                    title="Listen to example sentence"
                  />
                </div>
                <p dir="rtl" className="font-arabic text-[17px] leading-[26px] text-[var(--ink-primary)]">
                  {word.exampleArabic}
                </p>
                {word.exampleEnglish && (
                  <p dir="ltr" className="text-left text-[11px] leading-[16px] text-[var(--ink-secondary)] italic">
                    "{word.exampleEnglish}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Bottom Bar on Back */}
          <div
            className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)] shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2.5">
              {getMemoryBadge()}
              <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
                {nextDueText}
              </span>
            </div>

            <button
              type="button"
              onClick={onFlip}
              className="flex items-center gap-1.5 text-[12px] font-medium text-[var(--ink-secondary)] hover:text-[var(--accent-ochre)] transition-colors cursor-pointer bg-transparent border-0"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>Flip back</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
