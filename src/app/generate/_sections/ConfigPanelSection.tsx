'use client';

import React from 'react';
import {
  Sparkles,
  PenTool,
  Check,
  AlertCircle,
  Sun,
  Coffee,
  Plane,
  Briefcase,
  Laptop,
  Smile
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Button } from '@/components/ui/Button';
import { ArabicText } from '@/components/ui/ArabicText';
import type { WordGeneratorState } from '../_hooks/useWordGenerator';
import { OptionSelector } from '../_components/OptionSelector';
import { WordTypeToggle } from '../_components/WordTypeToggle';

export type GenerateMode = 'curated' | 'custom';

export const THEMES: { id: string; title: string; subtitle: string; arabic: string; icon: LucideIcon }[] = [
  { id: 'daily life', title: 'Daily Life & Home', subtitle: 'Routines, breakfast & family', arabic: 'الحَيَاة اليَوْمِيَّة', icon: Sun },
  { id: 'food', title: 'Food & Dining', subtitle: 'Ordering dishes & cafes', arabic: 'الطَّعَام وَالمَطَاعِم', icon: Coffee },
  { id: 'travel', title: 'Travel & City', subtitle: 'Directions, taxis & airports', arabic: 'السَّفَر وَالمَدِينَة', icon: Plane },
  { id: 'work', title: 'Work & Study', subtitle: 'Office, emails & classes', arabic: 'العَمَل وَالدِّرَاسَة', icon: Briefcase },
  { id: 'technology', title: 'Tech & Digital', subtitle: 'Apps, devices & internet', arabic: 'التِّكْنُولُوجِيَا', icon: Laptop },
  { id: 'emotions', title: 'Feelings & Social', subtitle: 'Moods, small talk & greetings', arabic: 'المَشَاعِر وَالحِوَار', icon: Smile },
];

interface ConfigPanelSectionProps {
  gen: WordGeneratorState;
  activeMode: GenerateMode;
}

