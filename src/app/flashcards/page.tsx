'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { FlashcardStudyArena } from './_sections/FlashcardStudyArena';
import { useStats } from '@/context/StatsContext';

function FlashcardContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'smart';
  const mode = searchParams.get('mode') || undefined;
  const status = searchParams.get('status') || undefined;
  const { refreshStats } = useStats();

  return (
    <FlashcardStudyArena
      initialFilter={filter}
      initialMode={mode}
      initialStatus={status}
      onSessionComplete={() => refreshStats()}
    />
  );
}

export default function FlashcardsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-[var(--ink-secondary)] space-y-3">
          <div className="font-arabic text-4xl text-[var(--accent-ochre)] animate-pulse">
            جَارٍ تَحْمِيلُ البِطَاقَاتِ...
          </div>
          <p className="text-sm font-semibold">Loading your flashcards...</p>
        </div>
      }
    >
      <FlashcardContent />
    </Suspense>
  );
}
