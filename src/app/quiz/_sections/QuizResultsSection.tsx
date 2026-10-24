'use client';

import React from 'react';
import { QuizResult } from '@/lib/types';
import { Panel } from '@/components/ui/Panel';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArabicText } from '@/components/ui/ArabicText';
import { QuizReviewItem } from '../_components/QuizReviewItem';
import {
  Trophy,
  RotateCw,
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';

interface QuizResultsSectionProps {
  quizResult: QuizResult;
  onRetryMissed: () => void;
  onTakeAnother: () => void;
}

export const QuizResultsSection: React.FC<QuizResultsSectionProps> = ({
  quizResult,
  onRetryMissed,
  onTakeAnother,
}) => {
  const isMastered = quizResult.accuracy >= 80;
  const isPassed = quizResult.accuracy >= 60;

  return (
    <div className="p-6 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-6 animate-fadeIn pb-16">
      {/* Celebration & Score Overview Panel */}
      <Panel padding="lg" className="space-y-6 bg-[var(--bg-surface)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--border-subtle)]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant={isMastered ? 'success' : 'ochre'}>
                <span className="flex items-center gap-1.5">
                  <Trophy className="w-3 h-3" />
                  Quiz Completed
                </span>
              </Badge>
              <span className="text-[12px] text-[var(--ink-muted)]">Session Summary</span>
            </div>

            <Heading level={1} className="text-[26px] sm:text-[30px] font-bold text-[var(--ink-primary)]">
              {isMastered
                ? 'Outstanding Achievement!'
                : isPassed
                ? 'Good Progress! Keep Practicing'
                : 'Need More Practice!'}
            </Heading>

            <ArabicText
              as="p"
              size="2xl"
              weight="bold"
              color="accent"
              className="text-[24px] sm:text-[28px] leading-[42px]"
            >
              {isMastered
                ? 'نَتِيجَةٌ مُمْتَازَة ! أَحْسَنْتَ عَمَلًا'
                : isPassed
                ? 'عَمَلٌ جَيِّد، وَاصِل التَّدْرِيب'
                : 'لَا بَأْسَ، حَاوِل مَرَّةً أُخْرَى'}
            </ArabicText>
          </div>

          {/* Big Score Block */}
          <div className="p-4 rounded-[12px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-center sm:text-right shrink-0 min-w-[150px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--ink-muted)] block">
              Final Score
            </span>
            <div className="text-[36px] font-bold text-[var(--ink-primary)] leading-tight font-serif">
              {quizResult.score}
              <span className="text-[20px] text-[var(--ink-muted)] font-normal font-sans">
                {' '}/ {quizResult.total}
              </span>
            </div>
            <div className="mt-1">
              <Badge variant={isMastered ? 'success' : isPassed ? 'ochre' : 'danger'}>
                {quizResult.accuracy}% Accuracy
              </Badge>
            </div>
          </div>
        </div>

        {/* 3 Metric Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-center">
            <span className="text-[11px] text-[var(--ink-muted)] block">Total Questions</span>
            <span className="text-[20px] font-bold text-[var(--ink-primary)] mt-0.5 block">
              {quizResult.total}
            </span>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[var(--accent-cypress-dim)]/40 border border-[var(--accent-cypress)]/20 text-center">
            <span className="text-[11px] text-[var(--accent-cypress)] font-semibold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Correct
            </span>
            <span className="text-[20px] font-bold text-[var(--accent-cypress)] mt-0.5 block">
              {quizResult.score}
            </span>
          </div>

          <div className="p-3.5 rounded-[8px] bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/20 text-center">
            <span className="text-[11px] text-[var(--accent-terracotta)] font-semibold flex items-center justify-center gap-1">
              <XCircle className="w-3 h-3" /> Missed
            </span>
            <span className="text-[20px] font-bold text-[var(--accent-terracotta)] mt-0.5 block">
              {quizResult.missedWordIds.length}
            </span>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          {quizResult.missedWordIds.length > 0 && (
            <Button
              variant="primary"
              size="md"
              onClick={onRetryMissed}
              leftIcon={<RotateCw className="w-4 h-4" />}
            >
              Retry Missed Words ({quizResult.missedWordIds.length})
            </Button>
          )}

          <Button
            variant="secondary"
            size="md"
            onClick={onTakeAnother}
            leftIcon={<Sparkles className="w-4 h-4" />}
          >
            Take Another Quiz
          </Button>

          <Link href="/flashcards" className="inline-block">
            <Button
              variant="outline"
              size="md"
              leftIcon={<BookOpen className="w-4 h-4" />}
            >
              Study in Flashcards
            </Button>
          </Link>
        </div>
      </Panel>

      {/* Answer Breakdown List */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between">
          <Heading level={2} className="text-[18px] font-bold text-[var(--ink-primary)]">
            Detailed Review ({quizResult.detailedResults.length} Questions)
          </Heading>
          <Text color="muted" variant="secondary">
            Review your responses and correct translations
          </Text>
        </div>

        <div className="space-y-3">
          {quizResult.detailedResults.map((item, idx) => (
            <QuizReviewItem key={idx} result={item} index={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};
