'use client';

import React from 'react';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ArabicText } from '@/components/ui/ArabicText';
import { Settings, Database } from 'lucide-react';

export const SettingsHeader: React.FC = () => {
  return (
    <div className="space-y-1.5 pb-4 border-b border-[var(--border-subtle)]">
      <div className="flex items-center gap-2">
        <Badge variant="ochre">
          <span className="flex items-center gap-1.5">
            <Settings className="w-3 h-3 text-[var(--accent-ochre)]" />
            إِعْدَادَاتُ التَّطْبِيقِ • SETTINGS & DATA
          </span>
        </Badge>
        <span className="text-[12px] text-[var(--ink-muted)]">Data Management</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <Heading level={1} className="text-[24px] sm:text-[28px] font-bold text-[var(--ink-primary)]">
          Manage Your Learning Data & Storage
        </Heading>
        <ArabicText as="span" size="lg" weight="bold" color="accent" className="hidden sm:inline">
          إِدَارَةُ البَيَانَات
        </ArabicText>
      </div>

      <Text color="secondary" variant="secondary" className="max-w-2xl">
        Control your local and synced data. Reset spaced repetition memory intervals, wipe study history, or restore starter vocabulary sets at any time.
      </Text>
    </div>
  );
};
