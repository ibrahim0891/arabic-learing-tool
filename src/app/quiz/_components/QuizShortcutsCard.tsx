import React from 'react';
import { Panel } from '@/components/ui/Panel';

export const QuizShortcutsCard: React.FC = () => {
  return (
    <Panel padding="md" className="flex flex-col gap-3 bg-[var(--bg-surface)]">
      <h3 className="text-[14px] leading-[20px] font-semibold text-[var(--ink-primary)]">
        Keyboard Shortcuts
      </h3>

      <div className="flex flex-col gap-2 text-[12px] leading-[18px]">
        {/* Select Options A-D or 1-4 */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--ink-secondary)]">Pick Option (A-D)</span>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              A
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              B
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              C
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              D
            </kbd>
          </div>
        </div>

        {/* Advance / Submit */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--ink-secondary)]">Next / Submit</span>
          <kbd className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--ink-primary)] shadow-2xs">
            Enter ↵
          </kbd>
        </div>

        {/* Previous */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--ink-secondary)]">Previous Question</span>
          <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-mono text-[11px] shadow-2xs">
            ←
          </kbd>
        </div>
      </div>
    </Panel>
  );
};
