'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useStats } from '@/context/StatsContext';
import { GenerateWorkspace } from './_sections/GenerateWorkspace';

export default function GeneratePage() {
  const router = useRouter();
  const { refreshStats } = useStats();

  return (
    <GenerateWorkspace
      onSavedSuccess={() => refreshStats()}
      onNavigateToStudy={() => router.push('/flashcards')}
    />
  );
}
