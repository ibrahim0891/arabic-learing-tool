'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Library,
  MessageSquare,
  Sun,
  Moon,
  Settings,
  LogOut
} from 'lucide-react';
import { useStats } from '@/context/StatsContext';
import { PasscodeLock } from '@/components/PasscodeLock';

const APP_PASSCODE = 'kazimuhammadibrahim5033';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { stats, refreshStats } = useStats();
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);

  useEffect(() => {
    // Check if passcode is stored
    try {
      const stored = localStorage.getItem('fasih_passcode');
      if (stored === APP_PASSCODE) {
        setIsAuthenticated(true);
        initApp();
      }
      const savedTheme = localStorage.getItem('fasih_theme') as 'dark' | 'light' | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.setAttribute('data-theme', savedTheme);
      }
    } catch (_) {}
    setIsCheckingAuth(false);
  }, []);

  const handleUnlocked = () => {
    setIsAuthenticated(true);
    initApp();
  };

  const initApp = async () => {
    try {
      await fetch('/api/seed', { method: 'POST' });
      refreshStats();
    } catch (err) {
      console.error(err);
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    try {
      localStorage.setItem('fasih_theme', nextTheme);
    } catch (_) {}
  };

  const handleLock = () => {
    try {
      localStorage.removeItem('fasih_passcode');
    } catch (_) {}
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-ochre)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasscodeLock onUnlocked={handleUnlocked} />;
  }

  const isHomeActive = pathname === '/';
  const isGenerateActive = pathname.startsWith('/generate');
  const isFlashcardsActive = pathname.startsWith('/flashcards');
  const isQuizActive = pathname.startsWith('/quiz') || pathname.startsWith('/test');
  const isLibraryActive = pathname.startsWith('/library');
  const isSettingsActive = pathname.startsWith('/settings');
  const isConversationsPage = pathname.startsWith('/conversations');

  return (
    <div className={`${isConversationsPage ? 'h-screen overflow-hidden' : 'min-h-screen'} flex flex-col bg-[var(--bg-primary)] text-[var(--ink-primary)]`}>
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-[var(--bg-primary)]/90 backdrop-blur-md shrink-0">
        <div className="container-max flex h-16 items-center justify-between">
          {/* Logo Brand */}
          <Link
            href="/"
            className="flex items-center gap-3 cursor-pointer group select-none no-underline"
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
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold">
            <Link
              href="/"
              className={`transition-colors relative py-1.5 flex items-center gap-1.5 no-underline ${
                isHomeActive
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              Home
            </Link>

            <Link
              href="/generate"
              className={`transition-colors relative py-1.5 flex items-center gap-1.5 no-underline ${
                isGenerateActive
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[var(--accent-ochre)]" /> Learn New Words
            </Link>

            <Link
              href="/flashcards"
              className={`transition-colors relative py-1.5 flex items-center gap-1.5 no-underline ${
                isFlashcardsActive
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" /> Practice Flashcards
            </Link>

            <Link
              href="/conversations"
              className={`transition-colors relative py-1.5 flex items-center gap-1.5 no-underline ${
                pathname.startsWith('/conversations')
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Dialogues
            </Link>

            <Link
              href="/quiz"
              className={`transition-colors relative py-1.5 flex items-center gap-1.5 no-underline ${
                isQuizActive
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" /> Take a Quiz
            </Link>

            <Link
              href="/library"
              className={`transition-colors relative py-1.5 flex items-center gap-1.5 no-underline ${
                isLibraryActive
                  ? 'text-[var(--accent-ochre)] border-b-2 border-[var(--accent-ochre)]'
                  : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
              }`}
            >
              <Library className="w-3.5 h-3.5" /> Word Bank ({stats?.totalWords || 0})
            </Link>
          </nav>

          {/* Settings & Theme Switch */}
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className={`p-2 rounded-lg transition cursor-pointer no-underline ${
                isSettingsActive
                  ? 'bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--accent-ochre-dim)]'
              }`}
              title="Settings & Reset"
              aria-label="Settings"
            >
              <Settings className="w-4 h-4" />
            </Link>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--accent-ochre-dim)] transition cursor-pointer"
              title="Switch light / dark mode"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-[var(--accent-ochre)]" /> : <Moon className="w-4 h-4" />}
            </button>

            <button
              onClick={handleLock}
              className="p-2 rounded-lg text-[var(--ink-muted)] hover:text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)]/10 transition cursor-pointer"
              title="Lock App"
              aria-label="Lock App"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden flex items-center justify-around border-t border-[var(--border-subtle)] py-2.5 px-2 text-xs font-semibold">
          <Link
            href="/"
            className={`no-underline ${isHomeActive ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}`}
          >
            Home
          </Link>
          <Link
            href="/generate"
            className={`no-underline ${isGenerateActive ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}`}
          >
            Learn
          </Link>
          <Link
            href="/flashcards"
            className={`no-underline ${isFlashcardsActive ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}`}
          >
            Cards
          </Link>
          <Link
            href="/conversations"
            className={`no-underline ${pathname.startsWith('/conversations') ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}`}
          >
            Dialogues
          </Link>
          <Link
            href="/quiz"
            className={`no-underline ${isQuizActive ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}`}
          >
            Quiz
          </Link>
          <Link
            href="/library"
            className={`no-underline ${isLibraryActive ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}`}
          >
            Bank
          </Link>
          <Link
            href="/settings"
            className={`no-underline ${isSettingsActive ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}`}
          >
            Settings
          </Link>
        </div>
      </header>

      {/* Main Viewport */}
      <main className={`flex-1 min-h-0 w-full ${isConversationsPage ? 'p-0 flex flex-col overflow-hidden' : 'container-max py-8 sm:py-10'}`}>
        {children}
      </main>

      {/* Footer (hidden on conversations view for full-height WhatsApp/Messenger experience) */}
      {!isConversationsPage && (
        <footer className="border-t border-[var(--border-subtle)] py-6 mt-12 text-center text-xs text-[var(--ink-muted)]">
          <div className="container-max flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-arabic text-base text-[var(--accent-ochre)]">فَصِيح</span>
              <span>• Focused Arabic Vocabulary Practice</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <span>Spaced Repetition (SM-2)</span>
              <span>•</span>
              <Link href="/settings" className="hover:text-[var(--accent-ochre)] transition-colors no-underline">
                Settings & Reset
              </Link>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
};
