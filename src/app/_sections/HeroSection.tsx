'use client';

import React from 'react';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ArabicText } from '@/components/ui/ArabicText';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';

interface HeroSectionProps {
  onAddWords?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onAddWords }) => {
  const welcomeArabic = 'أَهْلاً وَسَهْلاً بِكَ فِي رِحْلَةِ تَعَلُّمِ العَرَبِيَّةِ';

  return (
    <section className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
      <div className="flex flex-col gap-1.5 max-w-3xl">
        {/* Title row */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4">
          <h1 className="text-[26px] sm:text-[28px] leading-[38px] sm:leading-[42px] font-normal text-[var(--ink-primary)] tracking-tight">
            Welcome back!
          </h1>
          <div className="flex items-center gap-2">
            <ArabicText
              size="lg"
              color="accent"
              weight="normal"
              className="font-arabic"
            >
              {welcomeArabic}
            </ArabicText>
            <AudioPronounceButton
              arabicText={welcomeArabic}
              size="sm"
              title="Listen to welcome sentence"
            />
          </div>
        </div>

        {/* Description */}
        <p className="text-[13px] sm:text-[14px] leading-[21px] text-[var(--ink-secondary)] font-normal max-w-2xl">
          Pick up right where you left off. Learn new words with real-life example sentences, practice with flashcards, and test your memory when you feel ready.
        </p>
      </div>

      {/* Action Button */}
      <div className="shrink-0">
        <Link href="/generate" className="no-underline">
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={onAddWords}
          >
            Add Words
          </Button>
        </Link>
      </div>
    </section>
  );
};