export const ConfigPanelSection: React.FC<ConfigPanelSectionProps> = ({ gen, activeMode }) => {
  const selectedTheme = THEMES.find((t) => t.id === gen.topic) || THEMES[0];
  const otherThemes = THEMES.filter((t) => t.id !== selectedTheme.id);

  return (
    <form onSubmit={gen.generate} className="flex flex-col gap-4">
      <Panel padding="lg" className="flex flex-col gap-6 bg-[var(--bg-surface)]">
        {/* Section Heading */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex flex-col">
            <h2 className="text-[16px] leading-[24px] font-semibold text-[var(--ink-primary)]">
              Set parameters
            </h2>
            <span className="text-[12px] leading-[18px] text-[var(--ink-secondary)]">
              Customize your batch
            </span>
          </div>
          <span className="text-[11px] font-mono text-[var(--ink-muted)]">
            Powered by Gemini
          </span>
        </div>

        {/* 1. Theme Selection / Custom Prompt */}
        {activeMode === 'curated' ? (
          <div className="flex flex-col gap-3">
            <span className="text-[12px] leading-[18px] font-semibold text-[var(--ink-primary)]">
              Theme
            </span>

            {/* Selected Theme Card (Figma style) */}
            <div className="h-[56px] px-4 rounded-[8px] bg-[var(--bg-accent-tint)] border border-[var(--border-accent)] flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[var(--accent-ochre)]/10 flex items-center justify-center shrink-0 text-[var(--accent-ochre)]">
                  <selectedTheme.icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col truncate">
                  <span className="text-[13px] font-semibold text-[var(--ink-primary)] leading-[18px] truncate">
                    {selectedTheme.title}
                  </span>
                  <span className="text-[11px] leading-[15px] text-[var(--ink-secondary)] truncate">
                    {selectedTheme.subtitle}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <ArabicText as="span" size="sm" color="accent" weight="medium" className="text-[17px] leading-none">
                  {selectedTheme.arabic}
                </ArabicText>
                <div className="w-5 h-5 rounded-full bg-[var(--accent-ochre)] text-white flex items-center justify-center">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* Other Themes Horizontal Chips */}
            <div className="flex flex-wrap gap-2 pt-1">
              {otherThemes.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => gen.setTopic(theme.id)}
                  className="px-3 py-2 rounded-[8px] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/40 text-[12px] leading-[18px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer flex items-center gap-2"
                >
                  <theme.icon className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                  <span>{theme.title}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <span className="text-[12px] leading-[18px] font-semibold text-[var(--ink-primary)] flex items-center gap-2">
              <PenTool className="w-3.5 h-3.5 text-[var(--accent-ochre)]" />
              <span>Custom Topic Scenario</span>
            </span>
            <div className="p-3.5 rounded-[8px] bg-[var(--bg-accent-tint)] border border-[var(--border-accent)] flex flex-col gap-2">
              <textarea
                value={gen.customTopic}
                onChange={(e) => gen.setCustomTopic(e.target.value)}
                placeholder="e.g. Traditional Arabic market, ordering coffee at a cafe, discussing hobbies..."
                rows={3}
                required
                className="w-full resize-none rounded-[8px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] transition"
              />
              <span className="text-[11px] text-[var(--ink-secondary)]">
                Describe any situation or specific topic you want to learn vocabulary for.
              </span>
            </div>
          </div>
        )}

        {/* 2. Set Size and Level (2 Columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-1">
          {/* Word Count */}
          <div className="flex flex-col gap-2">
            <span className="text-[12px] leading-[18px] font-semibold text-[var(--ink-primary)]">
              Word count
            </span>
            <OptionSelector
              label="Word count"
              columns={3}
              items={[
                { id: 5, label: '5' },
                { id: 10, label: '10' },
                { id: 15, label: '15' },
              ]}
              value={gen.count}
              onChange={(id) => gen.setCount(Number(id))}
            />
          </div>

          {/* Difficulty */}
          <div className="flex flex-col gap-2">
            <span className="text-[12px] leading-[18px] font-semibold text-[var(--ink-primary)]">
              Difficulty
            </span>
            <OptionSelector
              label="Difficulty level"
              columns={3}
              items={[
                { id: 'beginner', label: 'Beginner' },
                { id: 'intermediate', label: 'Inter.' },
                { id: 'advanced', label: 'Advanced' },
              ]}
              value={gen.difficulty}
              onChange={(id) => gen.setDifficulty(id as 'beginner' | 'intermediate' | 'advanced')}
            />
          </div>
        </div>

        {/* 3. Word Types */}
        <div className="flex flex-col gap-2.5 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-[16px] leading-[24px] font-semibold text-[var(--ink-primary)]">
              Word types
            </span>
            <span className="text-[12px] leading-[18px] text-[var(--ink-secondary)]">
              Select category
            </span>
          </div>
          <WordTypeToggle value={gen.wordType} onChange={(id) => gen.setWordType(id)} />
        </div>

        {/* 4. Additional Instructions (Context Input) */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center gap-2">
            <span className="text-[12px] leading-[18px] font-semibold text-[var(--ink-primary)]">
              Additional instructions
            </span>
            <span className="text-[11px] text-[var(--ink-muted)]">
              (Optional)
            </span>
          </div>
          <textarea
            value={gen.includeRevision ? 'Focus on practical vocabulary with diacritics' : ''}
            readOnly
            placeholder="e.g. Focus on polite phrases, restaurant dialogue, common questions..."
            rows={2}
            className="w-full resize-none rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] p-3 text-[12px] text-[var(--ink-secondary)] placeholder:text-[var(--ink-muted)] focus:outline-none"
          />
        </div>

        {/* 5. Review Tricky Words Checkbox */}
        <label
          htmlFor="includeRevision"
          className="flex items-start gap-3 p-3 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-ochre)]/40 transition select-none"
        >
          <input
            type="checkbox"
            id="includeRevision"
            checked={gen.includeRevision}
            onChange={(e) => gen.setIncludeRevision(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded accent-[var(--accent-ochre)] cursor-pointer shrink-0"
          />
          <span className="text-[12px] leading-[18px]">
            <span className="font-semibold text-[var(--ink-primary)] block">Weave In Tricky Words</span>
            <span className="text-[11px] text-[var(--ink-secondary)]">
              Includes previously struggled words from your review queue into example sentences.
            </span>
          </span>
        </label>

        {/* Error message */}
        {gen.error && (
          <div className="p-3 rounded-[8px] bg-red-500/10 border border-red-500/30 text-[var(--accent-terracotta)] text-[12px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{gen.error}</span>
          </div>
        )}

        <div className="h-[1px] bg-[var(--border-subtle)]" />

        {/* 6. Generate Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <span className="text-[12px] leading-[18px] text-[var(--ink-secondary)]">
            Estimated generation: ~5-10s
          </span>

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={gen.isLoading}
            leftIcon={<Sparkles className="w-4 h-4" />}
            className="w-full sm:w-auto"
          >
            {gen.isLoading ? 'Generating Set...' : `Generate ${gen.count} Words`}
          </Button>
        </div>
      </Panel>
    </form>
  );
};
