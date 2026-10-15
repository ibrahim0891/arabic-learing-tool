'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SettingsView } from '@/components/SettingsView';
import { useStats } from '@/context/StatsContext';

export default function SettingsPage() {
  const router = useRouter();
  const { refreshStats } = useStats();

  return (
    <SettingsView
      onResetCompleted={() => refreshStats()}
      onNavigateHome={() => router.push('/')}
    />
  );
}
