'use client';

import React, { useEffect, useRef } from 'react';
import { Play, Check, Circle } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { QuizQuestion } from '@/lib/types';
import { ArabicText } from '@/components/ui/ArabicText';

interface QuizQuestionQueueProps {
  questions: QuizQuestion[];
  currentIndex: number;
  userAnswers: Record<string, string>;
  onSelectIndex: (index: number) => void;
}

export const QuizQuestionQueue: React.FC<QuizQuestionQueueProps> = ({
  questions,
  currentIndex,
  userAnswers,
  onSelectIndex,
}) => {
  const activeItemRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  return (
    <Panel padding="none" className="flex flex-col bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-10">
        <h3 className="text-[14px] leading-[20px] font-semibold text-[var(--ink-primary)]">
          Question Queue
        </h3>
        <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)] font-medium">
          {questions.length} questions
        </span>
      </div>

      {/* Full Scrollable Question List */}
      <div
        ref={containerRef}
        className="max-h-[360px] overflow-y-auto divide-y divide-[var(--border-subtle)] scroll-smooth"
      >
        {questions.map((q, idx) => {
          const isActive = idx === currentIndex;
          const isAnswered = !!userAnswers[q.id];
          const formattedIndex = String(idx + 1).padStart(2, '0');

          return (
            <div
              key={q.id || idx}
              ref={isActive ? activeItemRef : null}
              onClick={() => onSelectIndex(idx)}
              className={`flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer select-none ${
                isActive
                  ? 'bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] font-semibold border-l-2 border-l-[var(--accent-ochre)]'
                  : 'hover:bg-[var(--bg-canvas)] text-[var(--ink-primary)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`text-[11px] font-mono shrink-0 ${
                    isActive ? 'text-[var(--accent-ochre)] font-bold' : 'text-[var(--ink-muted)]'
                  }`}
                >
                  {formattedIndex}
                </span>

                <div className="truncate">
                  {q.wordContext?.arabic ? (
                    <ArabicText
                      as="span"
                      size="sm"
                      weight="bold"
                      color={isActive ? 'accent' : 'primary'}
                      className="text-[15px] leading-tight"
                    >
                      {q.wordContext.arabic}
                    </ArabicText>
                  ) : (
                    <span className="text-[12px] font-medium truncate block">
                      {q.prompt.length > 28 ? q.prompt.slice(0, 28) + '...' : q.prompt}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                {isActive ? (
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-ochre)] text-white flex items-center justify-center">
                    <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                  </span>
                ) : isAnswered ? (
                  <span className="w-5 h-5 rounded-full bg-[var(--accent-cypress-dim)] text-[var(--accent-cypress)] flex items-center justify-center">
                    <Check className="w-3 h-3 stroke-[3]" />
                  </span>
                ) : (
                  <span className="w-5 h-5 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-[var(--ink-muted)]">
                    <Circle className="w-2 h-2 fill-current opacity-40" />
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Panel>
  );
};
