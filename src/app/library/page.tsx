'use client';

import React from 'react';
import { VocabularyLibraryView } from '@/components/VocabularyLibraryView';
import { useStats } from '@/context/StatsContext';

export default function LibraryPage() {
  const { refreshStats } = useStats();

  return (
    <VocabularyLibraryView
      onWordCountChange={() => refreshStats()}
    />
  );
}
