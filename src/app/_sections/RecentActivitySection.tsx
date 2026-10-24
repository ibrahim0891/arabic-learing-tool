'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, GraduationCap } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { DashboardStats } from '@/lib/types';

interface RecentActivitySectionProps {
  stats: DashboardStats | null;
}

export const RecentActivitySection: React.FC<RecentActivitySectionProps> = ({ stats }) => {
  const sessions = stats?.recentSessions || [];

  return (
    <section className="flex flex-col gap-3 pt-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[14px] leading-[21px] font-semibold text-[var(--ink-primary)]">
          Recent Study Activity
        </h3>
        <Link
          href="/library"
          className="text-[12px] leading-[18px] text-[var(--accent-ochre)] hover:underline flex items-center gap-1 font-medium no-underline"
        >
          <span>See all saved words</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      {sessions.length > 0 ? (
        <Panel padding="none" className="divide-y divide-[var(--border-subtle)] overflow-hidden">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="py-3 px-4 flex items-center justify-between text-xs hover:bg-[var(--bg-canvas)] transition-colors"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[6px] text-[11px] font-semibold ${
                    session.type === 'test'
                      ? 'text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10'
                      : 'text-[var(--accent-cypress)] bg-[var(--accent-cypress-dim)]'
                  }`}
                >
                  {session.type === 'test' ? (
                    <GraduationCap className="w-3 h-3" />
                  ) : (
                    <BookOpen className="w-3 h-3" />
                  )}
                  {session.type === 'test' ? 'Quiz' : 'Flashcards'}
                </span>
                <span className="text-[var(--ink-primary)] font-medium text-[13px]">
                  {session.type === 'test'
                    ? `Scored ${session.score} / ${session.totalQuestions} correct (${session.accuracyPercentage}%)`
                    : `Practiced ${session.cardsStudied} flashcards`}
                </span>
              </div>
              <span className="text-[var(--ink-muted)] text-[11px]">
                {new Date(session.date).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          ))}
        </Panel>
      ) : (
        <div className="py-6 px-4 text-center text-[12px] leading-[18px] text-[var(--ink-secondary)] bg-[var(--bg-surface)] border border-dashed border-[var(--border-subtle)] rounded-[12px]">
          No study activity yet today. Click <strong>Learn 10 New Words</strong> above to begin your Arabic journey!
        </div>
      )}
    </section>
  );
};
