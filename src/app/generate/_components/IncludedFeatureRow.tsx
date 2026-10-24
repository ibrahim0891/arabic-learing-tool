'use client';

import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Text } from '@/components/ui/Text';

interface IncludedFeatureRowProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** e.g. the live vocabulary count from current configuration */
  trailingMeta?: string;
}

/**
 * Row in the live preview panel describing an included capability.
 */
export const IncludedFeatureRow: React.FC<IncludedFeatureRowProps> = ({
  icon: Icon,
  title,
  description,
  trailingMeta,
}) => {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-[8px] bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <Text variant="body" color="primary" weight="semibold" as="span">
            {title}
          </Text>
          {trailingMeta && (
            <Text variant="meta" color="accent" weight="bold" as="span">
              {trailingMeta}
            </Text>
          )}
        </div>
        <Text variant="secondary" color="muted">
          {description}
        </Text>
      </div>
    </div>
  );
};
