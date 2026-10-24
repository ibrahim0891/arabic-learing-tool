import React from 'react';
import { Panel } from '@/components/ui/Panel';

export const KeyboardShortcutsCard: React.FC = () => {
  return (
    <Panel padding="md" className="flex flex-col gap-3 bg-[var(--bg-surface)]">
      <h3 className="text-[14px] leading-[20px] font-semibold text-[var(--ink-primary)]">
        Keyboard shortcuts
      </h3>

      <div className="flex flex-col gap-2 text-[12px] leading-[18px]">
        {/* Flip */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--ink-secondary)]">Flip card</span>
          <kbd className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--ink-primary)] shadow-2xs">
            Space
          </kbd>
        </div>

        {/* Previous / Next */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--ink-secondary)]">Previous / Next</span>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              ←
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              →
            </kbd>
          </div>
        </div>

        {/* Rate 1-4 */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--ink-secondary)]">Rate Recall (1-4)</span>
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              1
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              2
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              3
            </kbd>
            <kbd className="px-1.5 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] shadow-2xs">
              4
            </kbd>
          </div>
        </div>

        {/* Shuffle */}
        <div className="flex items-center justify-between">
          <span className="text-[var(--ink-secondary)]">Shuffle</span>
          <kbd className="px-2 py-0.5 rounded-[4px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--ink-primary)] shadow-2xs">
            S
          </kbd>
        </div>
      </div>
    </Panel>
  );
};
