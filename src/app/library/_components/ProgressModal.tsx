'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { BarChart3, X, Trophy, Sparkles, Flame, BookMarked, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalWords: number;
  masteredWordsCount: number;
  learningWordsCount: number;
  strugglingWordsCount: number;
  newWordsCount: number;
  dueNowCount: number;
}

export const ProgressModal: React.FC<ProgressModalProps> = ({
  isOpen,
  onClose,
  totalWords,
  masteredWordsCount,
  learningWordsCount,
  strugglingWordsCount,
  newWordsCount,
  dueNowCount,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const masteredPct = totalWords > 0 ? Math.round((masteredWordsCount / totalWords) * 100) : 0;
  const learningPct = totalWords > 0 ? Math.round((learningWordsCount / totalWords) * 100) : 0;
  const strugglingPct = totalWords > 0 ? Math.round((strugglingWordsCount / totalWords) * 100) : 0;
  const newPct = totalWords > 0 ? Math.round((newWordsCount / totalWords) * 100) : 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[16px] shadow-2xl overflow-hidden animate-fadeIn">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-[8px] bg-[var(--bg-accent-tint)] border border-[var(--border-accent)]">
              <BarChart3 className="w-4 h-4 text-[var(--accent-ochre)]" />
            </div>
            <div>
              <h2 className="font-bold text-[15px] text-[var(--ink-primary)]">
                Learning Progress & Retention
              </h2>
              <p className="text-[11px] text-[var(--ink-muted)]">
                {totalWords} total vocabulary words in your bank
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-[6px] text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--border-subtle)]/40 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          {/* Overall mastery donut visual */}
          <div className="flex items-center gap-6 p-4 rounded-[12px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
            <div className="relative shrink-0">
              <svg width="80" height="80" viewBox="0 0 80 80">
                <circle
                  cx="40"
                  cy="40"
                  r="32"
                  fill="none"
                  stroke="var(--border-subtle)"
                  strokeWidth="9"
                />
                {masteredPct > 0 && (
                  <circle
                    cx="40"
                    cy="40"
                    r="32"
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
                <span className="text-[18px] font-bold text-[var(--accent-cypress)]">
                  {masteredPct}%
                </span>
                <span className="text-[9px] text-[var(--ink-muted)] font-semibold uppercase tracking-wide">
                  Mastered
                </span>
              </div>
            </div>

            <div className="space-y-1 min-w-0">
              <p className="text-[14px] font-bold text-[var(--ink-primary)]">Overall Retention</p>
              <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed">
                {masteredWordsCount} words mastered · {dueNowCount} scheduled for review today
              </p>
              {dueNowCount > 0 && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] border border-[var(--border-accent)]">
                  <Clock className="w-3 h-3" /> {dueNowCount} card{dueNowCount !== 1 ? 's' : ''} due now
                </span>
              )}
            </div>
          </div>

          {/* Status Progress Bars */}
          <div className="space-y-3.5">
            {/* Mastered */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 font-bold text-[var(--accent-cypress)]">
                  <Trophy className="w-3.5 h-3.5" /> Mastered
                </span>
                <span className="font-mono font-bold text-[var(--ink-secondary)]">
                  {masteredWordsCount} / {totalWords} ({masteredPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--accent-cypress)] transition-all duration-700"
                  style={{ width: `${masteredPct}%` }}
                />
              </div>
            </div>

            {/* Learning */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 font-bold text-[var(--accent-ochre)]">
                  <Sparkles className="w-3.5 h-3.5" /> Currently Learning
                </span>
                <span className="font-mono font-bold text-[var(--ink-secondary)]">
                  {learningWordsCount} / {totalWords} ({learningPct}%)
                </span>
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
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 font-bold text-[var(--accent-terracotta)]">
                  <Flame className="w-3.5 h-3.5" /> Needs Practice (Tricky)
                </span>
                <span className="font-mono font-bold text-[var(--ink-secondary)]">
                  {strugglingWordsCount} / {totalWords} ({strugglingPct}%)
                </span>
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
              <div className="flex items-center justify-between text-[12px]">
                <span className="flex items-center gap-1.5 font-bold text-[var(--ink-muted)]">
                  <BookMarked className="w-3.5 h-3.5" /> New (Untested)
                </span>
                <span className="font-mono font-bold text-[var(--ink-secondary)]">
                  {newWordsCount} / {totalWords} ({newPct}%)
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[var(--ink-muted)] transition-all duration-700"
                  style={{ width: `${newPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Stat Chips */}
          <div className="grid grid-cols-4 gap-2 pt-2 border-t border-[var(--border-subtle)]">
            <div className="text-center p-2.5 rounded-[8px] bg-[var(--accent-cypress-dim)]/40 border border-[var(--accent-cypress)]/20">
              <p className="text-[16px] font-bold text-[var(--accent-cypress)]">
                {masteredWordsCount}
              </p>
              <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">Mastered</p>
            </div>

            <div className="text-center p-2.5 rounded-[8px] bg-[var(--bg-accent-tint)] border border-[var(--border-accent)]">
              <p className="text-[16px] font-bold text-[var(--accent-ochre)]">
                {learningWordsCount}
              </p>
              <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">Learning</p>
            </div>

            <div className="text-center p-2.5 rounded-[8px] bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/20">
              <p className="text-[16px] font-bold text-[var(--accent-terracotta)]">
                {strugglingWordsCount}
              </p>
              <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">Tricky</p>
            </div>

            <div className="text-center p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <p className="text-[16px] font-bold text-[var(--ink-secondary)]">{newWordsCount}</p>
              <p className="text-[10px] text-[var(--ink-muted)] mt-0.5">New</p>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] flex justify-end">
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
