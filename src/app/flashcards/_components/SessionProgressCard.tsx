import React from 'react';
import { Panel } from '@/components/ui/Panel';
import { ProgressBar } from '@/components/ui/ProgressBar';

interface SessionProgressCardProps {
  currentIndex: number;
  totalCards: number;
  studiedCount: number;
}

export const SessionProgressCard: React.FC<SessionProgressCardProps> = ({
  currentIndex,
  totalCards,
  studiedCount,
}) => {
  const remaining = Math.max(0, totalCards - currentIndex);
  const progressPercent = totalCards > 0 ? Math.round(((currentIndex) / totalCards) * 100) : 0;

  const getStatusText = () => {
    if (progressPercent === 0) return 'Just getting started';
    if (progressPercent < 50) return `${progressPercent}% in progress`;
    if (progressPercent < 100) return 'Almost there!';
    return 'Session completed';
  };

  return (
    <Panel padding="md" className="flex flex-col gap-3.5 bg-[var(--bg-surface)]">
      <h3 className="text-[14px] leading-[20px] font-semibold text-[var(--ink-primary)]">
        Session progress
      </h3>

      <div className="flex flex-col gap-1.5">
        <ProgressBar value={progressPercent} />
        <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
          {getStatusText()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Remaining */}
        <div className="p-3 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex flex-col">
          <span className="text-[26px] leading-[36px] font-semibold text-[var(--ink-primary)]">
            {remaining}
          </span>
          <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
            Remaining
          </span>
        </div>

        {/* Studied */}
        <div className="p-3 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex flex-col">
          <span className="text-[26px] leading-[36px] font-semibold text-[var(--ink-primary)]">
            {studiedCount}
          </span>
          <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
            Reviewed
          </span>
        </div>
      </div>
    </Panel>
  );
};
