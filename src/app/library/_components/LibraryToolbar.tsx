'use client';

import React from 'react';
import { Search, X, BookOpen, LayoutGrid, List } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export interface TabCounts {
  all: number;
  new: number;
  learning: number;
  struggling: number;
  mastered: number;
}

interface LibraryToolbarProps {
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
  tabCounts: TabCounts;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  topicFilter: string;
  onTopicFilterChange: (topic: string) => void;
  viewMode: 'cards' | 'table';
  onViewModeChange: (mode: 'cards' | 'table') => void;
  onStartFlashcards: () => void;
  practiceDeckCount: number;
}

const STATUS_TABS = [
  { key: 'all', label: 'All', dotColor: '' },
  { key: 'new', label: 'New', dotColor: 'bg-[var(--ink-muted)]' },
  { key: 'learning', label: 'Learning', dotColor: 'bg-[var(--accent-cypress)]' },
  { key: 'struggling', label: 'Needs Practice', dotColor: 'bg-[var(--accent-terracotta)]' },
  { key: 'mastered', label: 'Mastered', dotColor: 'bg-[var(--accent-ochre)]' },
] as const;

export const LibraryToolbar: React.FC<LibraryToolbarProps> = ({
  statusFilter,
  onStatusFilterChange,
  tabCounts,
  searchQuery,
  onSearchQueryChange,
  topicFilter,
  onTopicFilterChange,
  viewMode,
  onViewModeChange,
  onStartFlashcards,
  practiceDeckCount,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-2 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xs">
      {/* Left: Status Filter Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map((tab) => {
          const isActive = statusFilter === tab.key;
          const count = tabCounts[tab.key] || 0;

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onStatusFilterChange(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] font-semibold whitespace-nowrap transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-[var(--accent-ochre)] text-white shadow-xs'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)]'
              }`}
            >
              {tab.dotColor && !isActive && (
                <span className={`w-2 h-2 rounded-full shrink-0 ${tab.dotColor}`} />
              )}
              <span>{tab.label}</span>
              <span
                className={`min-w-[18px] text-center px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-[var(--border-subtle)] text-[var(--ink-muted)]'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right side: Search, Topic dropdown, View Mode toggle, Practice Deck button */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
        {/* Search Input */}
        <div className="relative w-full sm:w-48">
          <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search Arabic, English..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full pl-8 pr-7 py-1.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[12px] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] focus:ring-1 focus:ring-[var(--accent-ochre)] transition"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--ink-muted)] hover:text-[var(--ink-primary)] cursor-pointer"
              title="Clear search"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Topic Filter */}
        <div className="w-28 sm:w-32 shrink-0 relative">
          <select
            value={topicFilter}
            onChange={(e) => onTopicFilterChange(e.target.value)}
            className="w-full px-2.5 py-1.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[12px] font-medium focus:outline-none focus:border-[var(--accent-ochre)] cursor-pointer appearance-none pr-6"
          >
            <option value="all">All Topics</option>
            <option value="daily life">Daily Life</option>
            <option value="food">Food & Dining</option>
            <option value="travel">Travel</option>
            <option value="technology">Technology</option>
            <option value="work">Work & School</option>
            <option value="emotions">Feelings</option>
          </select>
          <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--ink-muted)] text-[9px]">
            ▼
          </div>
        </div>

        {/* View Mode Toggle (Cards vs Table) */}
        <div className="flex items-center rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-0.5 shrink-0">
          <button
            type="button"
            onClick={() => onViewModeChange('cards')}
            className={`p-1.5 rounded-[6px] transition cursor-pointer ${
              viewMode === 'cards'
                ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] shadow-2xs font-bold'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
            title="Card View"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            className={`p-1.5 rounded-[6px] transition cursor-pointer ${
              viewMode === 'table'
                ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] shadow-2xs font-bold'
                : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'
            }`}
            title="Table View"
          >
            <List className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Practice Deck Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={onStartFlashcards}
          disabled={practiceDeckCount === 0}
          leftIcon={<BookOpen className="w-3.5 h-3.5" />}
          className="shrink-0 whitespace-nowrap !border-[var(--accent-ochre)]/40 hover:!bg-[var(--bg-accent-tint)] hover:!text-[var(--accent-ochre)]"
          title="Practice words in flashcards without affecting memory status"
        >
          Practice Deck ({practiceDeckCount})
        </Button>
      </div>
    </div>
  );
};
