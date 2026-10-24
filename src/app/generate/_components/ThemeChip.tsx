'use client';

import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { ArabicText } from '@/components/ui/ArabicText';
import { Heading } from '@/components/ui/Heading';

interface ThemeChipProps {
  icon: LucideIcon;
  title: string;
  arabic: string;
  note?: string;
  selected: boolean;
  onClick: () => void;
}

/**
 * Selectable row for a curated thematic scenario.
 * Selected state: warm tint fill + ochre border per the design system.
 */
export const ThemeChip: React.FC<ThemeChipProps> = ({
  icon: Icon,
  title,
  arabic,
  note,
  selected,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`group w-full rounded-[8px] border text-left cursor-pointer transition-all duration-200 select-none p-2.5 flex items-center justify-between gap-3 ${
        selected
          ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)]'
          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-accent)]'
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`p-1.5 rounded-[8px] shrink-0 transition-colors ${
            selected
              ? 'bg-[var(--accent-ochre)] text-white'
              : 'bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)]'
          }`}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <Heading level={4} className="truncate">
            {title}
          </Heading>
          <ArabicText as="span" size="sm" align="left" className="block truncate text-[15px] leading-[165%]">
            {arabic}
          </ArabicText>
          {note && (
            <span className="block text-[11px] leading-[16px] text-[var(--ink-muted)] truncate">
              {note}
            </span>
          )}
        </div>
      </div>

      {selected && <CheckCircle2 className="w-4 h-4 text-[var(--accent-ochre)] shrink-0" />}
    </button>
  );
};
