'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { TestGeneratorView } from '@/components/TestGeneratorView';
import { useStats } from '@/context/StatsContext';

function QuizContent() {
  const searchParams = useSearchParams();
  const filter = searchParams.get('filter') || 'all';
  const { refreshStats } = useStats();

  return (
    <TestGeneratorView
      initialFilter={filter}
      onTestComplete={() => refreshStats()}
    />
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center text-[var(--ink-muted)] space-y-3">
          <div className="font-arabic text-4xl text-[var(--accent-ochre)] animate-pulse">
            جَارٍ تَحْضِيرُ الِاخْتِبَارِ...
          </div>
          <p className="text-sm font-semibold">Preparing your quiz...</p>
        </div>
      }
    >
      <QuizContent />
    </Suspense>
  );
}
