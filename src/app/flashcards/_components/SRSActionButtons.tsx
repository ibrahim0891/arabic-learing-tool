'use client';

import React from 'react';
import { ArrowLeft, ArrowRight, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Word } from '@/lib/types';

interface SRSActionButtonsProps {
  isFlipped: boolean;
  onFlip: () => void;
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  onRate: (rating: 1 | 2 | 3 | 4) => void;
  isSubmitting?: boolean;
  word?: Word;
  isPracticeMode?: boolean;
}

export const SRSActionButtons: React.FC<SRSActionButtonsProps> = ({
  isFlipped,
  onFlip,
  onPrev,
  onNext,
  canPrev,
  onRate,
  isSubmitting = false,
  word,
  isPracticeMode = false,
}) => {
  // If not flipped: standard Previous | Show answer | Next navigation
  if (!isFlipped) {
    return (
      <div className="grid grid-cols-12 gap-2 sm:gap-3 w-full">
        {/* Previous Button */}
        <div className="col-span-3 sm:col-span-4">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
            onClick={onPrev}
            disabled={!canPrev}
            className="w-full text-[12px] sm:text-[14px] px-2 sm:px-4"
          >
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden">Prev</span>
          </Button>
        </div>

        {/* Primary Action: Show Answer / Flip */}
        <div className="col-span-6 sm:col-span-4">
          <Button
            variant="primary"
            size="md"
            leftIcon={<RotateCw className="w-4 h-4 shrink-0" />}
            onClick={onFlip}
            className="w-full text-[12px] sm:text-[14px] whitespace-nowrap shadow-sm font-semibold"
          >
            Show answer
          </Button>
        </div>

        {/* Next Card Button */}
        <div className="col-span-3 sm:col-span-4">
          <Button
            variant="secondary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
            onClick={onNext}
            className="w-full text-[12px] sm:text-[14px] px-2 sm:px-4"
          >
            <span className="hidden xs:inline">Next</span>
            <span className="xs:hidden">Next</span>
          </Button>
        </div>
      </div>
    );
  }

  // If casual practice mode: Previous | Flip back | Next
  if (isPracticeMode) {
    return (
      <div className="grid grid-cols-12 gap-2 sm:gap-3 w-full">
        <div className="col-span-3 sm:col-span-4">
          <Button
            variant="secondary"
            size="md"
            leftIcon={<ArrowLeft className="w-4 h-4 shrink-0" />}
            onClick={onPrev}
            disabled={!canPrev}
            className="w-full text-[12px] sm:text-[14px] px-2 sm:px-4"
          >
            <span className="hidden xs:inline">Previous</span>
            <span className="xs:hidden">Prev</span>
          </Button>
        </div>

        <div className="col-span-6 sm:col-span-4">
          <Button
            variant="primary"
            size="md"
            leftIcon={<RotateCw className="w-4 h-4 shrink-0" />}
            onClick={onFlip}
            className="w-full text-[12px] sm:text-[14px] whitespace-nowrap shadow-sm"
          >
            Flip back
          </Button>
        </div>

        <div className="col-span-3 sm:col-span-4">
          <Button
            variant="secondary"
            size="md"
            rightIcon={<ArrowRight className="w-4 h-4 shrink-0" />}
            onClick={onNext}
            className="w-full text-[12px] sm:text-[14px] px-2 sm:px-4"
          >
            <span>Next</span>
          </Button>
        </div>
      </div>
    );
  }

  // If flipped in SRS mode: 4 SRS rating buttons
  return (
    <div className="grid grid-cols-4 gap-1.5 sm:gap-2.5 w-full animate-fadeIn">
      {/* 1: Again */}
      <button
        type="button"
        onClick={() => onRate(1)}
        disabled={isSubmitting}
        className="flex flex-col items-center justify-center py-2.5 px-1 sm:p-3 rounded-[8px] bg-[var(--bg-surface)] hover:bg-red-500/10 border border-[var(--border-subtle)] hover:border-red-500/40 text-[var(--ink-primary)] transition-all cursor-pointer group disabled:opacity-50 active:scale-95 touch-manipulation"
      >
        <span className="text-[12px] sm:text-[13px] font-semibold text-[var(--accent-terracotta)] group-hover:scale-105 transition-transform">
          Again
        </span>
        <span className="text-[10px] sm:text-[11px] text-[var(--ink-secondary)]">
          1d <span className="hidden xs:inline">• Re-queue</span>
        </span>
      </button>

      {/* 2: Hard */}
      <button
        type="button"
        onClick={() => onRate(2)}
        disabled={isSubmitting}
        className="flex flex-col items-center justify-center py-2.5 px-1 sm:p-3 rounded-[8px] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--ink-secondary)] text-[var(--ink-primary)] transition-all cursor-pointer group disabled:opacity-50 active:scale-95 touch-manipulation"
      >
        <span className="text-[12px] sm:text-[13px] font-semibold text-[var(--ink-secondary)] group-hover:scale-105 transition-transform">
          Hard
        </span>
        <span className="text-[10px] sm:text-[11px] text-[var(--ink-secondary)]">
          1–2d
        </span>
      </button>

      {/* 3: Good */}
      <button
        type="button"
        onClick={() => onRate(3)}
        disabled={isSubmitting}
        className="flex flex-col items-center justify-center py-2.5 px-1 sm:p-3 rounded-[8px] bg-[var(--bg-accent-tint)] hover:opacity-90 border border-[var(--border-accent)] text-[var(--accent-ochre)] transition-all cursor-pointer group disabled:opacity-50 active:scale-95 touch-manipulation shadow-2xs"
      >
        <span className="text-[12px] sm:text-[13px] font-semibold text-[var(--accent-ochre)] group-hover:scale-105 transition-transform">
          Good
        </span>
        <span className="text-[10px] sm:text-[11px] text-[var(--accent-ochre)] opacity-80">
          3–4d
        </span>
      </button>

      {/* 4: Easy */}
      <button
        type="button"
        onClick={() => onRate(4)}
        disabled={isSubmitting}
        className="flex flex-col items-center justify-center py-2.5 px-1 sm:p-3 rounded-[8px] bg-[var(--accent-cypress-dim)] hover:opacity-90 border border-[var(--accent-cypress)]/30 text-[var(--accent-cypress)] transition-all cursor-pointer group disabled:opacity-50 active:scale-95 touch-manipulation"
      >
        <span className="text-[12px] sm:text-[13px] font-semibold text-[var(--accent-cypress)] group-hover:scale-105 transition-transform">
          Easy
        </span>
        <span className="text-[10px] sm:text-[11px] text-[var(--accent-cypress)] opacity-80">
          6+ d
        </span>
      </button>
    </div>
  );
};
