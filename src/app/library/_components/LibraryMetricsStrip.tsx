'use client';

import React from 'react';
import { MetricCard } from '@/components/ui/MetricCard';
import { BookMarked, Trophy, Sparkles, Flame } from 'lucide-react';

interface LibraryMetricsStripProps {
  totalWords: number;
  masteredCount: number;
  learningCount: number;
  strugglingCount: number;
  newCount: number;
  onFilterClick?: (status: string) => void;
}

export const LibraryMetricsStrip: React.FC<LibraryMetricsStripProps> = ({
  totalWords,
  masteredCount,
  learningCount,
  strugglingCount,
  newCount,
  onFilterClick,
}) => {
  const masteredPct = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. Total Words */}
      <MetricCard
        label="Total Vocabulary"
        value={totalWords}
        subLabel="saved words"
        icon={<BookMarked className="w-4 h-4 text-[var(--accent-ochre)]" />}
        onClick={onFilterClick ? () => onFilterClick('all') : undefined}
        className="cursor-pointer hover:border-[var(--accent-ochre)]/50 transition-colors"
      />

      {/* 2. Mastered */}
      <MetricCard
        label="Mastered Words"
        value={masteredCount}
        subLabel={`${masteredPct}% retention`}
        icon={<Trophy className="w-4 h-4 text-[var(--accent-cypress)]" />}
        onClick={onFilterClick ? () => onFilterClick('mastered') : undefined}
        className="cursor-pointer hover:border-[var(--accent-cypress)]/50 transition-colors"
      />

      {/* 3. In Learning */}
      <MetricCard
        label="Currently Learning"
        value={learningCount}
        subLabel="in SRS review"
        icon={<Sparkles className="w-4 h-4 text-[var(--accent-ochre)]" />}
        onClick={onFilterClick ? () => onFilterClick('learning') : undefined}
        className="cursor-pointer hover:border-[var(--accent-ochre)]/50 transition-colors"
      />

      {/* 4. Needs Practice */}
      <MetricCard
        label="Needs Practice"
        value={strugglingCount}
        subLabel={`${newCount} new untracked`}
        icon={<Flame className="w-4 h-4 text-[var(--accent-terracotta)]" />}
        onClick={onFilterClick ? () => onFilterClick('struggling') : undefined}
        className="cursor-pointer hover:border-[var(--accent-terracotta)]/50 transition-colors"
      />
    </div>
  );
};
