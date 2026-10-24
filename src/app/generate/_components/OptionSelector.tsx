'use client';

import React from 'react';
import { ArabicText } from '@/components/ui/ArabicText';

export interface OptionItem {
  id: string | number;
  label: string;
  sub?: string;
  arabic?: string;
}

interface OptionSelectorProps {
  label: string;
  items: OptionItem[];
  value: string | number;
  onChange: (id: string | number) => void;
  columns?: 2 | 3 | 4;
  align?: 'left' | 'center';
  ariaLabel?: string;
}

const COLUMNS_CLASS = {
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
} as const;

/**
 * Single-select chip group matching Figma specifications:
 * Selected: #FBF3E7 bg, border #A46518, text #A46518, 8px radius
 * Unselected: #FFFFFF bg, border #E4E6E8, text #707780, 8px radius
 */
export const OptionSelector: React.FC<OptionSelectorProps> = ({
  items,
  value,
  onChange,
  columns = 3,
  align = 'center',
  ariaLabel,
}) => {
  const alignClass = align === 'left' ? 'text-left' : 'text-center';

  return (
    <div className={`grid ${COLUMNS_CLASS[columns]} gap-2`} role="group" aria-label={ariaLabel}>
      {items.map((item) => {
        const isSelected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            aria-pressed={isSelected}
            className={`rounded-[8px] border py-2.5 px-3 transition cursor-pointer select-none min-h-[42px] flex flex-col justify-center ${alignClass} ${
              isSelected
                ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] font-semibold shadow-2xs'
                : 'bg-[var(--bg-surface)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/40 hover:text-[var(--ink-primary)] font-normal'
            }`}
          >
            <div className="text-[12px] leading-[18px]">{item.label}</div>

            {item.arabic && (
              <ArabicText
                as="span"
                size="sm"
                align={align === 'left' ? 'left' : 'center'}
                color={isSelected ? 'accent' : 'secondary'}
                weight="medium"
                className="block truncate !text-[12px] !leading-none mt-0.5"
              >
                {item.arabic}
              </ArabicText>
            )}

            {item.sub && (
              <div
                className={`text-[10px] leading-[14px] mt-0.5 ${
                  isSelected ? 'text-[var(--accent-ochre)] opacity-90 font-medium' : 'text-[var(--ink-muted)]'
                }`}
              >
                {item.sub}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
};
