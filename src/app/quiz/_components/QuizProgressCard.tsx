import React from 'react';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface QuizProgressCardProps {
  currentIndex: number;
  totalQuestions: number;
  answeredCount: number;
}

export const QuizProgressCard: React.FC<QuizProgressCardProps> = ({
  currentIndex,
  totalQuestions,
  answeredCount,
}) => {
  const remaining = Math.max(0, totalQuestions - answeredCount);
  const progressPercent =
    totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  const getStatusText = () => {
    if (answeredCount === 0) return 'Just starting test';
    if (progressPercent < 50) return `${progressPercent}% completed`;
    if (progressPercent < 100) return 'Final stretch!';
    return 'Ready to grade!';
  };

  return (
    <Panel padding="md" className="flex flex-col gap-3.5 bg-[var(--bg-surface)]">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] leading-[20px] font-semibold text-[var(--ink-primary)]">
          Quiz Progress
        </h3>
        <span className="text-[12px] font-bold text-[var(--accent-ochre)]">
          {currentIndex + 1} / {totalQuestions}
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        <ProgressBar value={progressPercent} />
        <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
          {getStatusText()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Answered */}
        <div className="p-3 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex flex-col">
          <span className="text-[26px] leading-[36px] font-semibold text-[var(--ink-primary)]">
            {answeredCount}
          </span>
          <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
            Answered
          </span>
        </div>

        {/* Remaining */}
        <div className="p-3 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex flex-col">
          <span className="text-[26px] leading-[36px] font-semibold text-[var(--ink-primary)]">
            {remaining}
          </span>
          <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
            Remaining
          </span>
        </div>
      </div>
    </Panel>
  );
};
