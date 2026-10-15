'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { WordGeneratorView } from '@/components/WordGeneratorView';
import { useStats } from '@/context/StatsContext';

export default function GeneratePage() {
  const router = useRouter();
  const { refreshStats } = useStats();

  return (
    <WordGeneratorView
      onSavedSuccess={() => refreshStats()}
      onNavigateToStudy={() => router.push('/flashcards')}
    />
  );
}
