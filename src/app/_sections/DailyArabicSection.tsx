'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { ArabicText } from '@/components/ui/ArabicText';
import { DailySentence } from '@/lib/types';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';

export const DailyArabicSection: React.FC = () => {
  const [dailySentence, setDailySentence] = useState<DailySentence | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fasih_daily_sentence');
        if (cached) return JSON.parse(cached);
      } catch (_) {}
    }
    return null;
  });

  useEffect(() => {
    const syncDailySentence = async () => {
      try {
        const res = await fetch('/api/daily-sentence');
        if (res.ok) {
          const data = await res.json();
          if (data.sentence && data.sentence.arabic) {
            const fresh: DailySentence = data.sentence;
            setDailySentence(fresh);
            try {
              localStorage.setItem('fasih_daily_sentence', JSON.stringify(fresh));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('Failed to sync daily sentence:', err);
      }
    };

    syncDailySentence();
  }, []);

  // Fallback sentence if not loaded yet
  const sentence = dailySentence || {
    id: 'default',
    arabic: 'صَبَاحُ الخَيْرِ وَالسَّعَادَةِ! يَلَّا نَبْدَأُ يَوْمَنَا بِطَاقَةٍ إِيجَابِيَّةٍ وَخُطْوَةٍ جَدِيدَةٍ نَحْوَ التَّقَدُّمِ.',
    transliteration: "Sabah al-kheir wes-sa'ada! Yalla nebda' yawmana bi-taqa ijabiyya wa khutwa jadida nahw el-taqaddum.",
    english: 'Good morning and happiness! Let us start our day with positive energy and a new step toward progress.',
    slotDate: 'today',
    slotIndex: 0,
  };

  return (
    <Panel padding="lg" className="flex flex-col gap-4">
      {/* Daily Arabic Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Badge variant="ochre" className="flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-[var(--accent-ochre)]" />
            <span>Daily Arabic</span>
          </Badge>
          <span className="text-[12px] leading-[18px] text-[var(--ink-secondary)] font-normal">
            Inspiration of the Day
          </span>
        </div>

        {/* Audio Action Button: Listen */}
        <AudioPronounceButton
          arabicText={sentence.arabic}
          size="sm"
          label="Listen"
          title="Listen to pronunciation"
          className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] text-[var(--ink-primary)] font-semibold rounded-[8px]"
        />
      </div>

      {/* Large Arabic Text Display */}
      <div className="w-full py-1">
        <ArabicText
          size="2xl"
          color="primary"
          weight="normal"
          className="block w-full text-right leading-[170%] text-[26px] sm:text-[28px]"
        >
          {sentence.arabic}
        </ArabicText>
      </div>

      {/* Transliteration & English Translation */}
      <div className="flex flex-col gap-1 border-t border-[var(--border-subtle)] pt-3">
        {sentence.transliteration && (
          <p className="text-[12px] leading-[18px] text-[var(--ink-secondary)] font-mono">
            {sentence.transliteration}
          </p>
        )}
        <p className="text-[14px] leading-[21px] text-[var(--ink-primary)] font-normal">
          "{sentence.english}"
        </p>
      </div>
    </Panel>
  );
};
