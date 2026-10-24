import React from 'react';
import { Lightbulb } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';

export const RecallTipCard: React.FC = () => {
  return (
    <Panel padding="md" className="flex items-start gap-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
      <div className="w-8 h-8 rounded-full bg-[var(--bg-accent-tint)] flex items-center justify-center shrink-0 text-[var(--accent-ochre)] mt-0.5">
        <Lightbulb className="w-4 h-4" />
      </div>

      <div className="flex flex-col gap-1">
        <h4 className="text-[13px] leading-[18px] font-semibold text-[var(--ink-primary)]">
          Recall first, then reveal
        </h4>
        <p className="text-[12px] leading-[18px] text-[var(--ink-secondary)]">
          Say the meaning aloud before turning the card. After revealing it, mark how well you remembered the word to guide your next review.
        </p>
      </div>
    </Panel>
  );
};
