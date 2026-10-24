'use client';

import React from 'react';
import {
  BookOpen,
  Volume2,
  Languages,
  Quote,
  Info,
  Check,
  BookmarkPlus,
  Loader2,
  ListChecks
} from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import type { WordGeneratorState } from '../_hooks/useWordGenerator';
import { GeneratedWordCard } from '../_components/GeneratedWordCard';

interface PreviewPanelSectionProps {
  gen: WordGeneratorState;
  onNavigateToStudy: () => void;
}

export const PreviewPanelSection: React.FC<PreviewPanelSectionProps> = ({
  gen,
  onNavigateToStudy,
}) => {
  /* ------------------------------ Loading Skeleton ------------------------------ */
  if (gen.isLoading) {
    return (
      <Panel padding="lg" className="flex flex-col gap-4 animate-pulse bg-[var(--bg-surface)]">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="h-4 bg-[var(--border-subtle)] rounded w-24" />
          <div className="h-5 bg-[var(--border-subtle)] rounded w-20" />
        </div>

        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <div className="w-12 h-12 rounded-[12px] bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)] ">
            <Loader2 className="w-6 h-6" />
          </div>
          <div className="h-5 bg-[var(--border-subtle)] rounded w-48 mt-2" />
          <div className="h-4 bg-[var(--border-subtle)] rounded w-64" />
        </div>

        <div className="p-3.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center gap-2.5">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-ochre)] shrink-0" />
          <span className="text-[12px] text-[var(--ink-secondary)]">
            Gemini AI is crafting authentic Arabic words with tashkeel & context sentences...
          </span>
        </div>
      </Panel>
    );
  }

  /* ------------------------------ Generated Results ------------------------------ */
  if (gen.generatedResult) {
    const { words, title, themeContext } = gen.generatedResult;
    const allSelected = gen.selectedIndices.size === words.length;

    return (
      <div className="flex flex-col gap-4 animate-fadeIn">
        {/* Storyline & Save Card */}
        <Panel padding="lg" className="flex flex-col gap-3 bg-[var(--bg-surface)] border border-[var(--border-accent)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-col min-w-0">
              <Badge variant="ochre" className="self-start">
                Thematic Batch
              </Badge>
              <h3 className="text-[18px] leading-[26px] font-semibold text-[var(--ink-primary)] mt-1 truncate">
                {title}
              </h3>
              {themeContext && (
                <p className="text-[12px] leading-[18px] text-[var(--ink-secondary)] mt-0.5">
                  {themeContext}
                </p>
              )}
            </div>

            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={gen.saveToLibrary}
              disabled={!!gen.saveSuccessMsg || gen.selectedIndices.size === 0}
              isLoading={gen.isSaving}
              leftIcon={gen.saveSuccessMsg ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
            >
              {gen.saveSuccessMsg
                ? 'Saved!'
                : `Save ${gen.selectedIndices.size} ${gen.selectedIndices.size === 1 ? 'Word' : 'Words'}`}
            </Button>
          </div>

          {gen.saveSuccessMsg && (
            <div className="flex items-center justify-between p-3 rounded-[8px] bg-[var(--accent-cypress-dim)] border border-[var(--accent-cypress)]/30 text-[12px] text-[var(--accent-cypress)] mt-1 animate-fadeIn">
              <span className="font-medium">{gen.saveSuccessMsg}</span>
              <button
                type="button"
                onClick={onNavigateToStudy}
                className="font-bold underline cursor-pointer hover:opacity-80"
              >
                Practice in Flashcards →
              </button>
            </div>
          )}
        </Panel>

        {/* Selection Bar */}
        <div className="flex items-center justify-between px-2 text-[12px] text-[var(--ink-secondary)]">
          <span>
            Selected {gen.selectedIndices.size} of {words.length} words
          </span>

          <button
            type="button"
            onClick={gen.toggleSelectAll}
            className="flex items-center gap-1.5 font-medium text-[var(--accent-ochre)] hover:underline cursor-pointer"
          >
            <span>{allSelected ? 'Deselect all' : 'Select all'}</span>
          </button>
        </div>

        {/* Word Cards List */}
        <div className="flex flex-col gap-3">
          {words.map((w, idx) => (
            <GeneratedWordCard
              key={idx}
              word={w}
              index={idx}
              selected={gen.selectedIndices.has(idx)}
              onToggle={() => gen.toggleWordSelection(idx)}
            />
          ))}
        </div>
      </div>
    );
  }

  /* ------------------------------ Default Preview State (Figma Specs) ------------------------------ */
  return (
    <div className="flex flex-col gap-4 animate-fadeIn">
      <Panel padding="lg" className="flex flex-col gap-5 bg-[var(--bg-surface)]">
        {/* Preview Heading */}
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] leading-[21px] font-semibold text-[var(--ink-primary)]">
            Set overview
          </h3>
          <Badge variant="ochre">Ready to create</Badge>
        </div>

        <div className="h-[1px] bg-[var(--border-subtle)]" />

        {/* Initial Preview State Illustration */}
        <div className="flex flex-col items-center text-center py-6 gap-3">
          <div className="w-[52px] h-[52px] rounded-[12px] bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)] shadow-2xs">
            <BookOpen className="w-6 h-6" />
          </div>

          <h4 className="text-[18px] leading-[27px] font-semibold text-[var(--ink-primary)]">
            AI-Powered Vocabulary
          </h4>

          <p className="text-[13px] leading-[20px] text-[var(--ink-secondary)] max-w-xs">
            Words are generated with accurate tashkeel (harakat), root analysis, English meanings, and example sentences.
          </p>
        </div>

        <div className="h-[1px] bg-[var(--border-subtle)]" />

        {/* Set Contents Checklist */}
        <div className="flex flex-col gap-4">
          <span className="text-[12px] leading-[18px] font-semibold text-[var(--ink-primary)]">
            What's included in every set
          </span>

          <div className="flex flex-col gap-3">
            {/* Feature 1 */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)] shrink-0 mt-0.5">
                <Languages className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] leading-[18px] font-medium text-[var(--ink-primary)]">
                  Vocabulary with Harakat
                </span>
                <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
                  Full Arabic diacritics for proper reading & pronunciation.
                </span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)] shrink-0 mt-0.5">
                <Volume2 className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] leading-[18px] font-medium text-[var(--ink-primary)]">
                  Audio Pronunciation
                </span>
                <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
                  Instant text-to-speech for every word and example sentence.
                </span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)] shrink-0 mt-0.5">
                <Quote className="w-3.5 h-3.5" />
              </div>
              <div className="flex flex-col">
                <span className="text-[13px] leading-[18px] font-medium text-[var(--ink-primary)]">
                  Contextual Sentences
                </span>
                <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
                  Natural example sentences with transliteration & translation.
                </span>
              </div>
            </div>
          </div>
        </div>
      </Panel>

      {/* Generation Note */}
      <div className="flex items-center gap-2 px-1 text-[11px] leading-[16px] text-[var(--ink-secondary)]">
        <Info className="w-4 h-4 text-[var(--ink-muted)] shrink-0" />
        <span>
          Saved words are automatically added to your spaced repetition review schedule.
        </span>
      </div>
    </div>
  );
};
