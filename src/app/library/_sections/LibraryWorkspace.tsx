'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Word } from '@/lib/types';
import { LibraryHeader } from '../_components/LibraryHeader';
import { LibraryMetricsStrip } from '../_components/LibraryMetricsStrip';
import { LibraryToolbar, TabCounts } from '../_components/LibraryToolbar';
import { LibraryBatchBar } from '../_components/LibraryBatchBar';
import { WordListItemCard } from '../_components/WordListItemCard';
import { WordListTableView } from '../_components/WordListTableView';
import { WordFormModal, WordFormData } from '../_components/WordFormModal';
import { ProgressModal } from '../_components/ProgressModal';
import { BatchDeleteModal } from '../_components/BatchDeleteModal';
import { Loader2 } from 'lucide-react';

interface LibraryWorkspaceProps {
  onWordCountChange?: () => void;
}

const INITIAL_FORM_DATA: WordFormData = {
  arabic: '',
  transliteration: '',
  english: '',
  wordType: 'noun',
  presentTenseI: '',
  presentTenseHe: '',
  root: '',
  exampleArabic: '',
  exampleTransliteration: '',
  exampleEnglish: '',
  explanation: '',
  topic: 'daily life',
  difficulty: 'beginner',
};

const PAGE_SIZE = 10;

// Skeleton card placeholder that matches WordListItemCard
const WordCardSkeleton: React.FC = () => (
  <div className="p-4 sm:p-5 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] animate-pulse flex flex-col gap-3.5 shadow-2xs">
    {/* Top meta row */}
    <div className="flex items-center justify-between pb-2.5 border-b border-[var(--border-subtle)]/70">
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded bg-[var(--border-subtle)]/70" />
        <div className="w-6 h-6 rounded-full bg-[var(--border-subtle)]/60" />
        <div className="w-14 h-4 rounded-md bg-[var(--border-subtle)]/60" />
        <div className="w-20 h-4 rounded-md bg-[var(--border-subtle)]/40 hidden sm:block" />
      </div>
      <div className="flex items-center gap-2">
        <div className="w-16 h-4 rounded-full bg-[var(--border-subtle)]/50" />
        <div className="w-5 h-5 rounded bg-[var(--border-subtle)]/40" />
      </div>
    </div>
    {/* Center word showcase */}
    <div className="flex items-center justify-between py-1">
      <div className="space-y-1.5">
        <div className="h-5 bg-[var(--border-subtle)]/70 rounded w-36 sm:w-48" />
        <div className="h-3.5 bg-[var(--border-subtle)]/40 rounded w-24 sm:w-28" />
      </div>
      <div className="h-9 bg-[var(--border-subtle)]/80 rounded w-24 sm:w-32" />
    </div>
    {/* Bottom example snippet */}
    <div className="p-3 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]/50 flex flex-col gap-1.5">
      <div className="h-3.5 bg-[var(--border-subtle)]/60 rounded w-3/4 ml-auto" />
      <div className="h-3 bg-[var(--border-subtle)]/40 rounded w-1/2" />
    </div>
  </div>
);

