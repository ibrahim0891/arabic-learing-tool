'use client';

import { useState, useEffect } from 'react';

/* ============================================================
   Route-private state layer for the /generate workspace.
   Preserves 100% of the legacy WordGeneratorView behaviour:
   word-sets generate/save API contract, draft auto-save,
   selection model & stats refresh callbacks.
   ============================================================ */

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface WordItem {
  arabic: string;
  english: string;
  transliteration?: string;
  wordType: string;
  root?: string;
  presentTenseI?: string;
  presentTenseHe?: string;
  pluralArabic?: string;
  pluralEnglish?: string;
  oppositeArabic?: string;
  oppositeEnglish?: string;
  exampleArabic?: string;
  exampleTransliteration?: string;
  exampleEnglish?: string;
  explanation?: string;
}

export interface WordSetResult {
  title: string;
  themeContext: string;
  words: WordItem[];
  autoSavedToDraftCount?: number;
}

export interface WordGeneratorOptions {
  onSavedSuccess: (savedCount: number) => void;
}

/**
 * Full state + behaviour for the "Learn New Words" workspace.
 * Mehod selection lives in the caller: `topic` holds the curated
 * theme id, or `'custom'` when the custom-prompt mode is active.
 */
export function useWordGenerator({ onSavedSuccess }: WordGeneratorOptions) {
  // --- Configuration state ---
  const [count, setCount] = useState<number>(10);
  const [topic, setTopic] = useState<string>('daily life');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<Difficulty>('beginner');
  const [wordType, setWordType] = useState<string>('mixed');
  const [includeRevision, setIncludeRevision] = useState<boolean>(true);

  // --- Request lifecycle state ---
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [autoDraftMsg, setAutoDraftMsg] = useState<string | null>(null);

  // --- Drafts integration state ---
  const [draftsVersion, setDraftsVersion] = useState<number>(0);
  const [draftCount, setDraftCount] = useState<number>(0);

  // --- Generated result state ---
  const [generatedResult, setGeneratedResult] = useState<WordSetResult | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  // Keep the drafts badge count in sync
  useEffect(() => {
    async function loadDraftCount() {
      try {
        const res = await fetch('/api/drafts');
        if (res.ok) {
          const data = await res.json();
          setDraftCount(data.count || 0);
        }
      } catch (_) {
        /* non-critical */
      }
    }
    loadDraftCount();
  }, [draftsVersion]);

  const effectiveTopic =
    topic === 'custom' ? customTopic.trim() || 'Everyday Conversation' : topic;

  const generate = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setIsLoading(true);
    setError(null);
    setSaveSuccessMsg(null);
    setGeneratedResult(null);

    try {
      const res = await fetch('/api/word-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          count,
          topic: effectiveTopic,
          difficulty,
          wordType,
          includeRevision,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate vocabulary set');
      }

      const data: WordSetResult = await res.json();
      setGeneratedResult(data);
      setSelectedIndices(new Set(data.words.map((_: WordItem, idx: number) => idx)));

      // Bump draft version and surface auto-save confirmation
      setDraftsVersion((v) => v + 1);
      setAutoDraftMsg(
        data.autoSavedToDraftCount != null && data.autoSavedToDraftCount > 0
          ? `${data.autoSavedToDraftCount} unique words automatically saved to your Drafts collection!`
          : null,
      );
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error communicating with AI tutor');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleWordSelection = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (!generatedResult || !generatedResult.words.length) return;
    if (selectedIndices.size === generatedResult.words.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(generatedResult.words.map((_, i) => i)));
    }
  };

  const saveToLibrary = async () => {
    if (!generatedResult || !generatedResult.words.length) return;
    const wordsToSave = generatedResult.words.filter((_, idx) => selectedIndices.has(idx));
    if (wordsToSave.length === 0) {
      setError('Please select at least one word to save to your Word Bank.');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch('/api/word-sets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          title: generatedResult.title,
          themeContext: generatedResult.themeContext,
          topic: effectiveTopic,
          difficulty,
          words: wordsToSave,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save words');
      }

      const data = await res.json();
      setSaveSuccessMsg(
        data.message || `${wordsToSave.length} words successfully added to your Word Bank!`,
      );
      onSavedSuccess(data.savedCount);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Error saving words');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    // configuration
    count,
    setCount,
    topic,
    setTopic,
    customTopic,
    setCustomTopic,
    difficulty,
    setDifficulty,
    wordType,
    setWordType,
    includeRevision,
    setIncludeRevision,
    effectiveTopic,
    // lifecycle
    isLoading,
    isSaving,
    error,
    setError,
    saveSuccessMsg,
    autoDraftMsg,
    // drafts
    draftCount,
    draftsVersion,
    setDraftsVersion,
    // result & selection
    generatedResult,
    selectedIndices,
    // actions
    generate,
    toggleWordSelection,
    toggleSelectAll,
    saveToLibrary,
  };
}

export type WordGeneratorState = ReturnType<typeof useWordGenerator>;
