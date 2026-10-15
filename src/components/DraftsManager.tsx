'use client';

import React, { useState, useEffect } from 'react';
import {
  Inbox,
  CheckSquare,
  Square,
  BookmarkPlus,
  Trash2,
  RefreshCw,
  Check,
  AlertCircle,
  Loader2,
  BookOpen
} from 'lucide-react';
import { DraftWord } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';

interface DraftsManagerProps {
  onSavedToWordBank: (count: number) => void;
  onNavigateToStudy?: () => void;
  draftsVersion?: number; // trigger reload when new words are generated
}

export const DraftsManager: React.FC<DraftsManagerProps> = ({
  onSavedToWordBank,
  onNavigateToStudy,
  draftsVersion = 0,
}) => {
  const [drafts, setDrafts] = useState<DraftWord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPromoting, setIsPromoting] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>('');

  const fetchDrafts = async () => {
    setLoading(true);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/drafts');
      if (res.ok) {
        const data = await res.json();
        setDrafts(data.drafts || []);
      }
    } catch (err) {
      console.error('Failed to load drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrafts();
  }, [draftsVersion]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const visibleDrafts = filteredDrafts;
    if (selectedIds.size === visibleDrafts.length && visibleDrafts.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleDrafts.map(d => d.id)));
    }
  };

  const handlePromoteSelected = async () => {
    if (selectedIds.size === 0) return;
    setIsPromoting(true);
    setFeedbackMsg(null);

    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_to_library',
          draftIds: Array.from(selectedIds),
          setName: `Saved Drafts (${new Date().toLocaleDateString()})`,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save drafts to Word Bank');
      }

      const data = await res.json();
      setFeedbackMsg({
        text: `✓ ${data.message || `${data.savedCount} words saved to your Word Bank!`}`,
        type: 'success',
      });

      // Remove saved drafts from local state
      setDrafts(prev => prev.filter(d => !selectedIds.has(d.id)));
      setSelectedIds(new Set());

      if (onSavedToWordBank) {
        onSavedToWordBank(data.savedCount);
      }
    } catch (err: any) {
      console.error(err);
      setFeedbackMsg({
        text: err.message || 'Error moving words to Word Bank',
        type: 'error',
      });
    } finally {
      setIsPromoting(false);
    }
  };

  const handleDeleteSingle = async (id: string, arabicWord: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Discard "${arabicWord}" from Drafts?`)) return;

    setIsDeleting(id);
    try {
      const res = await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      if (res.ok) {
        setDrafts(prev => prev.filter(d => d.id !== id));
        setSelectedIds(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to delete draft word:', err);
    } finally {
      setIsDeleting(null);
    }
  };

  const handleClearAllDrafts = async () => {
    if (!confirm('Are you sure you want to discard all words currently in Drafts?')) return;
    setLoading(true);
    try {
      await fetch('/api/drafts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_all' }),
      });
      setDrafts([]);
      setSelectedIds(new Set());
      setFeedbackMsg({ text: 'Draft collection cleared.', type: 'success' });
    } catch (err) {
      console.error('Failed to clear drafts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrafts = drafts.filter(d => {
    if (!searchFilter.trim()) return true;
    const q = searchFilter.toLowerCase();
    return (
      d.arabic.toLowerCase().includes(q) ||
      d.english.toLowerCase().includes(q) ||
      (d.transliteration && d.transliteration.toLowerCase().includes(q)) ||
      (d.topic && d.topic.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Top Banner & Action Controls */}
      <div className="p-5 sm:p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]">
                <Inbox className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-[var(--ink-primary)]">
                Draft Words Collection
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]">
                {drafts.length} {drafts.length === 1 ? 'word' : 'words'}
              </span>
            </div>
            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed max-w-xl">
              Every time you generate words with AI, unique words automatically land here in your Drafts database. 
              Select the words you want and click <strong>"Save to Word Bank"</strong> to start practicing them in flashcards.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={fetchDrafts}
              disabled={loading}
              className="p-2.5 rounded-xl border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface-elevated)] transition cursor-pointer"
              title="Refresh Drafts"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {drafts.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllDrafts}
                disabled={loading || isPromoting}
                className="px-3 py-2 text-xs text-[var(--ink-muted)] hover:text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)]/10 rounded-xl transition cursor-pointer"
                title="Discard all drafts"
              >
                Clear All
              </button>
            )}

            <button
              type="button"
              onClick={handlePromoteSelected}
              disabled={isPromoting || selectedIds.size === 0}
              className="btn-ochre py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {isPromoting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <BookmarkPlus className="w-4 h-4" />
              )}
              <span>
                {selectedIds.size === 0
                  ? 'Select Words to Save'
                  : `Save Selected to Word Bank (${selectedIds.size})`}
              </span>
            </button>
          </div>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center justify-between gap-2 border ${
              feedbackMsg.type === 'success'
                ? 'bg-[var(--accent-cypress)]/10 border-[var(--accent-cypress)]/30 text-[var(--accent-cypress)]'
                : 'bg-[var(--accent-terracotta)]/10 border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)]'
            }`}
          >
            <span>{feedbackMsg.text}</span>
            {feedbackMsg.type === 'success' && onNavigateToStudy && (
              <button
                onClick={onNavigateToStudy}
                className="font-bold underline hover:opacity-80 flex items-center gap-1 cursor-pointer shrink-0"
              >
                <BookOpen className="w-3.5 h-3.5" /> Practice Flashcards Now
              </button>
            )}
          </div>
        )}

        {/* Search & Bulk selection bar */}
        {drafts.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="text-xs font-medium text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] flex items-center gap-2 cursor-pointer self-start select-none"
            >
              {selectedIds.size === filteredDrafts.length && filteredDrafts.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-[var(--accent-ochre)]" />
              ) : (
                <Square className="w-4 h-4 text-[var(--ink-muted)]" />
              )}
              <span>
                {selectedIds.size === filteredDrafts.length && filteredDrafts.length > 0
                  ? `Deselect All (${filteredDrafts.length})`
                  : `Select All (${filteredDrafts.length})`}
              </span>
            </button>

            <input
              type="text"
              placeholder="Search drafts by Arabic, English, or topic..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full sm:w-72 px-3 py-1.5 rounded-lg text-xs bg-[var(--bg-primary)] border border-[var(--border-subtle)] focus:border-[var(--accent-ochre)] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] outline-none"
            />
          </div>
        )}
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="p-8 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-[var(--accent-ochre)]" />
          <p className="text-xs text-[var(--ink-muted)]">Loading draft collection...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && drafts.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3">
          <div className="w-12 h-12 rounded-full bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] mx-auto flex items-center justify-center">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="font-semibold text-[var(--ink-primary)] text-sm">
            No words in Drafts right now
          </h3>
          <p className="text-xs text-[var(--ink-secondary)] max-w-md mx-auto leading-relaxed">
            Whenever you generate words in the <strong>"Learn New Words"</strong> generator, all unique words are automatically preserved here.
          </p>
        </div>
      )}

      {/* Draft Words List */}
      {!loading && filteredDrafts.length > 0 && (
        <div className="space-y-3">
          {filteredDrafts.map((d) => {
            const isChecked = selectedIds.has(d.id);
            return (
              <div
                key={d.id}
                onClick={() => toggleSelect(d.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer grid grid-cols-1 md:grid-cols-12 gap-4 items-start ${
                  isChecked
                    ? 'bg-[var(--accent-ochre-dim)]/40 border-[var(--accent-ochre)] shadow-sm'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--border-strong)]'
                }`}
              >
                {/* Column 1: Checkbox + Arabic + Audio */}
                <div className="md:col-span-4 space-y-1">
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelect(d.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="h-4 w-4 rounded accent-[var(--accent-ochre)] cursor-pointer shrink-0"
                    />
                    <div onClick={(e) => e.stopPropagation()}>
                      <AudioPronounceButton arabicText={d.arabic} size="sm" />
                    </div>
                    <span className="font-arabic text-2xl sm:text-3xl font-bold text-[var(--accent-ochre)] harakat-text">
                      {d.arabic}
                    </span>
                  </div>
                  {d.transliteration && (
                    <div className="text-xs font-mono text-[var(--ink-muted)] pl-16">
                      {d.transliteration}
                    </div>
                  )}
                  {d.root && (
                    <div className="text-xs text-[var(--ink-muted)] pl-16">
                      Root: <strong className="text-[var(--ink-secondary)]">{d.root}</strong>
                    </div>
                  )}
                </div>

                {/* Column 2: English Meaning + Word Type & Topic */}
                <div className="md:col-span-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-surface-elevated)] text-[var(--ink-secondary)] border border-[var(--border-subtle)]">
                      {d.wordType}
                    </span>
                    {d.topic && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]">
                        {d.topic}
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-semibold text-[var(--ink-primary)]">
                    {d.english}
                  </div>
                  {(d.presentTenseI || d.presentTenseHe) && (
                    <div className="text-xs text-[var(--ink-secondary)] font-arabic space-x-2">
                      {d.presentTenseI && <span>أَنَا: {d.presentTenseI}</span>}
                      {d.presentTenseHe && <span>هُوَ: {d.presentTenseHe}</span>}
                    </div>
                  )}
                </div>

                {/* Column 3: Example Sentence & Audio */}
                <div className="md:col-span-4 space-y-1.5 pl-0 md:pl-3 border-l-0 md:border-l border-[var(--border-subtle)]">
                  {d.exampleArabic && (
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-arabic text-sm text-[var(--ink-primary)] leading-relaxed harakat-text text-right flex-1">
                        {d.exampleArabic}
                      </div>
                      <div onClick={(e) => e.stopPropagation()}>
                        <AudioPronounceButton arabicText={d.exampleArabic} size="sm" />
                      </div>
                    </div>
                  )}
                  {d.exampleTransliteration && (
                    <div className="text-[11px] font-mono text-[var(--ink-muted)] italic">
                      "{d.exampleTransliteration}"
                    </div>
                  )}
                  {d.exampleEnglish && (
                    <div className="text-xs text-[var(--ink-secondary)]">
                      {d.exampleEnglish}
                    </div>
                  )}
                </div>

                {/* Column 4: Discard Button */}
                <div className="md:col-span-1 flex justify-end items-center">
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSingle(d.id, d.arabic, e)}
                    disabled={isDeleting === d.id}
                    className="p-2 text-[var(--ink-muted)] hover:text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)]/10 rounded-lg transition cursor-pointer"
                    title="Discard from drafts"
                  >
                    {isDeleting === d.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-terracotta)]" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
