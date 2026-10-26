'use client';

import React, { useEffect, useRef } from 'react';
import { Play } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Word } from '@/lib/types';

interface FlashcardDeckQueueProps {
  words: Word[];
  currentIndex: number;
  onSelectIndex: (index: number) => void;
}

export const FlashcardDeckQueue: React.FC<FlashcardDeckQueueProps> = ({
  words,
  currentIndex,
  onSelectIndex,
}) => {
  const activeItemRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll the active card into view when current card changes
  useEffect(() => {
    if (activeItemRef.current && containerRef.current) {
      activeItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentIndex]);

  return (
    <Panel padding="none" className="flex flex-col bg-[var(--bg-surface)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] sticky top-0 z-10">
        <h3 className="text-[14px] leading-[20px] font-semibold text-[var(--ink-primary)]">
          Deck queue
        </h3>
        <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)] font-medium">
          {words.length} cards
        </span>
      </div>

      {/* Full Scrollable Queue List */}
      <div
        ref={containerRef}
        className="max-h-[380px] sm:max-h-[420px] overflow-y-auto divide-y divide-[var(--border-subtle)] scroll-smooth"
      >
        {words.map((word, idx) => {
          const isActive = idx === currentIndex;
          const formattedIndex = String(idx + 1).padStart(2, '0');

          return (
            <div
              key={word.id || idx}
              ref={isActive ? activeItemRef : null}
              onClick={() => onSelectIndex(idx)}
              className={`flex items-center justify-between px-4 py-2.5 transition-colors cursor-pointer select-none ${
                isActive
                  ? 'bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] font-semibold'
                  : 'hover:bg-[var(--bg-canvas)] text-[var(--ink-secondary)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-[11px] font-mono opacity-60 shrink-0">
                  {formattedIndex}
                </span>
                <span
                  dir="rtl"
                  className={`font-arabic text-[18px] leading-[26px] truncate ${
                    isActive ? 'text-[var(--accent-ochre)] font-bold' : 'text-[var(--ink-primary)]'
                  }`}
                >
                  {word.arabic}
                </span>
              </div>

              {isActive && (
                <Play className="w-3.5 h-3.5 fill-[var(--accent-ochre)] text-[var(--accent-ochre)] shrink-0 ml-2" />
              )}
            </div>
          );
        })}
      </div>
    </Panel>
  );
};
