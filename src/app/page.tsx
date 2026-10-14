'use client';

import React, { useState, useEffect } from 'react';
import {
  Compass,
  Sparkles,
  BookOpen,
  GraduationCap,
  Library,
  Sun,
  Moon,
  Settings
} from 'lucide-react';
import { DashboardStats } from '@/lib/types';
import { DashboardView } from '@/components/DashboardView';
import { WordGeneratorView } from '@/components/WordGeneratorView';
import { FlashcardStudyView } from '@/components/FlashcardStudyView';
import { TestGeneratorView } from '@/components/TestGeneratorView';
import { VocabularyLibraryView } from '@/components/VocabularyLibraryView';
import { SettingsView } from '@/components/SettingsView';

type ViewMode = 'dashboard' | 'generate' | 'flashcards' | 'test' | 'library' | 'settings';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [flashcardFilter, setFlashcardFilter] = useState<string>('all');
  const [testFilter, setTestFilter] = useState<string>('all');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');

  useEffect(() => {
    initApp();
  }, []);

  const initApp = async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
      fetchStats();
    } catch (err) {
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md">
        <div className="container-max flex h-16 items-center justify-between">
          {/* Logo Brand */}
          <div
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-9 h-9 rounded-lg bg-[var(--accent-ochre)] text-[#121316] font-bold flex items-center justify-center text-lg font-arabic leading-none shadow-sm group-hover:scale-105 transition-transform">
              ف
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="editorial-title text-base font-semibold text-[var(--ink-primary)] tracking-tight">
                  Fasīh • <span className="font-arabic font-normal text-lg text-[var(--accent-ochre)]">فَصِيح</span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[var(--ink-muted)] block">
                Your Arabic Vocabulary Coach
              </span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`cursor-pointer transition-colors relative py-1.5 flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              Home
            </button>

            <button
              onClick={() => setCurrentView('generate')}
              className={`cursor-pointer transition-colors relative py-1.5 flex items-center gap-1.5 ${
                currentView === 'generate'
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-ochre)]" /> Learn New Words
            </button>

            <button
              onClick={() => {
                setFlashcardFilter('all');
                setCurrentView('flashcards');
              }}
              className={`cursor-pointer transition-colors relative py-1.5 flex items-center gap-1.5 ${
                currentView === 'flashcards'
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Practice Flashcards
            </button>

            <button
              onClick={() => {
                setTestFilter('all');
                setCurrentView('test');
              }}
              className={`cursor-pointer transition-colors relative py-1.5 flex items-center gap-1.5 ${
                currentView === 'test'
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Take a Quiz
            </button>

            <button
              onClick={() => setCurrentView('library')}
              className={`cursor-pointer transition-colors relative py-1.5 flex items-center gap-1.5 ${
                currentView === 'library'
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <Library className="w-3.5 h-3.5" /> Word Bank ({stats?.totalWords || 0})
            </button>
          </nav>

          {/* Settings & Theme Switch */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentView('settings')}
              className={`p-2 rounded-lg transition cursor-pointer ${
                currentView === 'settings'
                  ? 'bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--accent-ochre-dim)]'
              }`}
              title="Settings & Reset"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--accent-ochre-dim)] transition cursor-pointer"
              title="Switch light / dark mode"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--accent-ochre)]" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden flex items-center justify-around border-t border-[var(--border-subtle)] py-2.5 px-2 text-xs font-semibold">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={currentView === 'dashboard' ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}
          >
            Home
          </button>
          <button
            onClick={() => setCurrentView('generate')}
            className={currentView === 'generate' ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}
          >
            Learn
          </button>
          <button
            onClick={() => {
              setFlashcardFilter('all');
              setCurrentView('flashcards');
            }}
            className={currentView === 'flashcards' ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}
          >
            Cards
          </button>
          <button
            onClick={() => {
              setTestFilter('all');
              setCurrentView('test');
            }}
            className={currentView === 'test' ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}
          >
            Quiz
          </button>
          <button
            onClick={() => setCurrentView('library')}
            className={currentView === 'library' ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}
          >
            Bank
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            className={currentView === 'settings' ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}
          >
            Settings
          </button>
        </div>
      </header>

      {/* Main Viewport */}
      <main className="flex-1 container-max py-8 sm:py-10">
        {currentView === 'dashboard' && (
          <DashboardView
            stats={stats}
            onNavigate={(view) => setCurrentView(view)}
            onQuickStudy={(f) => {
              setFlashcardFilter(f || 'all');
              setCurrentView('flashcards');
            }}
            onQuickTest={(f) => {
              setTestFilter(f || 'all');
              setCurrentView('test');
            }}
          />
        )}

        {currentView === 'generate' && (
          <WordGeneratorView
            onSavedSuccess={() => fetchStats()}
            onNavigateToStudy={() => {
              setFlashcardFilter('all');
              setCurrentView('flashcards');
            }}
          />
        )}

        {currentView === 'flashcards' && (
          <FlashcardStudyView
            initialFilter={flashcardFilter}
            onSessionComplete={() => fetchStats()}
          />
        )}

        {currentView === 'test' && (
          <TestGeneratorView
            initialFilter={testFilter}
            onTestComplete={() => fetchStats()}
          />
        )}

        {currentView === 'library' && (
          <VocabularyLibraryView
            onWordCountChange={() => fetchStats()}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            onResetCompleted={() => fetchStats()}
            onNavigateHome={() => setCurrentView('dashboard')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--border-subtle)] py-6 mt-12 text-center text-xs text-[var(--ink-muted)]">
        <p className="font-serif text-sm text-[var(--ink-secondary)] mb-1">
          Fasīh (فَصِيح) — Learn Arabic step-by-step with real-life vocabulary
        </p>
        <p className="text-[11px]">
          Smart Spaced Repetition • Clear Pronunciation & Diacritics
        </p>
      </footer>
    </div>
  );
}
