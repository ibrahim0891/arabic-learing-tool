'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { X, Sparkles, Loader2 } from 'lucide-react';
import { Word } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';

export interface WordFormData {
  arabic: string;
  transliteration: string;
  english: string;
  wordType: string;
  presentTenseI: string;
  presentTenseHe: string;
  root: string;
  exampleArabic: string;
  exampleTransliteration: string;
  exampleEnglish: string;
  explanation: string;
  topic: string;
  difficulty: string;
}

interface WordFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingWord: Word | null;
  formData: WordFormData;
  onChange: (data: WordFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  error: string | null;
}

export const WordFormModal: React.FC<WordFormModalProps> = ({
  isOpen,
  onClose,
  editingWord,
  formData,
  onChange,
  onSubmit,
  isSaving,
  error,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg my-auto max-h-[90vh] flex flex-col bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[16px] shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-[var(--border-subtle)] px-6 py-4 bg-[var(--bg-surface)] shrink-0">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--accent-ochre)] block">
              {editingWord ? 'Vocabulary Editor' : 'Manual Entry'}
            </span>
            <h3 className="text-[18px] font-bold text-[var(--ink-primary)]">
              {editingWord ? 'Edit Word Details' : 'Add a New Arabic Word'}
            </h3>
          </div>

          <button
            onClick={onClose}
            className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] p-1.5 rounded-[8px] hover:bg-[var(--bg-canvas)] cursor-pointer transition"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-[12px] flex-1">
          {error && (
            <div className="p-3 text-[12px] text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/20 rounded-[8px]">
              {error}
            </div>
          )}

          <form id="wordModalForm" onSubmit={onSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[var(--ink-secondary)] font-bold">
                    Arabic Word (with diacritics) *
                  </label>
                  {formData.arabic.trim() && (
                    <AudioPronounceButton
                      arabicText={formData.arabic}
                      size="sm"
                      title="Listen to word preview"
                    />
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="كِتَاب"
                  value={formData.arabic}
                  onChange={(e) => onChange({ ...formData, arabic: e.target.value })}
                  className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-arabic text-[22px] leading-[36px] text-right focus:outline-none focus:border-[var(--accent-ochre)] focus:ring-1 focus:ring-[var(--accent-ochre)]"
                />
              </div>

              <div>
                <label className="block text-[var(--ink-secondary)] font-bold mb-1">
                  Pronunciation (Transliteration)
                </label>
                <input
                  type="text"
                  placeholder="kitāb"
                  value={formData.transliteration}
                  onChange={(e) => onChange({ ...formData, transliteration: e.target.value })}
                  className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[13px] font-mono focus:outline-none focus:border-[var(--accent-ochre)] focus:ring-1 focus:ring-[var(--accent-ochre)]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--ink-secondary)] font-bold mb-1">
                  English Meaning *
                </label>
                <input
                  type="text"
                  required
                  placeholder="book"
                  value={formData.english}
                  onChange={(e) => onChange({ ...formData, english: e.target.value })}
                  className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[13px] focus:outline-none focus:border-[var(--accent-ochre)] focus:ring-1 focus:ring-[var(--accent-ochre)]"
                />
              </div>

              <div>
                <label className="block text-[var(--ink-secondary)] font-bold mb-1">
                  Word Type
                </label>
                <select
                  value={formData.wordType}
                  onChange={(e) => onChange({ ...formData, wordType: e.target.value })}
                  className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[13px] focus:outline-none focus:border-[var(--accent-ochre)] cursor-pointer"
                >
                  <option value="noun">Noun (Person, place, or thing)</option>
                  <option value="verb">Verb (Action word)</option>
                  <option value="adjective">Adjective (Description)</option>
                  <option value="expression">Everyday phrase or expression</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--ink-secondary)] font-bold mb-1">
                  Arabic Root (3 letters)
                </label>
                <input
                  type="text"
                  placeholder="ك-ت-ب"
                  value={formData.root}
                  onChange={(e) => onChange({ ...formData, root: e.target.value })}
                  className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[13px] font-mono focus:outline-none focus:border-[var(--accent-ochre)]"
                />
              </div>

              <div>
                <label className="block text-[var(--ink-secondary)] font-bold mb-1">
                  Topic / Category
                </label>
                <select
                  value={formData.topic}
                  onChange={(e) => onChange({ ...formData, topic: e.target.value })}
                  className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[13px] focus:outline-none focus:border-[var(--accent-ochre)] cursor-pointer"
                >
                  <option value="daily life">Daily Life</option>
                  <option value="food">Food & Dining</option>
                  <option value="travel">Travel</option>
                  <option value="technology">Technology</option>
                  <option value="work">Work & School</option>
                  <option value="emotions">Feelings</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-[var(--ink-secondary)] font-bold">
                  Example Arabic Sentence
                </label>
                {formData.exampleArabic.trim() && (
                  <AudioPronounceButton
                    arabicText={formData.exampleArabic}
                    size="sm"
                    label="Listen"
                    title="Listen to example sentence preview"
                  />
                )}
              </div>
              <input
                type="text"
                placeholder="قَرَأْتُ كِتَاباً مُفِيداً فِي المَكْتَبَةِ."
                value={formData.exampleArabic}
                onChange={(e) => onChange({ ...formData, exampleArabic: e.target.value })}
                className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-arabic text-[18px] leading-[30px] text-right focus:outline-none focus:border-[var(--accent-ochre)]"
              />
            </div>

            <div>
              <label className="block text-[var(--ink-secondary)] font-bold mb-1">
                Sentence Pronunciation (Transliteration)
              </label>
              <input
                type="text"
                placeholder="qara'tu kitāban mufīdan fī al-maktabah."
                value={formData.exampleTransliteration}
                onChange={(e) => onChange({ ...formData, exampleTransliteration: e.target.value })}
                className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] font-mono text-[11px] focus:outline-none focus:border-[var(--accent-ochre)]"
              />
            </div>

            <div>
              <label className="block text-[var(--ink-secondary)] font-bold mb-1">
                Sentence English Translation
              </label>
              <input
                type="text"
                placeholder="I read a useful book in the library."
                value={formData.exampleEnglish}
                onChange={(e) => onChange({ ...formData, exampleEnglish: e.target.value })}
                className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[13px] focus:outline-none focus:border-[var(--accent-ochre)]"
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
            onClick={onClose}
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
  );
};
