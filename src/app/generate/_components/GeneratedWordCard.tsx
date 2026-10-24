'use client';

import React from 'react';
import { Info } from 'lucide-react';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';
import { Panel } from '@/components/ui/Panel';
import { Badge } from '@/components/ui/Badge';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { ArabicText } from '@/components/ui/ArabicText';
import type { WordItem } from '../_hooks/useWordGenerator';

interface GeneratedWordCardProps {
  word: WordItem;
  index: number;
  selected: boolean;
  onToggle: () => void;
}

function LinguisticForm({
  label,
  arabic,
  english,
  tone,
}: {
  label: string;
  arabic?: string;
  english?: string;
  tone: 'ochre' | 'cypress';
}) {
  const labelColor =
    tone === 'ochre' ? 'text-[var(--accent-ochre)]' : 'text-[var(--accent-cypress)]';
  return (
    <div className="flex-1 min-w-[120px] rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-2 space-y-0.5">
      <Text variant="caption" color="muted" weight="bold" as="span" className={`uppercase tracking-wider ${labelColor}`}>
        {label}
      </Text>
      {arabic && (
        <ArabicText as="p" size="sm" align="right" color="accent" weight="bold" className="!text-[14px] !leading-[23px]">
          {arabic}
        </ArabicText>
      )}
      {english && (
        <Text variant="caption" color="muted" as="span" className="block">
          {english}
        </Text>
      )}
    </div>
  );
}

/**
 * A single generated vocabulary entry with selection + full linguistic data.
 */
export const GeneratedWordCard: React.FC<GeneratedWordCardProps> = ({
  word,
  index,
  selected,
  onToggle,
}) => {
  return (
    <Panel
      padding="md"
      role="checkbox"
      aria-checked={selected}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onToggle();
        }
      }}
      className={`!p-5 cursor-pointer select-none !rounded-[12px] !border-[var(--border-subtle)] ${
        selected
          ? '!bg-[var(--bg-surface)] !border-[var(--accent-ochre)] ring-1 ring-[var(--accent-ochre)]/40'
          : 'opacity-60 hover:opacity-90'
      }`}
    >
      <div className="space-y-3">
        {/* Top badges & selection toggle */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Badge variant="neutral">{word.wordType}</Badge>
            {word.root && (
              <Badge variant="ochre">
                Root:
                <ArabicText as="span" size="sm" align="right" weight="bold" className="!text-[12px] !leading-none">
                  {word.root}
                </ArabicText>
              </Badge>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              className="h-4 w-4 rounded accent-[var(--accent-ochre)] cursor-pointer"
              aria-label={`Select word ${word.arabic}`}
            />
          </div>
        </div>

        {/* Arabic word, transliteration & audio */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <ArabicText as="p" size="xl" align="right" color="accent" weight="bold">
              {word.arabic}
            </ArabicText>
            {word.transliteration && (
              <Text variant="meta" color="secondary" as="p" className="font-mono mt-1">
                ({word.transliteration})
              </Text>
            )}
          </div>
          <div onClick={(e) => e.stopPropagation()} className="shrink-0 mt-1">
            <AudioPronounceButton arabicText={word.arabic} size="md" />
          </div>
        </div>

        {/* English meaning */}
        <Heading level={4}>{word.english}</Heading>

        {/* Verb conjugations */}
        {word.presentTenseI && (
          <div className="rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-primary)] px-3 py-2">
            <ArabicText as="p" size="sm" align="right" color="accent" weight="semibold" className="!text-[14px] !leading-[23px]">
              أَنَا {word.presentTenseI} • هُوَ {word.presentTenseHe || '-'}
            </ArabicText>
          </div>
        )}

        {/* Plural & opposite linguistic forms */}
        {(word.pluralArabic || word.oppositeArabic) && (
          <div className="flex flex-wrap gap-2">
            {word.pluralArabic && (
              <LinguisticForm
                label="Plural • الجَمْع"
                arabic={word.pluralArabic}
                english={word.pluralEnglish}
                tone="cypress"
              />
            )}
            {word.oppositeArabic && (
              <LinguisticForm
                label="Opposite • الضِّدّ"
                arabic={word.oppositeArabic}
                english={word.oppositeEnglish}
                tone="ochre"
              />
            )}
          </div>
        )}

        {/* Context sentence box — accent border per design system */}
        {word.exampleArabic && (
          <div className="rounded-[8px] border border-[var(--border-accent)] bg-[var(--bg-primary)] p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <ArabicText as="p" size="sm" align="right" color="primary" weight="medium" className="flex-1">
                {word.exampleArabic}
              </ArabicText>
              <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                <AudioPronounceButton arabicText={word.exampleArabic} size="sm" />
              </div>
            </div>
            {word.exampleTransliteration && (
              <Text variant="caption" color="muted" as="p" className="font-mono">
                {word.exampleTransliteration}
              </Text>
            )}
            {word.exampleEnglish && (
              <Text variant="secondary" color="secondary" as="p">
                “{word.exampleEnglish}”
              </Text>
            )}
          </div>
        )}

        {/* Usage explanation */}
        {word.explanation && (
          <div className="flex items-start gap-1.5 pt-0.5">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--accent-ochre)]" />
            <Text variant="meta" color="muted" as="span">
              {word.explanation}
            </Text>
          </div>
        )}
      </div>

      {/* Bottom selection status bar */}
      <div className="mt-3 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between">
        <Text
          variant="meta"
          color={selected ? 'accent' : 'muted'}
          weight={selected ? 'bold' : 'normal'}
          as="span"
        >
          {selected ? '✓ Will be added to Word Bank' : 'Excluded from saving'}
        </Text>
        <Text variant="caption" color="muted" as="span" className="font-mono">
          #{index + 1}
        </Text>
      </div>
    </Panel>
  );
};
