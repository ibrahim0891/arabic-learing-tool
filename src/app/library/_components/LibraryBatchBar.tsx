'use client';

import React from 'react';
import { CheckSquare, Square, CheckCircle2, BookOpen, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface LibraryBatchBarProps {
  totalVisible: number;
  totalAll: number;
  selectedCount: number;
  onToggleSelectAll: () => void;
  onClearSelection: () => void;
  onBatchStatusUpdate: (status: 'mastered' | 'learning') => void;
  onBatchDeleteClick: () => void;
  isUpdatingStatus: boolean;
}

export const LibraryBatchBar: React.FC<LibraryBatchBarProps> = ({
  totalVisible,
  totalAll,
  selectedCount,
  onToggleSelectAll,
  onClearSelection,
  onBatchStatusUpdate,
  onBatchDeleteClick,
  isUpdatingStatus,
}) => {
  if (totalVisible === 0) return null;

  if (selectedCount > 0) {
    return (
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 p-3 sm:px-4 sm:py-2.5 bg-[var(--bg-accent-tint)] border border-[var(--border-accent)] rounded-[10px] text-[12px] animate-fadeIn shadow-2xs w-full min-w-0">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            type="button"
            onClick={onToggleSelectAll}
            className="flex items-center gap-2 font-bold text-[var(--accent-ochre)] cursor-pointer select-none"
          >
            <CheckSquare className="w-4 h-4 text-[var(--accent-ochre)]" />
            <span>
              {selectedCount} of {totalVisible} selected
            </span>
          </button>

          <button
            type="button"
            onClick={onClearSelection}
            className="text-[11px] underline text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer"
          >
            Clear selection
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => onBatchStatusUpdate('mastered')}
            disabled={isUpdatingStatus}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-bold text-white bg-[var(--accent-cypress)] hover:opacity-95 transition cursor-pointer shadow-xs disabled:opacity-50"
            title="Mark selected words as Mastered"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Mark as Mastered ({selectedCount})</span>
          </button>

          <button
            type="button"
            onClick={() => onBatchStatusUpdate('learning')}
            disabled={isUpdatingStatus}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-semibold text-[var(--ink-primary)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)] transition cursor-pointer disabled:opacity-50"
            title="Mark selected words as Learning"
          >
            <span>To Learning</span>
          </button>

          <button
            type="button"
            onClick={onBatchDeleteClick}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-[6px] text-[11px] font-semibold text-white bg-[var(--accent-terracotta)] hover:opacity-95 transition cursor-pointer shadow-xs"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-2 py-0.5 text-[12px] text-[var(--ink-muted)]">
      <button
        type="button"
        onClick={onToggleSelectAll}
        className="flex items-center gap-1.5 font-medium hover:text-[var(--ink-primary)] cursor-pointer transition select-none"
      >
        <Square className="w-3.5 h-3.5" />
        <span>Select All ({totalVisible})</span>
      </button>

      <span className="text-[11px]">
        Showing {totalVisible} of {totalAll} words
      </span>
    </div>
  );
};
