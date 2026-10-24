'use client';

import React from 'react';
import { LibraryWorkspace } from './_sections/LibraryWorkspace';
import { useStats } from '@/context/StatsContext';

export default function LibraryPage() {
  const { refreshStats } = useStats();

  return (
    <LibraryWorkspace
      onWordCountChange={() => refreshStats()}
    />
  );
}
