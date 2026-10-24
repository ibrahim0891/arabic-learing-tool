'use client';

import React from 'react';
import { Panel } from '@/components/ui/Panel';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { ArabicText } from '@/components/ui/ArabicText';

interface SettingsOptionCardProps {
  title: string;
  arabic?: string;
  description: React.ReactNode;
  icon: React.ReactNode;
  badge?: {
    label: string;
    variant: 'ochre' | 'danger' | 'neutral' | 'success';
  };
  actionButton: React.ReactNode;
  isDanger?: boolean;
}

export const SettingsOptionCard: React.FC<SettingsOptionCardProps> = ({
  title,
  arabic,
  description,
  icon,
  badge,
  actionButton,
  isDanger = false,
}) => {
  return (
    <Panel
      padding="lg"
      className={`transition-all ${
        isDanger
          ? 'border-[var(--accent-terracotta)]/30 hover:border-[var(--accent-terracotta)]/60'
          : 'hover:border-[var(--border-strong)]'
      }`}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`p-2 rounded-[8px] shrink-0 ${
                isDanger
                  ? 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                  : 'bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)]'
              }`}
            >
              {icon}
            </div>

            <Heading level={2} className="text-[17px] font-bold text-[var(--ink-primary)]">
              {title}
            </Heading>

            {arabic && (
              <ArabicText as="span" size="sm" weight="bold" color={isDanger ? 'primary' : 'accent'}>
                {arabic}
              </ArabicText>
            )}

            {badge && (
              <Badge variant={badge.variant}>
                {badge.label}
              </Badge>
            )}
          </div>

          <div className="text-[13px] leading-[20px] text-[var(--ink-secondary)] max-w-xl pl-0 sm:pl-10">
            {description}
          </div>
        </div>

        <div className="shrink-0 self-start sm:self-center">
          {actionButton}
        </div>
      </div>
    </Panel>
  );
};