export const LibraryWorkspace: React.FC<LibraryWorkspaceProps> = ({
  onWordCountChange,
}) => {
  const router = useRouter();

  // Words list & pagination state
  const [words, setWords] = useState<Word[]>([]);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [totalWords, setTotalWords] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const isFetchingRef = useRef(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  // Tab counts (tracked server-side across all database entries)
  const [tabCounts, setTabCounts] = useState<TabCounts>({
    all: 0,
    new: 0,
    learning: 0,
    struggling: 0,
    mastered: 0,
  });

  // Modals
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [modalForm, setModalForm] = useState<WordFormData>(INITIAL_FORM_DATA);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Selection
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // Sentinel ref for infinite scroll
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Debounce search input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Default to cards view on smaller viewports
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setViewMode('cards');
    }
  }, []);

  // Fetch initial page whenever filters or debounced search change
  useEffect(() => {
    fetchFirstPage();
  }, [statusFilter, topicFilter, debouncedSearch]);

  const fetchFirstPage = async () => {
    setLoading(true);
    setPage(1);
    setSelectedWordIds(new Set());

    try {
      const params = new URLSearchParams();
      params.set('page', '1');
      params.set('limit', String(PAGE_SIZE));
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (topicFilter !== 'all') params.set('topic', topicFilter);
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());

      const res = await fetch(`/api/words?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setWords(data.words || []);
        setTotalWords(data.total || 0);
        setHasMore(data.hasMore ?? false);
        if (data.tabCounts) setTabCounts(data.tabCounts);
      }
    } catch (err) {
      console.error('Error fetching words:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load next page automatically (well before user reaches bottom)
  const loadMoreWords = useCallback(async () => {
    if (isFetchingRef.current || !hasMore || loading) return;

    isFetchingRef.current = true;
    setIsLoadingMore(true);
    const nextPage = page + 1;

    try {
      const params = new URLSearchParams();
      params.set('page', String(nextPage));
      params.set('limit', String(PAGE_SIZE));
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (topicFilter !== 'all') params.set('topic', topicFilter);
      if (debouncedSearch.trim()) params.set('q', debouncedSearch.trim());

      const res = await fetch(`/api/words?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        const incoming: Word[] = data.words || [];

        setWords((prev) => {
          // Avoid duplicate keys if words were modified
          const existingIds = new Set(prev.map((w) => w.id));
          const fresh = incoming.filter((w) => !existingIds.has(w.id));
          return [...prev, ...fresh];
        });

        setPage(nextPage);
        setHasMore(data.hasMore ?? false);
        if (data.tabCounts) setTabCounts(data.tabCounts);
      }
    } catch (err) {
      console.error('Error loading next page:', err);
    } finally {
      setIsLoadingMore(false);
      isFetchingRef.current = false;
    }
  }, [hasMore, loading, page, statusFilter, topicFilter, debouncedSearch]);

  // Infinite Scroll IntersectionObserver — triggers ~1000px before bottom
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading && !isFetchingRef.current) {
          loadMoreWords();
        }
      },
      {
        threshold: 0,
        rootMargin: '1000px 0px', // Pre-fetch ~1000px before user reaches the sentinel
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMoreWords, hasMore, loading]);

  // Selection handlers
  const toggleSelectWord = (id: string) => {
    setSelectedWordIds((prev) => {
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
    if (words.length === 0) return;
    const allSelected = words.every((w) => selectedWordIds.has(w.id));
    if (allSelected) {
      setSelectedWordIds(new Set());
    } else {
      setSelectedWordIds(new Set(words.map((w) => w.id)));
    }
  };

  const handleBatchDelete = async () => {
    if (selectedWordIds.size === 0) return;
    setIsDeletingBatch(true);
    try {
      const idsToDelete = Array.from(selectedWordIds);
      const res = await fetch('/api/words', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: idsToDelete }),
      });

      if (!res.ok) {
        throw new Error('Failed to delete selected words');
      }

      setWords((prev) => prev.filter((w) => !selectedWordIds.has(w.id)));
      setTotalWords((prev) => Math.max(0, prev - idsToDelete.length));
      setSelectedWordIds(new Set());
      setShowBatchConfirm(false);
      fetchFirstPage();
      if (onWordCountChange) onWordCountChange();
    } catch (err) {
      console.error('Failed to batch delete words:', err);
      alert('Could not delete selected words. Please try again.');
    } finally {
      setIsDeletingBatch(false);
    }
  };

  const handleBatchStatusUpdate = async (newStatus: 'mastered' | 'learning') => {
    if (selectedWordIds.size === 0) return;
    setIsUpdatingStatus(true);
    try {
      const ids = Array.from(selectedWordIds);
      const res = await fetch('/api/words', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, memoryStatus: newStatus }),
      });

      if (!res.ok) {
        throw new Error('Failed to update status');
      }

      setWords((prev) =>
        prev.map((w) => (selectedWordIds.has(w.id) ? { ...w, memoryStatus: newStatus } : w))
      );
      setSelectedWordIds(new Set());
      fetchFirstPage();
      if (onWordCountChange) onWordCountChange();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Could not update word status. Please try again.');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleDelete = async (id: string, arabicWord: string) => {
    if (!confirm(`Delete "${arabicWord}" from your Word Bank?`)) return;

    try {
      await fetch(`/api/words/${id}`, { method: 'DELETE' });
      setWords((prev) => prev.filter((w) => w.id !== id));
      setTotalWords((prev) => Math.max(0, prev - 1));
      setSelectedWordIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (onWordCountChange) onWordCountChange();
    } catch (err) {
      console.error('Failed to delete word:', err);
      alert('Failed to delete word.');
    }
  };

  const handleOpenAdd = () => {
    setEditingWord(null);
    setModalForm(INITIAL_FORM_DATA);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: Word) => {
    setEditingWord(w);
    setModalForm({
      arabic: w.arabic,
      transliteration: w.transliteration || '',
      english: w.english,
      wordType: w.wordType || 'noun',
      presentTenseI: w.presentTenseI || '',
      presentTenseHe: w.presentTenseHe || '',
      root: w.root || '',
      exampleArabic: w.exampleArabic || '',
      exampleTransliteration: w.exampleTransliteration || '',
      exampleEnglish: w.exampleEnglish || '',
      explanation: w.explanation || '',
      topic: w.topic || 'daily life',
      difficulty: w.difficulty || 'beginner',
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFormError(null);

    try {
      if (editingWord) {
        const res = await fetch(`/api/words/${editingWord.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modalForm),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      } else {
        const res = await fetch('/api/words', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(modalForm),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }

      setIsModalOpen(false);
      fetchFirstPage();
      if (onWordCountChange) onWordCountChange();
    } catch (err: any) {
      setFormError(err.message || 'Error saving word');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartFlashcards = () => {
    if (words.length === 0) return;
    const tabLabels: Record<string, string> = {
      all: 'All Words',
      new: 'New Words',
      learning: 'Learning Words',
      struggling: 'Needs Practice Words',
      mastered: 'Mastered Words',
    };
    const activeLabel = tabLabels[statusFilter] || `${statusFilter} Words`;

    try {
      const selectedWords =
        selectedWordIds.size > 0
          ? words.filter((w) => selectedWordIds.has(w.id))
          : words;

      const payload = {
        ids: selectedWords.map((w) => w.id),
        tab: statusFilter,
        label: selectedWordIds.size > 0 ? `${selectedWords.length} Selected Words` : activeLabel,
        practiceOnly: true,
      };
      sessionStorage.setItem('fasih_practice_deck', JSON.stringify(payload));
    } catch (_) {}

    router.push(`/flashcards?mode=practice&status=${statusFilter}`);
  };

  const practiceDeckCount = selectedWordIds.size > 0 ? selectedWordIds.size : totalWords;

  return (
    <div className="p-3.5 sm:p-10 max-w-[1216px] w-full min-w-0 mx-auto flex flex-col gap-4 sm:gap-6 animate-fadeIn pb-16">
      {/* 1. Header */}
      <LibraryHeader
        totalWords={tabCounts.all || totalWords}
        onOpenProgress={() => setShowProgressModal(true)}
        onOpenAdd={handleOpenAdd}
      />

      {/* 2. Overview Metrics Strip (fed from server tabCounts) */}
      <LibraryMetricsStrip
        totalWords={tabCounts.all || totalWords}
        masteredCount={tabCounts.mastered}
        learningCount={tabCounts.learning}
        strugglingCount={tabCounts.struggling}
        newCount={tabCounts.all > 0 ? tabCounts.new : totalWords}
        onFilterClick={(status) => {
          setStatusFilter(status);
          setSelectedWordIds(new Set());
        }}
      />

      {/* 3. Unified Toolbar */}
      <LibraryToolbar
        statusFilter={statusFilter}
        onStatusFilterChange={(status) => {
          setStatusFilter(status);
          setSelectedWordIds(new Set());
        }}
        tabCounts={tabCounts}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        topicFilter={topicFilter}
        onTopicFilterChange={setTopicFilter}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onStartFlashcards={handleStartFlashcards}
        practiceDeckCount={practiceDeckCount}
      />

      {/* 4. Batch Action Bar */}
      <LibraryBatchBar
        totalVisible={words.length}
        totalAll={totalWords}
        selectedCount={selectedWordIds.size}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedWordIds(new Set())}
        onBatchStatusUpdate={handleBatchStatusUpdate}
        onBatchDeleteClick={() => setShowBatchConfirm(true)}
        isUpdatingStatus={isUpdatingStatus}
      />

      {/* 5. Words List (Cards or Table View) with Infinite Scroll */}
      {loading ? (
        /* Initial Loading Skeleton Cards */
        <div className="space-y-3 animate-fadeIn">
          <WordCardSkeleton />
          <WordCardSkeleton />
          <WordCardSkeleton />
        </div>
      ) : words.length === 0 ? (
        <div className="py-20 text-center space-y-3 border border-dashed border-[var(--border-subtle)] rounded-[12px] bg-[var(--bg-surface)] p-8">
          <p className="text-[14px] font-semibold text-[var(--ink-primary)]">
            No vocabulary entries found
          </p>
          <p className="text-[12px] text-[var(--ink-muted)] max-w-md mx-auto">
            {debouncedSearch
              ? `No words matched "${debouncedSearch}". Try a different search term or reset the filters.`
              : 'Your word bank is currently empty in this view. Add new words to get started!'}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {viewMode === 'table' ? (
            <WordListTableView
              words={words}
              selectedWordIds={selectedWordIds}
              onToggleSelect={toggleSelectWord}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ) : (
            <div className="space-y-3">
              {words.map((w, idx) => (
                <React.Fragment key={w.id}>
                  {/* Pre-fetch trigger positioned 3 cards before the end */}
                  {words.length > 3 && idx === words.length - 3 && (
                    <div ref={sentinelRef} className="h-px w-full pointer-events-none -my-1" />
                  )}
                  <WordListItemCard
                    word={w}
                    isSelected={selectedWordIds.has(w.id)}
                    onToggleSelect={toggleSelectWord}
                    onEdit={handleOpenEdit}
                    onDelete={handleDelete}
                  />
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Fallback sentinel for short initial lists (<= 3 cards) or table view */}
          {(words.length <= 3 || viewMode === 'table') && (
            <div ref={sentinelRef} className="h-4 w-full pointer-events-none" />
          )}

          {/* Bottom Skeleton Animation when loading more */}
          {isLoadingMore && (
            <div className="space-y-3 pt-1 animate-fadeIn">
              <WordCardSkeleton />
              <WordCardSkeleton />
            </div>
          )}

          {/* Reached the end marker */}
          {!hasMore && words.length > 0 && !loading && (
            <div className="py-8 flex items-center justify-center gap-3 text-[var(--ink-muted)] text-[12px] select-none">
              <div className="w-12 h-px bg-[var(--border-subtle)]" />
              <span>All {totalWords} {totalWords === 1 ? 'word' : 'words'} loaded</span>
              <div className="w-12 h-px bg-[var(--border-subtle)]" />
            </div>
          )}
        </div>
      )}

      {/* 6. Modals */}
      <WordFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        editingWord={editingWord}
        formData={modalForm}
        onChange={setModalForm}
        onSubmit={handleSaveModal}
        isSaving={isSaving}
        error={formError}
      />

      <ProgressModal
        isOpen={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        totalWords={tabCounts.all || totalWords}
        masteredWordsCount={tabCounts.mastered}
        learningWordsCount={tabCounts.learning}
        strugglingWordsCount={tabCounts.struggling}
        newWordsCount={tabCounts.all > 0 ? tabCounts.new : totalWords}
        dueNowCount={tabCounts.struggling}
      />

      <BatchDeleteModal
        isOpen={showBatchConfirm}
        onClose={() => setShowBatchConfirm(false)}
        selectedCount={selectedWordIds.size}
        onConfirm={handleBatchDelete}
        isDeleting={isDeletingBatch}
      />
    </div>
  );
};
