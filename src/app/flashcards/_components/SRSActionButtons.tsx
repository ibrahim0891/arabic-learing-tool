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
      <div className="grid grid-cols-3 gap-3 w-full">
        <Button
          variant="secondary"
          size="md"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={onPrev}
          disabled={!canPrev}
        >
          Previous
        </Button>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RotateCw className="w-4 h-4" />}
          onClick={onFlip}
        >
          Show answer
        </Button>

        <Button
          variant="primary"
          size="md"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={onNext}
        >
          Next card
        </Button>
      </div>
    );
  }

  // If casual practice mode: Previous | Flip back | Next
  if (isPracticeMode) {
    return (
      <div className="grid grid-cols-3 gap-3 w-full">
        <Button
          variant="secondary"
          size="md"
          leftIcon={<ArrowLeft className="w-4 h-4" />}
          onClick={onPrev}
          disabled={!canPrev}
        >
          Previous
        </Button>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<RotateCw className="w-4 h-4" />}
          onClick={onFlip}
        >
          Flip back
        </Button>

        <Button
          variant="primary"
          size="md"
          rightIcon={<ArrowRight className="w-4 h-4" />}
          onClick={onNext}
        >
          Next card
        </Button>
      </div>
    );
  }

  // If flipped in SRS mode: 4 SRS rating buttons
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full animate-fadeIn">
      {/* 1: Again */}
      <button
        type="button"
        onClick={() => onRate(1)}
        disabled={isSubmitting}
        className="flex flex-col items-center justify-center p-3 rounded-[8px] bg-[var(--bg-surface)] hover:bg-red-500/10 border border-[var(--border-subtle)] hover:border-red-500/40 text-[var(--ink-primary)] transition-all cursor-pointer group disabled:opacity-50"
      >
        <span className="text-[13px] font-semibold text-[var(--accent-terracotta)] group-hover:scale-105 transition-transform">
          Again
        </span>
        <span className="text-[11px] text-[var(--ink-secondary)]">
          1d • Re-queue
        </span>
      </button>

      {/* 2: Hard */}
      <button
        type="button"
        onClick={() => onRate(2)}
        disabled={isSubmitting}
        className="flex flex-col items-center justify-center p-3 rounded-[8px] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--ink-secondary)] text-[var(--ink-primary)] transition-all cursor-pointer group disabled:opacity-50"
      >
        <span className="text-[13px] font-semibold text-[var(--ink-secondary)] group-hover:scale-105 transition-transform">
          Hard
        </span>
        <span className="text-[11px] text-[var(--ink-secondary)]">
          1–2 days
        </span>
      </button>

      {/* 3: Good */}
      <button
        type="button"
        onClick={() => onRate(3)}
        disabled={isSubmitting}
        className="flex flex-col items-center justify-center p-3 rounded-[8px] bg-[var(--bg-accent-tint)] hover:opacity-90 border border-[var(--border-accent)] text-[var(--accent-ochre)] transition-all cursor-pointer group disabled:opacity-50"
      >
        <span className="text-[13px] font-semibold text-[var(--accent-ochre)] group-hover:scale-105 transition-transform">
          Good
        </span>
        <span className="text-[11px] text-[var(--accent-ochre)] opacity-80">
          3–4 days
        </span>
      </button>

      {/* 4: Easy */}
      <button
        type="button"
        onClick={() => onRate(4)}
        disabled={isSubmitting}
        className="flex flex-col items-center justify-center p-3 rounded-[8px] bg-[var(--accent-cypress-dim)] hover:opacity-90 border border-[var(--accent-cypress)]/30 text-[var(--accent-cypress)] transition-all cursor-pointer group disabled:opacity-50"
      >
        <span className="text-[13px] font-semibold text-[var(--accent-cypress)] group-hover:scale-105 transition-transform">
          Easy
        </span>
        <span className="text-[11px] text-[var(--accent-cypress)] opacity-80">
          6+ days
        </span>
      </button>
    </div>
  );
};
