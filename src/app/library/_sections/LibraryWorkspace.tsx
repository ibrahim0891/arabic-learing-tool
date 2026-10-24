'use client';

import React, { useState, useEffect } from 'react';
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

export const LibraryWorkspace: React.FC<LibraryWorkspaceProps> = ({
  onWordCountChange,
}) => {
  const router = useRouter();
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

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

  useEffect(() => {
    fetchWords();
  }, [topicFilter]);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (topicFilter !== 'all') params.set('topic', topicFilter);

      const res = await fetch(`/api/words?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setAllWords(data || []);
      }
    } catch (err) {
      console.error('Error fetching words:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filtered list
  const filteredWords = allWords.filter((w) => {
    if (statusFilter !== 'all') {
      const status = w.memoryStatus || 'new';
      if (statusFilter === 'new' && status !== 'new') return false;
      if (statusFilter === 'learning' && status !== 'learning') return false;
      if (statusFilter === 'struggling' && status !== 'struggling') return false;
      if (statusFilter === 'mastered' && status !== 'mastered') return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      return (
        (w.arabic || '').includes(q) ||
        (w.english || '').toLowerCase().includes(q) ||
        (w.transliteration || '').toLowerCase().includes(q) ||
        (w.topic || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Tab counts
  const tabCounts: TabCounts = {
    all: allWords.length,
    new: allWords.filter((w) => (w.memoryStatus || 'new') === 'new').length,
    learning: allWords.filter((w) => w.memoryStatus === 'learning').length,
    struggling: allWords.filter((w) => w.memoryStatus === 'struggling').length,
    mastered: allWords.filter((w) => w.memoryStatus === 'mastered').length,
  };

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
    if (filteredWords.length === 0) return;
    const allSelected = filteredWords.every((w) => selectedWordIds.has(w.id));
    if (allSelected) {
      setSelectedWordIds(new Set());
    } else {
      setSelectedWordIds(new Set(filteredWords.map((w) => w.id)));
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

      setAllWords((prev) => prev.filter((w) => !selectedWordIds.has(w.id)));
      setSelectedWordIds(new Set());
      setShowBatchConfirm(false);
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

      setAllWords((prev) =>
        prev.map((w) => (selectedWordIds.has(w.id) ? { ...w, memoryStatus: newStatus } : w))
      );
      setSelectedWordIds(new Set());
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
      setAllWords((prev) => prev.filter((w) => w.id !== id));
      setSelectedWordIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      if (onWordCountChange) onWordCountChange();
    } catch (err) {
      console.error('Failed to delete word:', err);
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
      fetchWords();
      if (onWordCountChange) onWordCountChange();
    } catch (err: any) {
      setFormError(err.message || 'Error saving word');
    } finally {
      setIsSaving(false);
    }
  };

  const handleStartFlashcards = () => {
    if (filteredWords.length === 0) return;
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
          ? filteredWords.filter((w) => selectedWordIds.has(w.id))
          : filteredWords;

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

  // Progress metrics from full list
  const masteredWords = allWords.filter((w) => w.memoryStatus === 'mastered');
  const learningWords = allWords.filter((w) => w.memoryStatus === 'learning');
  const strugglingWords = allWords.filter((w) => w.memoryStatus === 'struggling');
  const newWords = allWords.filter((w) => w.memoryStatus === 'new' || !w.memoryStatus);
  const dueNow = allWords.filter(
    (w) => w.nextReviewDate && new Date(w.nextReviewDate).getTime() <= Date.now()
  );

  const practiceDeckCount = selectedWordIds.size > 0 ? selectedWordIds.size : filteredWords.length;

  return (
    <div className="p-4 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-4 sm:gap-6 animate-fadeIn pb-16">
      {/* 1. Header */}
      <LibraryHeader
        totalWords={allWords.length}
        onOpenProgress={() => setShowProgressModal(true)}
        onOpenAdd={handleOpenAdd}
      />

      {/* 2. Overview Metrics Strip */}
      <LibraryMetricsStrip
        totalWords={allWords.length}
        masteredCount={masteredWords.length}
        learningCount={learningWords.length}
        strugglingCount={strugglingWords.length}
        newCount={newWords.length}
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
        totalVisible={filteredWords.length}
        totalAll={allWords.length}
        selectedCount={selectedWordIds.size}
        onToggleSelectAll={toggleSelectAll}
        onClearSelection={() => setSelectedWordIds(new Set())}
        onBatchStatusUpdate={handleBatchStatusUpdate}
        onBatchDeleteClick={() => setShowBatchConfirm(true)}
        isUpdatingStatus={isUpdatingStatus}
      />

      {/* 5. Words List (Cards or Table View) */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-6 h-6 animate-spin text-[var(--accent-ochre)] mx-auto" />
          <p className="text-[12px] font-medium text-[var(--ink-muted)]">
            Loading your vocabulary dictionary...
          </p>
        </div>
      ) : filteredWords.length === 0 ? (
        <div className="py-20 text-center space-y-3 border border-dashed border-[var(--border-subtle)] rounded-[12px] bg-[var(--bg-surface)] p-8">
          <p className="text-[14px] font-semibold text-[var(--ink-primary)]">
            No vocabulary entries found
          </p>
          <p className="text-[12px] text-[var(--ink-muted)] max-w-md mx-auto">
            {searchQuery
              ? `No words matched "${searchQuery}". Try a different search term or reset the filters.`
              : 'Your word bank is currently empty in this view. Add new words to get started!'}
          </p>
        </div>
      ) : viewMode === 'table' ? (
        <WordListTableView
          words={filteredWords}
          selectedWordIds={selectedWordIds}
          onToggleSelect={toggleSelectWord}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      ) : (
        <div className="space-y-3">
          {filteredWords.map((w) => (
            <WordListItemCard
              key={w.id}
              word={w}
              isSelected={selectedWordIds.has(w.id)}
              onToggleSelect={toggleSelectWord}
              onEdit={handleOpenEdit}
              onDelete={handleDelete}
            />
          ))}
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
        totalWords={allWords.length}
        masteredWordsCount={masteredWords.length}
        learningWordsCount={learningWords.length}
        strugglingWordsCount={strugglingWords.length}
        newWordsCount={newWords.length}
        dueNowCount={dueNow.length}
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
