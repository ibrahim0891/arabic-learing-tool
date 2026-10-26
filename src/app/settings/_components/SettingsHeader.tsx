'use client';

import React from 'react';
import { ArabicText } from '@/components/ui/ArabicText';

export const SettingsHeader: React.FC = () => {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3 flex-wrap">
        <h1 className="text-[26px] sm:text-[28px] leading-[38px] sm:leading-[42px] font-semibold text-[var(--ink-primary)] tracking-tight">
          Manage Your Learning Data &amp; Storage
        </h1>
        <ArabicText as="span" size="sm" color="accent" weight="medium">
          إِدَارَةُ البَيَانَات
        </ArabicText>
      </div>
      <p className="text-[13px] sm:text-[14px] leading-[21px] text-[var(--ink-secondary)] max-w-2xl">
        Control your local and synced data. Reset spaced repetition memory intervals, wipe study history, or restore starter vocabulary sets at any time.
      </p>
    </div>
  );
};
