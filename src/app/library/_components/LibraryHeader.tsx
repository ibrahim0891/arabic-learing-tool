'use client';

import React from 'react';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArabicText } from '@/components/ui/ArabicText';
import { BookOpen, BarChart3, Plus, Sparkles } from 'lucide-react';

interface LibraryHeaderProps {
  totalWords: number;
  onOpenProgress: () => void;
  onOpenAdd: () => void;
}

export const LibraryHeader: React.FC<LibraryHeaderProps> = ({
  totalWords,
  onOpenProgress,
  onOpenAdd,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="ochre">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3 text-[var(--accent-ochre)]" />
              مَكْتَبَةُ المُفْرَدَاتِ • WORD BANK
            </span>
          </Badge>
          <span className="text-[12px] text-[var(--ink-muted)]">
            {totalWords} saved {totalWords === 1 ? 'word' : 'words'}
          </span>
        </div>

        <div className="flex items-baseline gap-3">
          <Heading level={1} className="text-[24px] sm:text-[28px] font-bold text-[var(--ink-primary)]">
            Your Arabic Vocabulary Library
          </Heading>
          <ArabicText as="span" size="lg" weight="bold" color="accent" className="hidden md:inline">
            قَامُوسُكَ الشَّخْصِيّ
          </ArabicText>
        </div>

        <Text color="secondary" variant="secondary" className="max-w-xl">
          Browse, search, edit roots, and launch custom review decks from your personal dictionary.
        </Text>
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        <Button
          id="learning-progress-btn"
          variant="secondary"
          size="sm"
          onClick={onOpenProgress}
          leftIcon={<BarChart3 className="w-3.5 h-3.5" />}
        >
          Mastery Stats
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onOpenAdd}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add Word Manually
        </Button>
      </div>
    </div>
  );
};
