'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DashboardView } from '@/components/DashboardView';
import { useStats } from '@/context/StatsContext';

export default function HomePage() {
  const router = useRouter();
  const { stats } = useStats();

  const handleNavigate = (view: 'dashboard' | 'generate' | 'flashcards' | 'test' | 'library') => {
    switch (view) {
      case 'dashboard':
        router.push('/');
        break;
      case 'generate':
        router.push('/generate');
        break;
      case 'flashcards':
        router.push('/flashcards');
        break;
      case 'test':
        router.push('/quiz');
        break;
      case 'library':
        router.push('/library');
        break;
    }
  };

  const handleQuickStudy = (filter?: string) => {
    if (filter && filter !== 'all') {
      router.push(`/flashcards?filter=${filter}`);
    } else {
      router.push('/flashcards');
    }
  };

  const handleQuickTest = (filter?: string) => {
    if (filter && filter !== 'all') {
      router.push(`/quiz?filter=${filter}`);
    } else {
      router.push('/quiz');
    }
  };

  return (
    <DashboardView
      stats={stats}
      onNavigate={handleNavigate}
      onQuickStudy={handleQuickStudy}
      onQuickTest={handleQuickTest}
    />
  );
}
