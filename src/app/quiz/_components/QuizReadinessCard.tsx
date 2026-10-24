'use client';

import React from 'react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { ArabicText } from '@/components/ui/ArabicText';
import { Badge } from '@/components/ui/Badge';
import { GraduationCap, ArrowRight, Clock, Layers, Sparkles, AlertCircle } from 'lucide-react';

interface QuizReadinessCardProps {
  questionCount: number;
  direction: 'mixed' | 'ar-to-en' | 'en-to-ar';
  filter: string;
  selectedSetTitle: string;
  isGenerating: boolean;
  error: string | null;
  onStartQuiz: () => void;
}

export const QuizReadinessCard: React.FC<QuizReadinessCardProps> = ({
  questionCount,
  direction,
  filter,
  selectedSetTitle,
  isGenerating,
  error,
  onStartQuiz,
}) => {
  const estimatedMins = Math.round(questionCount * 0.4);

  const directionLabels = {
    mixed: 'Mixed (Arabic & English)',
    'ar-to-en': 'Arabic → English',
    'en-to-ar': 'English → Arabic',
  };

  const filterLabels: Record<string, string> = {
    all: 'All Studied Words',
    revision: 'Due for Review Only',
    struggling: 'Tricky Words Only',
    new: 'Recently Added Words',
  };

  return (
    <Panel padding="md" className="flex flex-col gap-4 bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
        <div>
          <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-ochre)] block">
            Session Overview
          </span>
          <h3 className="text-[15px] font-bold text-[var(--ink-primary)]">
            Ready to Test
          </h3>
        </div>
        <Badge variant="ochre">{questionCount} Qs</Badge>
      </div>

      {/* Summary grid */}
      <div className="space-y-2.5 text-[12px]">
        <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/60">
          <span className="text-[var(--ink-secondary)] flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-[var(--ink-muted)]" /> Estimated time:
          </span>
          <span className="font-semibold text-[var(--ink-primary)]">~{estimatedMins} mins</span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/60">
          <span className="text-[var(--ink-secondary)] flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[var(--ink-muted)]" /> Scope:
          </span>
          <span className="font-semibold text-[var(--ink-primary)] truncate max-w-[160px]" title={selectedSetTitle}>
            {selectedSetTitle}
          </span>
        </div>

        <div className="flex items-center justify-between py-1 border-b border-[var(--border-subtle)]/60">
          <span className="text-[var(--ink-secondary)]">Language Pairing:</span>
          <span className="font-semibold text-[var(--accent-ochre)]">
            {directionLabels[direction]}
          </span>
        </div>

        <div className="flex items-center justify-between py-1">
          <span className="text-[var(--ink-secondary)]">Selection Filter:</span>
          <span className="font-semibold text-[var(--ink-primary)]">
            {filterLabels[filter] || filter}
          </span>
        </div>
      </div>

      {/* Arabic Encouragement Motto Card */}
      <div className="p-3.5 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-center space-y-1">
        <ArabicText as="div" size="lg" weight="bold" color="accent" className="text-[18px] leading-tight">
          بِسْمِ اللَّهِ نَبْدَأُ
        </ArabicText>
        <p className="text-[11px] text-[var(--ink-muted)]">
          Challenge your recall and consolidate long-term memory.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-[8px] bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/20 text-[var(--accent-terracotta)] text-[12px] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Start Button */}
      <Button
        variant="primary"
        size="md"
        onClick={onStartQuiz}
        isLoading={isGenerating}
        leftIcon={<GraduationCap className="w-4 h-4" />}
        rightIcon={<ArrowRight className="w-4 h-4" />}
        className="w-full text-[13px] font-bold"
      >
        {isGenerating ? 'Preparing Quiz...' : 'Start Quiz Now'}
      </Button>
    </Panel>
  );
};
