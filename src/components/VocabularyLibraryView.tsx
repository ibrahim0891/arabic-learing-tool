'use client';

import React, { useState, useEffect } from 'react';
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
  Square
} from 'lucide-react';
import { Word } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';

interface VocabularyLibraryProps {
  onWordCountChange?: () => void;
}

export const VocabularyLibraryView: React.FC<VocabularyLibraryProps> = ({
  onWordCountChange,
}) => {
  const [mounted, setMounted] = useState(false);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [topicFilter, setTopicFilter] = useState('all');

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

  useEffect(() => {
    setMounted(true);
    fetchWords();
  }, [searchQuery, statusFilter, topicFilter]);

  const fetchWords = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set('q', searchQuery);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (topicFilter !== 'all') params.set('topic', topicFilter);

      const res = await fetch(`/api/words?${params.toString()}`);
      const data = await res.json();
      setWords(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

      setWords((prev) => prev.filter((w) => !selectedWordIds.has(w.id)));
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
      setWords((prev) => prev.filter((w) => w.id !== id));
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
      fetchWords();
      if (onWordCountChange) onWordCountChange();
    } catch (err: any) {
      setFormError(err.message || 'Error saving word');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn w-full max-w-7xl mx-auto">
      {/* Friendly Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-[var(--border-subtle)] pb-6">
        <div className="space-y-1">
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--accent-ochre)]">
            My Word Bank
          </div>
          <h1 className="editorial-title text-3xl font-semibold text-[var(--ink-primary)]">
            Your Arabic Vocabulary Library
          </h1>
          <p className="text-xs text-[var(--ink-muted)]">
            You have {words.length} saved words. Search, filter, practice, or add your own custom words anytime.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="btn-ochre px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> Add Word Manually
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-sm">
        <div className="sm:col-span-6 relative">
          <Search className="w-4 h-4 text-[var(--ink-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search Arabic, pronunciation, or English meaning..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] shadow-xs"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm focus:outline-none shadow-xs"
          >
            <option value="all">All Progress Levels</option>
            <option value="new">New (Not yet tested)</option>
            <option value="learning">Currently Learning</option>
            <option value="struggling">Needs More Practice</option>
            <option value="mastered">Mastered (Well Known)</option>
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm focus:outline-none shadow-xs"
          >
            <option value="all">All Topics</option>
            <option value="daily life">Daily Life</option>
            <option value="food">Food & Dining</option>
            <option value="travel">Travel</option>
            <option value="technology">Technology</option>
            <option value="work">Work & School</option>
            <option value="emotions">Feelings & Small Talk</option>
          </select>
        </div>
      </div>

      {/* Bulk Action Toolbar */}
      {words.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-xl text-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleSelectAll}
              className="flex items-center gap-2 font-medium text-[var(--ink-primary)] hover:text-[var(--accent-ochre)] cursor-pointer transition select-none"
            >
              {words.every((w) => selectedWordIds.has(w.id)) ? (
                <CheckSquare className="w-4 h-4 text-[var(--accent-ochre)]" />
              ) : (
                <Square className="w-4 h-4 text-[var(--ink-muted)]" />
              )}
              <span>
                {words.every((w) => selectedWordIds.has(w.id))
                  ? 'Deselect All'
                  : `Select All (${words.length})`}
              </span>
            </button>

            {selectedWordIds.size > 0 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] border border-[var(--accent-ochre)]/20">
                {selectedWordIds.size} selected
              </span>
            )}
          </div>

          {selectedWordIds.size > 0 && (
            <button
              type="button"
              onClick={() => setShowBatchConfirm(true)}
              className="btn-danger flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Selected ({selectedWordIds.size})</span>
            </button>
          )}
        </div>
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
                className={`py-5 grid grid-cols-1 md:grid-cols-12 gap-4 items-start px-3 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-[var(--accent-ochre-dim)]/70 border-l-4 border-l-[var(--accent-ochre)]'
                    : 'hover:bg-[var(--accent-ochre-dim)]/40'
                }`}
              >
                {/* Arabic Word, Checkbox & Audio */}
                <div className="md:col-span-3 space-y-1.5">
                  <div className="flex items-center gap-3">
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
                        <CheckSquare className="w-5 h-5 text-[var(--accent-ochre)]" />
                      ) : (
                        <Square className="w-5 h-5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]" />
                      )}
                    </button>
                    <AudioPronounceButton arabicText={w.arabic} size="md" />
                    <span className="font-arabic text-4xl sm:text-5xl font-bold text-[var(--accent-ochre)] harakat-text">
                      {w.arabic}
                    </span>
                  </div>
                  {w.transliteration && (
                    <div className="text-base font-mono text-[var(--ink-secondary)] pl-[4.5rem] tracking-wide font-medium">
                      {w.transliteration}
                    </div>
                  )}
                </div>

                {/* English & Root */}
                <div className="md:col-span-3 space-y-2">
                  <div className="font-serif text-2xl font-bold text-[var(--ink-primary)]">
                    {w.english}
                  </div>
                  <div className="text-xs text-[var(--ink-muted)] flex flex-wrap items-center gap-2">
                    <span className="capitalize font-semibold text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2.5 py-0.5 rounded-full text-[11px] uppercase tracking-wider">
                      {w.wordType}
                    </span>
                    {w.root && (
                      <span className="text-[var(--ink-secondary)] font-medium">
                        Root: <strong className="font-mono text-[var(--ink-primary)]">{w.root}</strong>
                      </span>
                    )}
                  </div>
                  {w.presentTenseI && (
                    <div className="pt-0.5">
                      <span className="font-arabic text-base text-[var(--accent-cypress)] harakat-text font-semibold px-2.5 py-1 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] inline-block">
                        أَنَا {w.presentTenseI} • هُوَ {w.presentTenseHe || '-'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Example sentence with Audio & Transliteration */}
                <div className="md:col-span-4 space-y-2 p-3 sm:p-4 rounded-xl bg-[var(--bg-surface)]/70 border border-[var(--border-subtle)] shadow-xs">
                  <div className="flex items-start justify-end gap-2.5">
                    <p className="font-arabic text-xl sm:text-2xl font-semibold text-[var(--ink-primary)] harakat-text leading-relaxed text-right flex-1">
                      {w.exampleArabic}
                    </p>
                    <AudioPronounceButton
                      arabicText={w.exampleArabic}
                      size="sm"
                      title="Listen to example sentence"
                    />
                  </div>
                  {w.exampleTransliteration && (
                    <p className="text-sm font-mono text-[var(--ink-secondary)] text-left leading-normal font-medium">
                      {w.exampleTransliteration}
                    </p>
                  )}
                  {w.exampleEnglish && (
                    <p className="text-sm sm:text-base text-[var(--ink-primary)] italic text-left font-serif leading-relaxed">
                      "{w.exampleEnglish}"
                    </p>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="md:col-span-2 flex flex-col items-end justify-between space-y-3">
                  <div className="text-right">
                    <span className={`text-sm font-bold block ${statusColors}`}>
                      {statusLabel}
                    </span>
                    <span className="text-xs text-[var(--ink-muted)] font-medium">
                      Tested {w.timesTested}x ({accuracy}% correct)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
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
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-quiet px-4 py-2 rounded-xl text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="wordModalForm"
                disabled={isSaving}
                className="btn-ochre px-5 py-2 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : editingWord ? 'Save Changes' : 'Add to Word Bank'}
              </button>
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
    </div>
  );
};
