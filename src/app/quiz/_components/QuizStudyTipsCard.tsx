import React from 'react';
import { Panel } from '@/components/ui/Panel';
import { Lightbulb, Sparkles } from 'lucide-react';
import { ArabicText } from '@/components/ui/ArabicText';

export const QuizStudyTipsCard: React.FC = () => {
  return (
    <Panel padding="md" className="flex flex-col gap-3 bg-[var(--bg-surface)]">
      <div className="flex items-center gap-2">
        <Lightbulb className="w-4 h-4 text-[var(--accent-ochre)]" />
        <h4 className="text-[14px] leading-[20px] font-semibold text-[var(--ink-primary)]">
          Active Recall Tip
        </h4>
      </div>

      <p className="text-[12px] leading-[19px] text-[var(--ink-secondary)]">
        Testing yourself is <strong className="text-[var(--ink-primary)]">3x more effective</strong> than passively rereading flashcards. Don't worry if you miss words — mistakes trigger stronger neural consolidation.
      </p>

      <div className="pt-2 border-t border-[var(--border-subtle)]/60 flex items-center justify-between text-[11px] text-[var(--ink-muted)]">
        <span>Spaced Repetition</span>
        <ArabicText as="span" size="sm" weight="medium" color="secondary">
          التَّكْرَارُ المُتَبَاعِد
        </ArabicText>
      </div>
    </Panel>
  );
};
