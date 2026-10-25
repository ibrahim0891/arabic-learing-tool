'use client';

import React from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Layers,
  ClipboardCheck,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { ArabicText } from '@/components/ui/ArabicText';
import { Button } from '@/components/ui/Button';
import { ActivityCard } from '../_components/ActivityCard';
import { DashboardStats } from '@/lib/types';

interface LearningActivitiesSectionProps {
  stats: DashboardStats | null;
}

export const LearningActivitiesSection: React.FC<LearningActivitiesSectionProps> = ({ stats }) => {
  const readyWords = stats?.readyForRevision ?? 20;

  return (
    <section className="flex flex-col gap-4">


      {/* Activities Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left Column: Featured "New Vocabulary" Card (5 of 12 columns) */}
        <div className="lg:col-span-5 flex flex-col">
          <Panel padding="lg" className="flex-1 flex flex-col justify-between gap-5 border border-[var(--border-subtle)]">
            <div className="flex flex-col gap-4">
              {/* Header pill & icon */}
              <div className="flex items-center justify-between">
                <Badge variant="ochre">Step 1 • Learn</Badge>
                <BookOpen className="w-[22px] h-[22px] text-[var(--accent-ochre)]" />
              </div>

              {/* Title & Arabic script */}
              <div className="flex flex-col gap-1.5">
                <ArabicText
                  size="xl"
                  color="accent"
                  weight="normal"
                  className="block text-left font-arabic"
                >
                  كَلِمَاتٌ جَدِيدَة
                </ArabicText>
                <h3 className="text-[22px] sm:text-[23px] leading-[32px] sm:leading-[34px] font-semibold text-[var(--ink-primary)]">
                  Learn 10 New Words
                </h3>
                <p className="text-[13px] sm:text-[14px] leading-[21px] text-[var(--ink-secondary)]">
                  Choose a fun everyday topic like food, daily life, or travel. The AI will give you 10 easy-to-learn words with audio pronunciation, diacritics, and natural sentences.
                </p>
              </div>

              {/* Example vocabulary preview row */}
              <div className="flex items-center justify-around p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] my-1">
                <div className="flex items-center gap-2">
                  <span className="font-arabic text-[22px] leading-[36px] text-[var(--ink-primary)] font-medium">
                    شَاي
                  </span>
                  <span className="text-[12px] leading-[18px] text-[var(--ink-secondary)]">
                    Tea
                  </span>
                </div>
                <div className="w-[1px] h-[20px] bg-[var(--border-subtle)]" />
                <div className="flex items-center gap-2">
                  <span className="font-arabic text-[22px] leading-[36px] text-[var(--ink-primary)] font-medium">
                    قَهْوَة
                  </span>
                  <span className="text-[12px] leading-[18px] text-[var(--ink-secondary)]">
                    Coffee
                  </span>
                </div>
              </div>
            </div>

            {/* Start Learning Action Button */}
            <div>
              <Link href="/generate" className="no-underline block">
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Start learning
                </Button>
              </Link>
            </div>
          </Panel>
        </div>

        {/* Right Column: Stacked Practice Activities (7 of 12 columns) */}
        <div className="lg:col-span-7 flex flex-col gap-3">
          <ActivityCard
            href="/flashcards"
            stepTag="Step 2 • Practice"
            title="Practice Flashcards"
            description="Flip cards to test your memory, listen to audio, and mark if a word was easy, good, or hard for you."
            actionText={readyWords > 0 ? `${readyWords} words to review now` : 'Ready to practice'}
            icon={<Layers className="w-[18px] h-[18px]" />}
          />

          <ActivityCard
            href="/quiz"
            stepTag="Step 3 • Check Yourself"
            title="Take a Quick Quiz"
            description="Fun quizzes with multiple choice, fill-in-the-blank, and typing. See how many words you remember!"
            actionText="Test your vocabulary"
            icon={<ClipboardCheck className="w-[18px] h-[18px]" />}
          />

          <ActivityCard
            href="/conversations"
            stepTag="Step 4 • Read & Chat"
            title="Spoken Dialogues"
            description="Read authentic conversational chats, hover for audio, and tap bubbles to reveal translations."
            actionText="Practice Spoken Dialogues"
            icon={<MessageSquare className="w-[18px] h-[18px]" />}
          />
        </div>
      </div>
    </section>
  );
};
