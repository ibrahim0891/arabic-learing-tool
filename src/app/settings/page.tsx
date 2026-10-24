'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { SettingsWorkspace } from './_sections/SettingsWorkspace';
import { useStats } from '@/context/StatsContext';

export default function SettingsPage() {
  const router = useRouter();
  const { refreshStats } = useStats();

  return (
    <SettingsWorkspace
      onResetCompleted={() => refreshStats()}
      onNavigateHome={() => router.push('/')}
    />
  );
}
