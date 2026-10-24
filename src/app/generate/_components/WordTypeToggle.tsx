'use client';

import React from 'react';
import { CheckCircle2, Circle } from 'lucide-react';
import { ArabicText } from '@/components/ui/ArabicText';

export interface WordTypeItem {
  id: string;
  label: string;
  arabic: string;
}

export const WORD_TYPES: WordTypeItem[] = [
  { id: 'nouns', label: 'Nouns', arabic: 'أَسْمَاء' },
  { id: 'verbs', label: 'Verbs', arabic: 'أَفْعَال' },
  { id: 'adjectives', label: 'Adjectives', arabic: 'صِفَات' },
  { id: 'mixed', label: 'Expressions', arabic: 'عِبَارَات' },
];

interface WordTypeToggleProps {
  value: string;
  onChange: (id: string) => void;
}

export const WordTypeToggle: React.FC<WordTypeToggleProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full">
      {WORD_TYPES.map((type) => {
        const isSelected = value === type.id;

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onChange(type.id)}
            className={`p-3 rounded-[8px] border text-left flex flex-col justify-between h-[80px] transition-all cursor-pointer select-none ${
              isSelected
                ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)]'
                : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/40'
            }`}
          >
            {/* Top row: Label + Checkbox/Circle icon */}
            <div className="flex items-center justify-between w-full">
              <span className={`text-[12px] font-medium ${isSelected ? 'text-[var(--ink-primary)] font-semibold' : 'text-[var(--ink-secondary)]'}`}>
                {type.label}
              </span>
              {isSelected ? (
                <CheckCircle2 className="w-4 h-4 text-[var(--accent-ochre)] shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-[var(--border-strong)] shrink-0" />
              )}
            </div>

            {/* Bottom: Arabic script */}
            <ArabicText
              as="span"
              size="sm"
              color={isSelected ? 'accent' : 'secondary'}
              weight="medium"
              align="right"
              className="text-[17px] leading-[26px]"
            >
              {type.arabic}
            </ArabicText>
          </button>
        );
      })}
    </div>
  );
};
