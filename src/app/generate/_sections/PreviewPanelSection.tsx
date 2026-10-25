'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Volume2,
  Languages,
  Quote,
  Info,
  Check,
  BookmarkPlus,
  Loader2,
  SlidersHorizontal,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { ArabicText } from '@/components/ui/ArabicText';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';
import type { WordGeneratorState } from '../_hooks/useWordGenerator';
import { GeneratedWordCard } from '../_components/GeneratedWordCard';

interface PreviewPanelSectionProps {
  gen: WordGeneratorState;
  onNavigateToStudy: () => void;
  onOpenMobileConfig?: () => void;
}

export const PreviewPanelSection: React.FC<PreviewPanelSectionProps> = ({
  gen,
  onNavigateToStudy,
  onOpenMobileConfig,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
        <div className="flex flex-col gap-3 pb-24 sm:pb-0">
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

        {/* Sticky Mobile Save Bar — rendered via Portal directly to <body> so it is NEVER trapped by ancestor transforms or animations */}
        {mounted && typeof document !== 'undefined' && createPortal(
          <div className="sm:hidden fixed bottom-4 left-3 right-3 z-50 max-w-lg mx-auto pointer-events-auto">
            <div className="p-3 rounded-[14px] bg-[var(--bg-surface)]/95 backdrop-blur-md border border-[var(--border-accent)] shadow-2xl flex items-center justify-between gap-2.5">
              {onOpenMobileConfig && (
                <button
                  type="button"
                  onClick={onOpenMobileConfig}
                  title="Configure new batch"
                  className="flex items-center gap-1.5 px-2.5 py-2 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[11px] font-semibold text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] active:scale-95 transition shrink-0 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[var(--accent-ochre)]" />
                  <span>Topic</span>
                </button>
              )}

              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-[12px] font-bold text-[var(--ink-primary)] truncate">
                  {gen.saveSuccessMsg ? 'Saved to Library!' : `${gen.selectedIndices.size} of ${words.length} selected`}
                </span>
                <span className="text-[10px] text-[var(--ink-secondary)] truncate">
                  {gen.saveSuccessMsg ? 'Ready to review in flashcards' : 'Tap button to save words'}
                </span>
              </div>

              {gen.saveSuccessMsg ? (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={onNavigateToStudy}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  className="shrink-0 font-bold px-3 py-2 text-[12px]"
                >
                  Study →
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={gen.saveToLibrary}
                  disabled={gen.selectedIndices.size === 0}
                  isLoading={gen.isSaving}
                  leftIcon={<BookmarkPlus className="w-3.5 h-3.5" />}
                  className="shrink-0 font-bold px-3.5 py-2 text-[12px] shadow-xs"
                >
                  Save ({gen.selectedIndices.size})
                </Button>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    );
  }

  /* ------------------------------ Default Preview State: Live Interactive Sample Card ------------------------------ */
  return (
    <div className="hidden lg:flex flex-col gap-4 animate-fadeIn">
      <Panel padding="lg" className="flex flex-col gap-4 bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)] shadow-2xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[14px] leading-tight font-semibold text-[var(--ink-primary)]">
                Live Vocabulary Preview
              </h3>
              <p className="text-[11px] text-[var(--ink-secondary)]">Sample output generated by Gemini AI</p>
            </div>
          </div>
          <Badge variant="ochre" className="!text-[10px] uppercase font-bold tracking-wider">
            Interactive Sample
          </Badge>
        </div>

        {/* The Interactive Sample Card */}
        <div className="p-5 rounded-[12px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/50 transition-all flex flex-col gap-3.5 shadow-2xs">
          {/* Card Meta Row */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-2">
              <Badge variant="ochre" className="uppercase text-[10px] font-bold tracking-wider">
                Noun • اِسْم
              </Badge>
              <span className="text-[11px] font-mono text-[var(--ink-secondary)] px-2 py-0.5 rounded-[4px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center gap-1">
                <span className="text-[10px] text-[var(--ink-muted)]">Root:</span>
                <strong className="font-arabic text-[13px] text-[var(--accent-ochre)] font-bold">ق ب ل</strong>
              </span>
            </div>

            <AudioPronounceButton
              arabicText="مُسْتَقْبَلٌ"
              size="sm"
              label="Listen"
              className="border border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:bg-[var(--bg-canvas)] text-[var(--ink-primary)]"
            />
          </div>

          {/* Word Showcase Row */}
          <div className="flex items-baseline justify-between py-1">
            <div className="flex flex-col">
              <h4 className="text-[20px] font-bold text-[var(--ink-primary)] tracking-tight">
                future / prospective
              </h4>
              <span className="text-[12px] font-mono text-[var(--ink-secondary)]">
                mustaqbal • /mus.taq.bal/
              </span>
            </div>

            <ArabicText
              size="xl"
              weight="bold"
              color="accent"
              className="font-arabic text-3xl sm:text-4xl text-[var(--accent-ochre)] select-text"
            >
              مُسْتَقْبَلٌ
            </ArabicText>
          </div>

          {/* Context Example Sentence with Audio */}
          <div className="p-3.5 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col gap-1.5 text-right">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--accent-ochre)]">
                Context Example • مِثَال
              </span>
              <AudioPronounceButton
                arabicText="الْعَمَلُ الْجَادُّ يُؤَسِّسُ لِمُسْتَقْبَلٍ مُشْرِقٍ."
                size="sm"
                title="Listen to example sentence"
              />
            </div>
            <p dir="rtl" className="font-arabic text-[17px] leading-[28px] text-[var(--ink-primary)]">
              الْعَمَلُ الْجَادُّ يُؤَسِّسُ لِمُسْتَقْبَلٍ مُشْرِقٍ.
            </p>
            <p dir="ltr" className="text-left text-[11px] leading-[16px] text-[var(--ink-secondary)] italic">
              "Hard work lays the foundation for a bright future."
            </p>
          </div>

          {/* Quality Features Strip */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] text-[var(--ink-secondary)]">
            <div className="flex items-center gap-1.5 p-2 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <Languages className="w-3.5 h-3.5 text-[var(--accent-ochre)] shrink-0" />
              <span className="font-medium text-[10px] truncate">Full Harakat</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <Volume2 className="w-3.5 h-3.5 text-[var(--accent-ochre)] shrink-0" />
              <span className="font-medium text-[10px] truncate">Native TTS</span>
            </div>
            <div className="flex items-center gap-1.5 p-2 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
              <Quote className="w-3.5 h-3.5 text-[var(--accent-ochre)] shrink-0" />
              <span className="font-medium text-[10px] truncate">Real Context</span>
            </div>
          </div>
        </div>
      </Panel>

      {/* Generation Note */}
      <div className="flex items-center gap-2 px-1 text-[11px] leading-[16px] text-[var(--ink-secondary)]">
        <Info className="w-4 h-4 text-[var(--ink-muted)] shrink-0" />
        <span>
          Generated words are instantly saved into your Spaced Repetition (SRS) schedule for daily reviews.
        </span>
      </div>
    </div>
  );
};
