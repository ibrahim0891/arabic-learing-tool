'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import {
  Search,
  Plus,
  Trash2,
  Edit2,
  X,
  AlertCircle,
  Loader2,
  CheckSquare,
  Square,
  BookOpen,
  Layers,
  ChevronRight,
  BarChart3,
  Trophy,
  BookMarked,
  Flame,
  Sparkles,
  Clock
} from 'lucide-react';
import { Word } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';
import { Button } from './ui/Button';

interface VocabularyLibraryProps {
  onWordCountChange?: () => void;
}

export const VocabularyLibraryView: React.FC<VocabularyLibraryProps> = ({
  onWordCountChange,
}) => {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  // allWords holds the complete (unfiltered) list fetched from the API
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');

  // Progress modal
  const [showProgressModal, setShowProgressModal] = useState(false);

  // Multiple selection state
  const [selectedWordIds, setSelectedWordIds] = useState<Set<string>>(new Set());
  const [isDeletingBatch, setIsDeletingBatch] = useState(false);
  const [showBatchConfirm, setShowBatchConfirm] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [modalForm, setModalForm] = useState({
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
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all words once; filtering is done client-side so tab switches are instant
  useEffect(() => {
    setMounted(true);
    fetchWords();
  }, [topicFilter]);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (topicFilter !== 'all') params.set('topic', topicFilter);

      const res = await fetch(`/api/words?${params.toString()}`);
      const data = await res.json();
      setAllWords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ---- Client-side derived word list ----
  const words = allWords.filter(w => {
    // Tab filter
    if (statusFilter !== 'all') {
      const status = w.memoryStatus || 'new';
      if (statusFilter === 'new' && status !== 'new') return false;
      if (statusFilter === 'learning' && status !== 'learning') return false;
      if (statusFilter === 'struggling' && status !== 'struggling') return false;
      if (statusFilter === 'mastered' && status !== 'mastered') return false;
    }
    // Search filter
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
  const tabCounts = {
    all: allWords.length,
    new: allWords.filter(w => (w.memoryStatus || 'new') === 'new').length,
    learning: allWords.filter(w => w.memoryStatus === 'learning').length,
    struggling: allWords.filter(w => w.memoryStatus === 'struggling').length,
    mastered: allWords.filter(w => w.memoryStatus === 'mastered').length,
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
    setModalForm({
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
    });
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
      fetchWords(); // reload all words after save
      if (onWordCountChange) onWordCountChange();
    } catch (err: any) {
      setFormError(err.message || 'Error saving word');
    } finally {
      setIsSaving(false);
    }
  };

  // Launch casual flashcard practice for the current tab / selection (does not impact learning metrics)
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
      const selectedWords = selectedWordIds.size > 0
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

  // Progress stats from full unfiltered allWords
  const masteredWords = allWords.filter(w => w.memoryStatus === 'mastered');
  const learningWords = allWords.filter(w => w.memoryStatus === 'learning');
  const strugglingWords = allWords.filter(w => w.memoryStatus === 'struggling');
  const newWords = allWords.filter(w => w.memoryStatus === 'new' || !w.memoryStatus);
  const totalWords = allWords.length;
  const masteredPct = totalWords > 0 ? Math.round((masteredWords.length / totalWords) * 100) : 0;
  const learningPct = totalWords > 0 ? Math.round((learningWords.length / totalWords) * 100) : 0;
  const strugglingPct = totalWords > 0 ? Math.round((strugglingWords.length / totalWords) * 100) : 0;
  const dueNow = allWords.filter(w => w.nextReviewDate && new Date(w.nextReviewDate).getTime() <= Date.now());

  return (
    <div className="space-y-4 sm:space-y-5 animate-fadeIn w-full max-w-7xl mx-auto">
      {/* Friendly Compact Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[var(--border-subtle)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-bold text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2 py-0.5 rounded-md">
              My Word Bank
            </span>
            <span className="text-xs text-[var(--ink-muted)]">
              {allWords.length} saved {allWords.length === 1 ? 'word' : 'words'}
            </span>
          </div>
          <h1 className="editorial-title text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] mt-1">
            Your Arabic Vocabulary Library
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="learning-progress-btn"
            onClick={() => setShowProgressModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-xs font-semibold text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)] hover:text-[var(--accent-ochre)] transition cursor-pointer"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Progress</span>
          </button>
          <Button
            onClick={handleOpenAdd}
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Add Word Manually
          </Button>
        </div>
      </div>

      {/* Unified Toolbar: Status Tabs + Search & Topic (Compact Desktop Layout) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2.5 p-1.5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {([
            { key: 'all',        label: 'All',            dotColor: '' },
            { key: 'new',        label: 'New',            dotColor: 'bg-[var(--ink-muted)]' },
            { key: 'learning',   label: 'Learning',       dotColor: 'bg-[var(--accent-cypress)]' },
            { key: 'struggling', label: 'Needs Practice', dotColor: 'bg-[var(--accent-terracotta)]' },
            { key: 'mastered',   label: 'Mastered',       dotColor: 'bg-[var(--accent-ochre)]' },
          ] as const).map(tab => {
            const isActive = statusFilter === tab.key;
            const count = tabCounts[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => { setStatusFilter(tab.key); setSelectedWordIds(new Set()); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-[var(--accent-ochre)] text-white shadow-xs"
                    : "text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface-elevated)]"
                }`}
              >
                {tab.dotColor && !isActive && (
                  <span className={`w-2 h-2 rounded-full shrink-0 ${tab.dotColor}`} />
                )}
                <span>{tab.label}</span>
                <span
                  className={`min-w-[18px] text-center px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isActive
                      ? "bg-white/25 text-white"
                      : "bg-[var(--border-subtle)] text-[var(--ink-muted)]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search, Topic Filters & Start Flashdeck Button */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search words, English..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="w-32 sm:w-36 shrink-0">
            <select
              value={topicFilter}
              onChange={(e) => setTopicFilter(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs focus:outline-none cursor-pointer"
            >
              <option value="all">All Topics</option>
              <option value="daily life">Daily Life</option>
              <option value="food">Food & Dining</option>
              <option value="travel">Travel</option>
              <option value="technology">Technology</option>
              <option value="work">Work & School</option>
              <option value="emotions">Feelings</option>
            </select>
          </div>

          {/* Start Flashdeck Button */}
          <button
            type="button"
            onClick={handleStartFlashcards}
            disabled={words.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent-ochre)] hover:brightness-105 active:scale-95 text-white text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shrink-0 whitespace-nowrap"
            title="Practice words from this tab in flashcards without affecting memory status or review dates"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Practice Deck ({selectedWordIds.size > 0 ? selectedWordIds.size : words.length})</span>
          </button>
        </div>
      </div>

      {/* Selection Sub-bar / Batch Actions (Eliminates the giant empty Select-All container) */}
      {words.length > 0 && (
        selectedWordIds.size > 0 ? (
          <div className="flex items-center justify-between gap-3 px-3.5 py-2 bg-[var(--accent-ochre-dim)] border border-[var(--accent-ochre)]/30 rounded-xl text-xs animate-fadeIn">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-2 font-semibold text-[var(--accent-ochre)] cursor-pointer select-none"
              >
                <CheckSquare className="w-4 h-4 text-[var(--accent-ochre)]" />
                <span>{selectedWordIds.size} of {words.length} selected</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedWordIds(new Set())}
                className="text-[11px] underline text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
              >
                Clear
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowBatchConfirm(true)}
              className="btn-danger flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedWordIds.size})</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between px-2 py-0.5 text-xs text-[var(--ink-muted)]">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-1.5 font-medium hover:text-[var(--ink-primary)] cursor-pointer transition select-none"
            >
              <Square className="w-3.5 h-3.5" />
              <span>Select All ({words.length})</span>
            </button>
            <span className="text-[11px]">
              Showing {words.length} of {allWords.length} words
            </span>
          </div>
        )
      )}

      {/* Words List */}
      {loading ? (
        <div className="py-20 text-center text-xs font-mono text-[var(--ink-muted)]">
          Loading your word bank...
        </div>
      ) : words.length === 0 ? (
        <div className="py-16 text-center text-xs text-[var(--ink-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
          No words found matching your search. Try typing something else or add a new word!
        </div>
      ) : (
        <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-[var(--border-subtle)]">
          {words.map((w) => {
            const isSelected = selectedWordIds.has(w.id);
            const totalTests = (w.timesCorrect || 0) + (w.timesIncorrect || 0);
            const accuracy = totalTests > 0 ? Math.round(((w.timesCorrect || 0) / totalTests) * 100) : 0;

            const statusColors = {
              new: 'text-[var(--ink-muted)]',
              learning: 'text-[var(--accent-cypress)]',
              struggling: 'text-[var(--accent-terracotta)]',
              mastered: 'text-[var(--accent-ochre)]',
            }[w.memoryStatus] || 'text-[var(--ink-muted)]';

            const statusLabel = {
              new: 'New Word',
              learning: 'Learning',
              struggling: 'Needs Practice',
              mastered: 'Mastered',
            }[w.memoryStatus] || w.memoryStatus;

            return (
              <div
                key={w.id}
                className={`py-3.5 sm:py-4 grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4 items-start px-3 rounded-xl transition-colors ${
                  isSelected
                    ? 'bg-[var(--accent-ochre-dim)]/70 border-l-4 border-l-[var(--accent-ochre)]'
                    : 'hover:bg-[var(--accent-ochre-dim)]/40'
                }`}
              >
                {/* Arabic Word, Checkbox & Audio */}
                <div className="md:col-span-3">
                  <div className="flex items-start gap-2.5">
                    <div className="flex items-center gap-1.5 pt-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelectWord(w.id);
                        }}
                        className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--accent-ochre)] cursor-pointer transition shrink-0"
                        title={isSelected ? 'Deselect word' : 'Select word'}
                        aria-label={`Select ${w.arabic}`}
                      >
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-[var(--accent-ochre)]" />
                        ) : (
                          <Square className="w-4 h-4 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]" />
                        )}
                      </button>
                      <AudioPronounceButton arabicText={w.arabic} size="sm" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => router.push(`/library/${w.id}`)}
                        className="text-right hover:opacity-85 transition cursor-pointer group text-inherit bg-transparent border-none p-0 inline-flex items-center"
                        title="Click to view word details & root family"
                      >
                        <span className="font-arabic text-3xl sm:text-4xl font-bold text-[var(--accent-ochre)] group-hover:brightness-110 harakat-text">
                          {w.arabic}
                        </span>
                      </button>
                      {w.transliteration && (
                        <div className="text-xs sm:text-sm font-mono text-[var(--ink-secondary)] tracking-wide font-medium mt-0.5">
                          {w.transliteration}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* English & Root */}
                <div className="md:col-span-3 space-y-1.5">
                  <button
                    type="button"
                    onClick={() => router.push(`/library/${w.id}`)}
                    className="font-serif text-xl sm:text-2xl font-bold text-[var(--ink-primary)] hover:text-[var(--accent-ochre)] text-left transition cursor-pointer block bg-transparent border-none p-0"
                    title="Click to view word details & root family"
                  >
                    {w.english}
                  </button>
                  <div className="text-xs text-[var(--ink-muted)] flex flex-wrap items-center gap-2">
                    <span className="capitalize font-semibold text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                      {w.wordType}
                    </span>
                    {w.root && (
                      <span className="text-[var(--ink-secondary)] font-medium text-xs">
                        Root: <strong className="font-mono text-[var(--ink-primary)]">{w.root}</strong>
                      </span>
                    )}
                  </div>
                  {w.presentTenseI && (
                    <div className="pt-0.5">
                      <span className="font-arabic text-sm text-[var(--accent-cypress)] harakat-text font-semibold px-2 py-0.5 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] inline-block">
                        أَنَا {w.presentTenseI} • هُوَ {w.presentTenseHe || '-'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Example sentence with Audio & Transliteration */}
                <div className="md:col-span-4 space-y-1.5 p-2.5 sm:p-3 rounded-xl bg-[var(--bg-surface)]/70 border border-[var(--border-subtle)] shadow-xs">
                  <div className="flex items-start justify-end gap-2">
                    <p className="font-arabic text-lg sm:text-xl font-semibold text-[var(--ink-primary)] harakat-text leading-relaxed text-right flex-1">
                      {w.exampleArabic}
                    </p>
                    <AudioPronounceButton
                      arabicText={w.exampleArabic}
                      size="sm"
                      title="Listen to example sentence"
                    />
                  </div>
                  {w.exampleTransliteration && (
                    <p className="text-xs font-mono text-[var(--ink-secondary)] text-left leading-normal font-medium">
                      {w.exampleTransliteration}
                    </p>
                  )}
                  {w.exampleEnglish && (
                    <p className="text-xs sm:text-sm text-[var(--ink-primary)] italic text-left font-serif leading-relaxed">
                      "{w.exampleEnglish}"
                    </p>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="md:col-span-2 flex flex-col items-end justify-between space-y-2 h-full">
                  <div className="text-right">
                    <span className={`text-xs font-bold block ${statusColors}`}>
                      {statusLabel}
                    </span>
                    <span className="text-[11px] text-[var(--ink-muted)] font-medium">
                      Tested {w.timesTested}x ({accuracy}%)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => router.push(`/library/${w.id}`)}
                      className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] hover:bg-[#9a5d16] hover:text-white transition cursor-pointer flex items-center gap-1.5"
                      title="View word details, 6-10 root family words, and contextual examples"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      <span>Root & Examples</span>
                      <ChevronRight className="w-3 h-3 opacity-60" />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(w)}
                      className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--accent-ochre-dim)] rounded-lg transition cursor-pointer"
                      title="Edit word details"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(w.id, w.arabic)}
                      className="p-1.5 text-[var(--ink-muted)] hover:text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)]/15 rounded-lg transition cursor-pointer"
                      title="Delete word"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Word Modal (portaled directly to document.body for full screen viewport centering) */}
      {isModalOpen && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto">
          <div className="w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-[var(--border-subtle)] px-6 py-4 bg-[var(--bg-surface)] shrink-0">
              <h3 className="editorial-title text-xl font-semibold text-[var(--ink-primary)]">
                {editingWord ? 'Edit Word Details' : 'Add a New Arabic Word'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1 rounded-lg hover:bg-[var(--accent-ochre-dim)] cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs flex-1">
              {formError && (
                <div className="p-3 text-xs text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 rounded-xl">
                  {formError}
                </div>
              )}

              <form id="wordModalForm" onSubmit={handleSaveModal} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-[var(--ink-secondary)] font-semibold">
                        Arabic Word (with diacritics) *
                      </label>
                      {modalForm.arabic.trim() && (
                        <AudioPronounceButton
                          arabicText={modalForm.arabic}
                          size="sm"
                          title="Listen to word preview"
                        />
                      )}
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="كِتَاب"
                      value={modalForm.arabic}
                      onChange={(e) => setModalForm({ ...modalForm, arabic: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-arabic text-xl text-right focus:outline-none focus:border-[var(--accent-ochre)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--ink-secondary)] font-semibold mb-1">
                      Pronunciation (Transliteration)
                    </label>
                    <input
                      type="text"
                      placeholder="kitāb"
                      value={modalForm.transliteration}
                      onChange={(e) => setModalForm({ ...modalForm, transliteration: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent-ochre)]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[var(--ink-secondary)] font-semibold mb-1">
                      English Meaning *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="book"
                      value={modalForm.english}
                      onChange={(e) => setModalForm({ ...modalForm, english: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent-ochre)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[var(--ink-secondary)] font-semibold mb-1">
                      Word Type
                    </label>
                    <select
                      value={modalForm.wordType}
                      onChange={(e) => setModalForm({ ...modalForm, wordType: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] focus:outline-none"
                    >
                      <option value="noun">Noun (Person, place, or thing)</option>
                      <option value="verb">Verb (Action word)</option>
                      <option value="adjective">Adjective (Description)</option>
                      <option value="expression">Everyday phrase or expression</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[var(--ink-secondary)] font-semibold">
                      Example Arabic Sentence
                    </label>
                    {modalForm.exampleArabic.trim() && (
                      <AudioPronounceButton
                        arabicText={modalForm.exampleArabic}
                        size="sm"
                        label="Listen"
                        title="Listen to example sentence preview"
                      />
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="قَرَأْتُ كِتَاباً مُفِيداً فِي المَكْتَبَةِ."
                    value={modalForm.exampleArabic}
                    onChange={(e) => setModalForm({ ...modalForm, exampleArabic: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-arabic text-lg text-right focus:outline-none focus:border-[var(--accent-ochre)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--ink-secondary)] font-semibold mb-1">
                    Sentence Pronunciation (Transliteration)
                  </label>
                  <input
                    type="text"
                    placeholder="qara'tu kitāban mufīdan fī al-maktabah."
                    value={modalForm.exampleTransliteration}
                    onChange={(e) => setModalForm({ ...modalForm, exampleTransliteration: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-mono text-xs focus:outline-none focus:border-[var(--accent-ochre)]"
                  />
                </div>

                <div>
                  <label className="block text-[var(--ink-secondary)] font-semibold mb-1">
                    Sentence English Translation
                  </label>
                  <input
                    type="text"
                    placeholder="I read a useful book in the library."
                    value={modalForm.exampleEnglish}
                    onChange={(e) => setModalForm({ ...modalForm, exampleEnglish: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] focus:outline-none focus:border-[var(--accent-ochre)]"
                  />
                </div>
              </form>
            </div>

            {/* Modal Sticky Footer Actions */}
            <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                form="wordModalForm"
                isLoading={isSaving}
              >
                {editingWord ? 'Save Changes' : 'Add to Word Bank'}
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Batch Delete Confirmation Modal */}
      {showBatchConfirm && mounted && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl p-6 space-y-4 animate-fadeIn">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-[var(--ink-primary)]">
                  Delete {selectedWordIds.size} {selectedWordIds.size === 1 ? 'Word' : 'Words'}?
                </h3>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  Are you sure you want to permanently remove {selectedWordIds.size} selected {selectedWordIds.size === 1 ? 'word' : 'words'} from your Word Bank? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                disabled={isDeletingBatch}
                onClick={() => setShowBatchConfirm(false)}
                className="btn-quiet px-4 py-2 rounded-xl text-xs cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingBatch}
                onClick={handleBatchDelete}
                className="btn-danger flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isDeletingBatch ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete {selectedWordIds.size} {selectedWordIds.size === 1 ? 'Word' : 'Words'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================== PROGRESS MODAL ===================== */}
      {showProgressModal && mounted && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
          onClick={(e) => { if (e.target === e.currentTarget) setShowProgressModal(false); }}
        >
          <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl overflow-hidden animate-fadeIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-[var(--accent-ochre-dim)]">
                  <BarChart3 className="w-4 h-4 text-[var(--accent-ochre)]" />
                </div>
                <div>
                  <h2 className="font-semibold text-sm text-[var(--ink-primary)]">Learning Progress</h2>
                  <p className="text-[11px] text-[var(--ink-muted)]">{totalWords} words in your bank</p>
                </div>
              </div>
              <button
                onClick={() => setShowProgressModal(false)}
                className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--border-subtle)] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Overall mastery ring summary */}
              <div className="grid grid-cols-2 gap-4">
                {/* Mastery donut visual */}
                <div className="col-span-2 flex items-center gap-6 p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)]">
                  <div className="relative shrink-0">
                    <svg width="80" height="80" viewBox="0 0 80 80">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="var(--border-subtle)" strokeWidth="9"/>
                      {masteredPct > 0 && (
                        <circle
                          cx="40" cy="40" r="32"
                          fill="none"
                          stroke="var(--accent-cypress)"
                          strokeWidth="9"
                          strokeDasharray={`${masteredPct * 2.01} 201`}
                          strokeLinecap="round"
                          transform="rotate(-90 40 40)"
                        />
                      )}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-lg font-bold text-[var(--accent-cypress)]">{masteredPct}%</span>
                      <span className="text-[9px] text-[var(--ink-muted)] font-semibold uppercase tracking-wide">done</span>
                    </div>
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--ink-primary)]">Overall Mastery</p>
                    <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                      {masteredWords.length} words mastered · {dueNow.length} due for review today
                    </p>
                    {dueNow.length > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] border border-[var(--accent-ochre)]/20">
                        <Clock className="w-2.5 h-2.5" /> {dueNow.length} card{dueNow.length !== 1 ? 's' : ''} due now
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Status bars */}
              <div className="space-y-3">
                {/* Mastered */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[var(--accent-cypress)]">
                      <Trophy className="w-3.5 h-3.5" /> Mastered
                    </span>
                    <span className="font-mono font-bold text-[var(--ink-secondary)]">{masteredWords.length} / {totalWords}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-cypress)] transition-all duration-700"
                      style={{ width: `${masteredPct}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-[var(--ink-muted)]">
                    Next review scheduled · won't appear in daily practice until due
                  </p>
                </div>

                {/* Learning */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[var(--accent-ochre)]">
                      <Sparkles className="w-3.5 h-3.5" /> Currently Learning
                    </span>
                    <span className="font-mono font-bold text-[var(--ink-secondary)]">{learningWords.length} / {totalWords}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-ochre)] transition-all duration-700"
                      style={{ width: `${learningPct}%` }}
                    />
                  </div>
                </div>

                {/* Struggling */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[var(--accent-terracotta)]">
                      <Flame className="w-3.5 h-3.5" /> Needs More Practice
                    </span>
                    <span className="font-mono font-bold text-[var(--ink-secondary)]">{strugglingWords.length} / {totalWords}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--accent-terracotta)] transition-all duration-700"
                      style={{ width: `${strugglingPct}%` }}
                    />
                  </div>
                </div>

                {/* New */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-[var(--ink-muted)]">
                      <BookMarked className="w-3.5 h-3.5" /> New (Untested)
                    </span>
                    <span className="font-mono font-bold text-[var(--ink-secondary)]">{newWords.length} / {totalWords}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--ink-muted)] transition-all duration-700"
                      style={{ width: totalWords > 0 ? `${Math.round((newWords.length / totalWords) * 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>

              {/* Quick stat chips */}
              <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)]">
                <div className="text-center p-2.5 rounded-xl bg-[var(--accent-cypress)]/10 border border-[var(--accent-cypress)]/20">
                  <p className="text-base font-bold text-[var(--accent-cypress)]">{masteredWords.length}</p>
                  <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">Mastered</p>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-[var(--accent-ochre-dim)] border border-[var(--accent-ochre)]/20">
                  <p className="text-base font-bold text-[var(--accent-ochre)]">{learningWords.length}</p>
                  <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">Learning</p>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/20">
                  <p className="text-base font-bold text-[var(--accent-terracotta)]">{strugglingWords.length}</p>
                  <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">Tricky</p>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-[var(--border-subtle)] border border-[var(--border-strong)]">
                  <p className="text-base font-bold text-[var(--ink-secondary)]">{newWords.length}</p>
                  <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">New</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--border-subtle)] flex justify-end">
              <button
                onClick={() => setShowProgressModal(false)}
                className="btn-ochre px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Got it!
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
