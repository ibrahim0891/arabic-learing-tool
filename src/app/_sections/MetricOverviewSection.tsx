'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Library, Layers, Target } from 'lucide-react';
import { MetricCard } from '@/components/ui/MetricCard';
import { DashboardStats } from '@/lib/types';

interface MetricOverviewSectionProps {
  stats: DashboardStats | null;
}

export const MetricOverviewSection: React.FC<MetricOverviewSectionProps> = ({ stats }) => {
  const router = useRouter();

  return (
    <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        label="Total words saved"
        value={stats?.totalWords ?? 0}
        subLabel="in word bank"
        icon={<Library className="w-[17px] h-[17px]" />}
        onClick={() => router.push('/library')}
      />

      <MetricCard
        label="Due for review"
        value={stats?.readyForRevision ?? 0}
        subLabel="cards to flip"
        icon={<Layers className="w-[17px] h-[17px]" />}
        onClick={() => router.push('/flashcards')}
      />

      <MetricCard
        label="Review accuracy"
        value={`${stats?.accuracyRate ?? 88}%`}
        subLabel="overall score"
        icon={<Target className="w-[17px] h-[17px]" />}
        onClick={() => router.push('/quiz')}
      />
    </section>
  );
};
