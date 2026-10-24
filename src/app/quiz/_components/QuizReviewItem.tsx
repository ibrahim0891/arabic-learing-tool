'use client';

import React from 'react';
import { ArabicText } from '@/components/ui/ArabicText';
import { Badge } from '@/components/ui/Badge';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';
import { Check, X } from 'lucide-react';

interface DetailedResultItem {
  questionId: string;
  wordId: string;
  wordArabic: string;
  wordEnglish: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

interface QuizReviewItemProps {
  result: DetailedResultItem;
  index: number;
}

export const QuizReviewItem: React.FC<QuizReviewItemProps> = ({ result, index }) => {
  const isArabicUserAnswer = /[\u0600-\u06FF]/.test(result.userAnswer);
  const isArabicCorrectAnswer = /[\u0600-\u06FF]/.test(result.correctAnswer);

  return (
    <div className="p-4 sm:p-5 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3.5 transition-all hover:border-[var(--border-strong)]">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[12px] font-bold text-[var(--ink-secondary)]">
            Question {index + 1}
          </span>
          <Badge variant={result.isCorrect ? 'success' : 'danger'}>
            <span className="flex items-center gap-1">
              {result.isCorrect ? (
                <>
                  <Check className="w-3 h-3 stroke-[3]" /> Correct
                </>
              ) : (
                <>
                  <X className="w-3 h-3 stroke-[3]" /> Missed
                </>
              )}
            </span>
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <ArabicText
            as="span"
            size="lg"
            weight="bold"
            color="accent"
            className="text-[20px] leading-[30px]"
          >
            {result.wordArabic}
          </ArabicText>
          <AudioPronounceButton arabicText={result.wordArabic} size="sm" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)]/60 text-[13px]">
        <div className="p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] block">
            Your Answer:
          </span>
          <div
            className={`font-medium ${
              result.isCorrect
                ? 'text-[var(--accent-cypress)]'
                : 'text-[var(--accent-terracotta)] line-through'
            } ${isArabicUserAnswer ? 'font-arabic text-[18px]' : ''}`}
          >
            {result.userAnswer || <span className="italic text-[var(--ink-muted)]">(Left blank)</span>}
          </div>
        </div>

        <div className="p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-muted)] block">
            Correct Answer:
          </span>
          <div
            className={`font-semibold text-[var(--ink-primary)] ${
              isArabicCorrectAnswer ? 'font-arabic text-[18px] text-[var(--accent-ochre)]' : ''
            }`}
          >
            {result.correctAnswer}
          </div>
        </div>
      </div>
    </div>
  );
};
