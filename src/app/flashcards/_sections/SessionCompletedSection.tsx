'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { RotateCw, Library, Home } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { ArabicText } from '@/components/ui/ArabicText';
import { Button } from '@/components/ui/Button';

interface SessionCompletedSectionProps {
  studiedCount: number;
  totalCards: number;
  isPracticeMode?: boolean;
  practiceDeckLabel?: string;
  onRestart: () => void;
}

export const SessionCompletedSection: React.FC<SessionCompletedSectionProps> = ({
  studiedCount,
  totalCards,
  isPracticeMode = false,
  practiceDeckLabel,
  onRestart,
}) => {
  const router = useRouter();

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-56px)] sm:min-h-[calc(100vh-72px)] p-4 sm:p-6 w-full animate-fadeIn">
      <Panel
        padding="lg"
        className="max-w-2xl w-full mx-auto flex flex-col items-center text-center gap-6 py-12 bg-[var(--bg-surface)] shadow-sm"
      >
      <div className="flex flex-col items-center gap-2">
        <ArabicText
          size="hero"
          color="accent"
          weight="bold"
          align="center"
          className="font-arabic text-4xl sm:text-5xl"
        >
          أَحْسَنْتَ ! مُمْتَاز
        </ArabicText>

        <h2 className="text-[26px] sm:text-[28px] font-semibold text-[var(--ink-primary)]">
          {isPracticeMode ? 'Practice Session Finished!' : 'Review Session Complete!'}
        </h2>

        <p className="text-[14px] leading-[21px] text-[var(--ink-secondary)] max-w-md">
          {isPracticeMode
            ? `You completed ${studiedCount} cards in casual practice mode without affecting your learning schedule.`
            : `You reviewed ${studiedCount} out of ${totalCards} scheduled cards. Your spaced repetition intervals have been saved!`}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
        <Button
          variant="primary"
          size="md"
          leftIcon={<RotateCw className="w-4 h-4" />}
          onClick={onRestart}
        >
          Practice Again
        </Button>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<Library className="w-4 h-4" />}
          onClick={() => {
            try { sessionStorage.removeItem('fasih_practice_deck'); } catch (_) {}
            router.push('/library');
          }}
        >
          View Word Bank
        </Button>

        <Button
          variant="secondary"
          size="md"
          leftIcon={<Home className="w-4 h-4" />}
          onClick={() => router.push('/')}
        >
          Dashboard
        </Button>
      </div>
    </Panel>
  </div>
  );
};
