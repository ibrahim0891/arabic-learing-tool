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
  onGenerated?: () => void;
  /** When true: renders flat (no outer Panel card, no submit button) — used inside mobile bottom-sheet */
  isEmbedded?: boolean;
}

export const ConfigPanelSection: React.FC<ConfigPanelSectionProps> = ({
  gen,
  activeMode,
  onGenerated,
  isEmbedded = false,
}) => {
  const selectedTheme = THEMES.find((t) => t.id === gen.topic) || THEMES[0];
  const otherThemes = THEMES.filter((t) => t.id !== selectedTheme.id);

  const handleSubmit = (e: React.FormEvent) => {
    gen.generate(e);
    if (onGenerated) onGenerated();
  };

  /* ─────────────────────────────────────────────────────────────────────
     FORM BODY — shared between desktop Panel and mobile bottom-sheet
  ───────────────────────────────────────────────────────────────────── */
  const formBody = (
    <div className="flex flex-col gap-5">

      {/* ── 1. Theme / Custom Prompt ─────────────────────────── */}
      {activeMode === 'curated' ? (
        <div className="flex flex-col gap-3">
          {/* Label row */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Theme</span>
            <ArabicText as="span" size="sm" color="accent" weight="medium" className="text-[13px]">
              {selectedTheme.arabic}
            </ArabicText>
          </div>

          {/* Selected theme banner */}
          <div className="flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] bg-[var(--bg-accent-tint)] border border-[var(--border-accent)] shadow-2xs">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-ochre)]/15 flex items-center justify-center shrink-0 text-[var(--accent-ochre)]">
              <selectedTheme.icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[var(--ink-primary)] leading-[18px] truncate">{selectedTheme.title}</div>
              <div className="text-[11px] text-[var(--ink-secondary)] truncate">{selectedTheme.subtitle}</div>
            </div>
            <div className="w-5 h-5 rounded-full bg-[var(--accent-ochre)] text-white flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 stroke-[2.5]" />
            </div>
          </div>

          {/* Other themes — 3-column grid for mobile & desktop, never wraps messily */}
          <div className="grid grid-cols-3 gap-2">
            {otherThemes.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => gen.setTopic(theme.id)}
                className="flex flex-col items-center gap-1 px-2 py-2.5 rounded-[8px] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/50 text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition cursor-pointer select-none"
              >
                <theme.icon className="w-3.5 h-3.5 text-[var(--ink-muted)]" />
                <span className="text-[11px] font-medium leading-tight text-center line-clamp-1">{theme.title}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Custom Prompt mode */
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-[var(--ink-primary)] flex items-center gap-1.5">
            <PenTool className="w-3.5 h-3.5 text-[var(--accent-ochre)]" />
            Custom Topic Scenario
          </span>
          <div className="p-3.5 rounded-[10px] bg-[var(--bg-accent-tint)] border border-[var(--border-accent)] flex flex-col gap-2">
            <textarea
              value={gen.customTopic}
              onChange={(e) => gen.setCustomTopic(e.target.value)}
              placeholder="e.g. Traditional Arabic market, ordering coffee at a cafe, discussing hobbies..."
              rows={3}
              required
              className="w-full resize-none rounded-[8px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] p-3 text-[13px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] transition"
            />
            <span className="text-[11px] text-[var(--ink-secondary)]">
              Describe any situation or topic you want vocabulary for.
            </span>
          </div>
        </div>
      )}

      {/* ── 2. Word Count & Difficulty — always 2-col even on small phones ── */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Word count</span>
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

        <div className="flex flex-col gap-2">
          <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Difficulty</span>
          <OptionSelector
            label="Difficulty level"
            columns={3}
            items={[
              { id: 'beginner', label: 'Easy' },
              { id: 'intermediate', label: 'Mid' },
              { id: 'advanced', label: 'Hard' },
            ]}
            value={gen.difficulty}
            onChange={(id) => gen.setDifficulty(id as 'beginner' | 'intermediate' | 'advanced')}
          />
        </div>
      </div>

      {/* ── 3. Word Types ─────────────────────────────────────── */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Word types</span>
          <span className="text-[11px] text-[var(--ink-secondary)]">Select one</span>
        </div>
        <WordTypeToggle value={gen.wordType} onChange={(id) => gen.setWordType(id)} />
      </div>

      {/* ── 4. Weave In Tricky Words ─────────────────────────── */}
      <label
        htmlFor={isEmbedded ? 'includeRevision-mobile' : 'includeRevision'}
        className={`flex items-start gap-3 p-3 rounded-[10px] border cursor-pointer select-none transition ${
          gen.includeRevision
            ? 'bg-[var(--bg-accent-tint)] border-[var(--border-accent)]'
            : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/40'
        }`}
      >
        <input
          type="checkbox"
          id={isEmbedded ? 'includeRevision-mobile' : 'includeRevision'}
          checked={gen.includeRevision}
          onChange={(e) => gen.setIncludeRevision(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded accent-[var(--accent-ochre)] cursor-pointer shrink-0"
        />
        <span className="flex flex-col gap-0.5">
          <span className="text-[13px] font-semibold text-[var(--ink-primary)]">Weave In Tricky Words</span>
          <span className="text-[11px] text-[var(--ink-secondary)] leading-[16px]">
            Previously struggled words woven into example sentences.
          </span>
        </span>
      </label>

      {/* ── Error ────────────────────────────────────────────── */}
      {gen.error && (
        <div className="p-3 rounded-[8px] bg-red-500/10 border border-red-500/30 text-[var(--accent-terracotta)] text-[12px] flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{gen.error}</span>
        </div>
      )}

      {/* ── Desktop submit button (hidden when isEmbedded — bottom sheet has its own) ── */}
      {!isEmbedded && (
        <>
          <div className="h-[1px] bg-[var(--border-subtle)]" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-[12px] text-[var(--ink-secondary)]">
              Estimated generation: ~5–10s
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
        </>
      )}
    </div>
  );

  /* ── Mobile embedded (bottom-sheet): flat form, no outer Panel card ── */
  if (isEmbedded) {
    return (
      <form id="mobile-config-form" onSubmit={handleSubmit} className="w-full">
        {formBody}
      </form>
    );
  }

  /* ── Desktop: wrapped in Panel card ─────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Panel padding="lg" className="flex flex-col gap-6 bg-[var(--bg-surface)]">
        {/* Desktop Panel heading */}
        <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
          <div className="flex flex-col">
            <h2 className="text-[16px] leading-[24px] font-semibold text-[var(--ink-primary)]">Set parameters</h2>
            <span className="text-[12px] text-[var(--ink-secondary)]">Customize your batch</span>
          </div>
          <span className="text-[11px] font-mono text-[var(--ink-muted)]">Powered by Gemini</span>
        </div>
        {formBody}
      </Panel>
    </form>
  );
};
