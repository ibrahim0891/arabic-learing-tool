'use client';

import React from 'react';
import { ArabicText } from '@/components/ui/ArabicText';
import { Check } from 'lucide-react';

interface QuestionOptionCardProps {
  option: string;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export const QuestionOptionCard: React.FC<QuestionOptionCardProps> = ({
  option,
  index,
  isSelected,
  onSelect,
  disabled = false,
}) => {
  const isArabic = /[\u0600-\u06FF]/.test(option);
  const letter = String.fromCharCode(65 + index); // A, B, C, D

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      aria-pressed={isSelected}
      className={`w-full p-4 rounded-[10px] text-left transition-all duration-150 border cursor-pointer flex items-center justify-between gap-4 select-none ${
        isSelected
          ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] shadow-xs ring-1 ring-[var(--accent-ochre)]'
          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-primary)] hover:border-[var(--accent-ochre)]/50 hover:bg-[#FAFBFB]'
      } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
    >
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <span
          className={`w-7 h-7 rounded-[6px] border flex items-center justify-center text-[12px] font-bold font-sans shrink-0 transition-colors ${
            isSelected
              ? 'bg-[var(--accent-ochre)] text-white border-[var(--accent-ochre)]'
              : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)]'
          }`}
        >
          {letter}
        </span>

        {isArabic ? (
          <ArabicText
            as="span"
            size="lg"
            weight="bold"
            className="block text-[22px] leading-[36px] text-right"
          >
            {option}
          </ArabicText>
        ) : (
          <span className="text-[14px] leading-[22px] font-medium text-[var(--ink-primary)] break-words">
            {option}
          </span>
        )}
      </div>

      <div className="shrink-0 flex items-center">
        {isSelected && (
          <div className="w-5 h-5 rounded-full bg-[var(--accent-ochre)] text-white flex items-center justify-center">
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        )}
      </div>
    </button>
  );
};
