'use client';

import React from 'react';
import Link from 'next/link';
import { Word } from '@/lib/types';
import { ArabicText } from '@/components/ui/ArabicText';
import { Badge } from '@/components/ui/Badge';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';
import {
  CheckSquare,
  Square,
  Layers,
  Edit2,
  Trash2,
  ChevronRight,
} from 'lucide-react';

interface WordListTableViewProps {
  words: Word[];
  selectedWordIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onEdit: (word: Word) => void;
  onDelete: (id: string, arabic: string) => void;
}

export const WordListTableView: React.FC<WordListTableViewProps> = ({
  words,
  selectedWordIds,
  onToggleSelect,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="rounded-[12px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden shadow-xs">
      <div className="overflow-x-auto overscroll-x-contain">
        <table className="w-full text-left border-collapse text-[12px]">
          <thead>
            <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--ink-secondary)] font-semibold text-[11px] uppercase tracking-wider">
              <th className="py-2.5 px-2 sm:px-4 w-10 sm:w-12 text-center">#</th>
              <th className="py-2.5 px-2 sm:px-4">Arabic Word</th>
              <th className="py-2.5 px-4 hidden md:table-cell">Transliteration</th>
              <th className="py-2.5 px-2 sm:px-4">English Meaning</th>
              <th className="py-2.5 px-4 hidden lg:table-cell">Type & Root</th>
              <th className="py-2.5 px-2 sm:px-4">Retention Status</th>
              <th className="py-2.5 px-2 sm:px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border-subtle)]">
            {words.map((w) => {
              const isSelected = selectedWordIds.has(w.id);
              const totalTests = (w.timesCorrect || 0) + (w.timesIncorrect || 0);
              const accuracy = totalTests > 0 ? Math.round(((w.timesCorrect || 0) / totalTests) * 100) : 0;

              const statusVariant = {
                mastered: 'ochre',
                learning: 'success',
                struggling: 'danger',
                new: 'neutral',
              }[w.memoryStatus || 'new'] as 'ochre' | 'success' | 'danger' | 'neutral';

              const statusLabel = {
                new: 'New',
                learning: 'Learning',
                struggling: 'Tricky',
                mastered: 'Mastered',
              }[w.memoryStatus || 'new'] || w.memoryStatus;

              return (
                <tr
                  key={w.id}
                  className={`transition-colors ${
                    isSelected
                      ? 'bg-[var(--bg-accent-tint)]/60'
                      : 'hover:bg-[var(--bg-canvas)]/60'
                  }`}
                >
                  {/* Checkbox */}
                  <td className="py-2.5 px-1.5 sm:px-4 text-center">
                    <button
                      type="button"
                      onClick={() => onToggleSelect(w.id)}
                      className="p-1 rounded text-[var(--ink-muted)] hover:text-[var(--accent-ochre)] cursor-pointer"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-[var(--accent-ochre)]" />
                      ) : (
                        <Square className="w-4 h-4 text-[var(--ink-muted)] hover:text-[var(--ink-primary)]" />
                      )}
                    </button>
                  </td>

                  {/* Arabic Word + Audio */}
                  <td className="py-2.5 px-2 sm:px-4">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <AudioPronounceButton arabicText={w.arabic} size="sm" />
                      <div className="flex flex-col min-w-0">
                        <Link
                          href={`/library/${w.id}`}
                          className="font-arabic text-[18px] sm:text-[22px] font-bold text-[var(--accent-ochre)] hover:brightness-110 leading-tight"
                        >
                          {w.arabic}
                        </Link>
                        {w.transliteration && (
                          <span className="font-mono text-[10px] text-[var(--ink-muted)] md:hidden truncate">
                            {w.transliteration}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Transliteration (md+ screens) */}
                  <td className="py-2.5 px-4 font-mono text-[var(--ink-secondary)] text-[12px] hidden md:table-cell">
                    {w.transliteration || '—'}
                  </td>

                  {/* English Translation */}
                  <td className="py-2.5 px-2 sm:px-4">
                    <div className="flex flex-col gap-1 min-w-0">
                      <Link
                        href={`/library/${w.id}`}
                        className="font-serif text-[13px] sm:text-[14px] font-bold text-[var(--ink-primary)] hover:text-[var(--accent-ochre)] line-clamp-2"
                      >
                        {w.english}
                      </Link>
                      {/* Mobile Type & Root chips (hidden on lg where dedicated column exists) */}
                      <div className="flex items-center gap-1 lg:hidden flex-wrap">
                        <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-[var(--bg-canvas)] text-[var(--ink-muted)] font-semibold border border-[var(--border-subtle)]">
                          {w.wordType}
                        </span>
                        {w.root && (
                          <span className="font-arabic text-[11px] font-bold text-[var(--accent-ochre)]">
                            {w.root}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Type & Root (lg+ screens) */}
                  <td className="py-2.5 px-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant="neutral" className="!text-[10px] uppercase">
                        {w.wordType}
                      </Badge>
                      {w.root && (
                        <span className="font-arabic text-[12px] font-bold text-[var(--accent-ochre)] px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                          {w.root}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Status & Accuracy */}
                  <td className="py-2.5 px-2 sm:px-4">
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <Badge variant={statusVariant} className="!text-[10px] sm:!text-[11px] !px-1.5 sm:!px-2.5 !py-0.5">
                        {statusLabel}
                      </Badge>
                      <span className="text-[10px] sm:text-[11px] text-[var(--ink-muted)] hidden sm:inline">
                        {accuracy}%
                      </span>
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 px-2 sm:px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/library/${w.id}`}
                        className="p-1 sm:p-1.5 rounded-[6px] text-[var(--accent-ochre)] hover:bg-[var(--bg-accent-tint)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)] transition"
                        title="Root family and examples"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => onEdit(w)}
                        className="p-1 sm:p-1.5 rounded-[6px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] border border-[var(--border-subtle)] transition cursor-pointer"
                        title="Edit word details"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(w.id, w.arabic)}
                        className="p-1 sm:p-1.5 rounded-[6px] text-[var(--ink-muted)] hover:text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)]/10 border border-[var(--border-subtle)] hover:border-[var(--accent-terracotta)]/20 transition cursor-pointer"
                        title="Delete word"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
