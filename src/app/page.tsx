'use client';

import React from 'react';
import { useStats } from '@/context/StatsContext';
import { HeroSection } from './_sections/HeroSection';
import { MetricOverviewSection } from './_sections/MetricOverviewSection';
import { DailyArabicSection } from './_sections/DailyArabicSection';
import { LearningActivitiesSection } from './_sections/LearningActivitiesSection';
import { RecentActivitySection } from './_sections/RecentActivitySection';

export default function HomePage() {
  const { stats } = useStats();

  return (
    <div className="p-6 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-[28px] animate-fadeIn">
      {/* 1. Page Heading & Welcome */}
      <HeroSection />

      {/* 2. Learning Overview (3 Metric Cards) */}
      <MetricOverviewSection stats={stats} />

      {/* 3. Daily Arabic Inspiration Panel */}
      <DailyArabicSection />

      {/* 4. Learning Activities (Featured Learn Card + Practice Cards) */}
      <LearningActivitiesSection stats={stats} />

      {/* 5. Recent Activity History */}
      <RecentActivitySection stats={stats} />
    </div>
  );
}
