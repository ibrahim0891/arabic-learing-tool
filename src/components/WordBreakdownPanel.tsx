'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2, Sparkles } from 'lucide-react';
import { WordBreakdownItem } from '@/lib/types';

export interface WordBreakdownPanelProps {
  /** Arabic sentence to break into words. */
  arabic: string;
  /** Known full English translation, passed to the AI as context. */
  english?: string;
  /** Optional language-register hint for the AI. */
  register?: string;
  /** Word id used to read/write the cached breakdown in Supabase/SQLite. */
  wordId?: string;
  /** Additional-example id when the sentence is not the word's primary example. */
  exampleId?: string;
  /** Breakdown already cached on the word/example (avoids even the first request). */
  initialBreakdown?: WordBreakdownItem[];
  className?: string;
}

interface BreakdownResult {
  arabic: string;
  words: WordBreakdownItem[];
}

interface BreakdownError {
  arabic: string;
  message: string;
}

/**
 * On-demand AI word-by-word breakdown for an Arabic sentence.
 * Collapsed by default; nothing is fetched until the learner asks for it.
 *
 * Results are tagged with the sentence they belong to, so navigating to another
 * word naturally discards stale state without a reset effect.
 */
export function WordBreakdownPanel({
  arabic,
  english,
  register,
  wordId,
  exampleId,
  initialBreakdown,
  className = '',
}: WordBreakdownPanelProps) {
  const [result, setResult] = useState<BreakdownResult | null>(null);
  const [openFor, setOpenFor] = useState<string | null>(null);
  const [loadingFor, setLoadingFor] = useState<string | null>(null);
  const [error, setError] = useState<BreakdownError | null>(null);

  const generatedWords = result?.arabic === arabic ? result.words : [];
  const words = generatedWords.length > 0 ? generatedWords : initialBreakdown || [];
  const isOpen = openFor === arabic && words.length > 0;
  const isLoading = loadingFor === arabic;
  const currentError = error?.arabic === arabic ? error.message : null;

  const loadBreakdown = async () => {
    setLoadingFor(arabic);
    setError(null);

    try {
      const endpoint = wordId ? `/api/words/${wordId}/breakdown` : '/api/breakdown';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ arabic, english, register, exampleId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate word breakdown');
      }

      const data = await res.json();
      setResult({
        arabic,
        words: Array.isArray(data.breakdown) ? data.breakdown : [],
      });
      setOpenFor(arabic);
    } catch (err) {
      console.error('Word breakdown error:', err);
      setError({
        arabic,
        message: err instanceof Error ? err.message : 'Error generating word breakdown',
      });
    } finally {
      setLoadingFor(null);
    }
  };

  const handleToggle = () => {
    if (isOpen) {
      setOpenFor(null);
      return;
    }
    if (words.length > 0) {
      setOpenFor(arabic);
      return;
    }
    loadBreakdown();
  };

  if (!arabic?.trim()) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={isLoading}
        aria-expanded={isOpen}
        className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-dashed border-[var(--border-subtle)] text-[10px] font-semibold text-[var(--ink-secondary)] hover:text-[var(--accent-ochre)] hover:border-[var(--accent-ochre)]/50 hover:bg-[var(--accent-ochre-dim)]/40 transition cursor-pointer disabled:opacity-60 disabled:cursor-wait"
        title="Break this sentence down word by word with AI"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-3 h-3 animate-spin" />
            <span>Breaking down words...</span>
          </>
        ) : isOpen ? (
          <>
            <ChevronUp className="w-3 h-3" />
            <span>Hide word-by-word breakdown</span>
          </>
        ) : (
          <>
            <Sparkles className="w-3 h-3" />
            <span>
              Word-by-word breakdown
              {words.length > 0 ? ` (${words.length})` : ''}
            </span>
            <ChevronDown className="w-3 h-3" />
          </>
        )}
      </button>

      {currentError && !isLoading && (
        <div className="flex items-center gap-1.5 text-[10px] text-[var(--accent-terracotta)]">
          <AlertTriangle className="w-3 h-3 shrink-0" />
          <span>{currentError}</span>
          <button
            type="button"
            onClick={loadBreakdown}
            className="underline hover:opacity-80 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {isOpen && (
        <div className="rounded-xl border border-[var(--border-subtle)] overflow-hidden bg-[var(--bg-surface)] animate-fadeIn">
          <div className="divide-y divide-[var(--border-subtle)]/70">
            {words.map((w, idx) => (
              <div key={`${w.arabic}_${idx}`} className="flex items-center gap-2.5 px-2.5 py-1.5">
                <span
                  dir="rtl"
                  className="font-arabic text-base sm:text-lg font-semibold text-[var(--ink-primary)] shrink-0 leading-snug"
                >
                  {w.arabic}
                </span>
                <div className="flex-1 min-w-0 text-left">
                  {w.transliteration && (
                    <span className="font-mono text-[11px] text-[var(--accent-ochre)] leading-tight">
                      {w.transliteration}
                    </span>
                  )}
                  <span className="block text-[11px] text-[var(--ink-secondary)] leading-tight">
                    {w.english}
                    {w.note ? (
                      <span className="text-[var(--ink-muted)] font-mono"> · {w.note}</span>
                    ) : null}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
