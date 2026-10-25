'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  BookOpen,
  Layers,
  MessageSquare,
  ClipboardCheck,
  Library,
  Settings,
  Sun,
  Moon,
  Monitor,
  Leaf,
  LogOut,
  X
} from 'lucide-react';
import { SidebarNavItem } from './SidebarNavItem';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useStats } from '@/context/StatsContext';
import { ThemeMode, ThemePalette } from '@/context/ThemeContext';

interface SidebarProps {
  onCloseMobile?: () => void;
  onLockApp?: () => void;
  theme?: 'dark' | 'light';
  themeMode?: ThemeMode;
  palette?: ThemePalette;
  onToggleTheme?: () => void;
  onSelectTheme?: (mode: ThemeMode) => void;
  onTogglePalette?: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onCloseMobile,
  onLockApp,
  theme = 'light',
  themeMode = 'system',
  palette = 'classic',
  onToggleTheme,
  onSelectTheme,
  onTogglePalette,
  className = '',
}) => {
  const pathname = usePathname();
  const { stats } = useStats();

  const isHome = pathname === '/';
  const isGenerate = pathname.startsWith('/generate');
  const isFlashcards = pathname.startsWith('/flashcards');
  const isConversations = pathname.startsWith('/conversations');
  const isQuiz = pathname.startsWith('/quiz') || pathname.startsWith('/test');
  const isLibrary = pathname.startsWith('/library');
  const isSettings = pathname.startsWith('/settings');

  // Daily goal calculation
  const dailyGoal = stats?.dailyGoal || 10;
  const todayStudied = stats?.todayStudiedCount || 0;
  const goalProgress = Math.min(100, Math.round((todayStudied / dailyGoal) * 100));
  const wordsRemaining = Math.max(0, dailyGoal - todayStudied);

  return (
    <aside
      className={`h-full flex flex-col overflow-y-auto overscroll-contain p-[28px_16px_24px] gap-[24px] bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] shrink-0 select-none [scrollbar-width:thin] [scrollbar-color:var(--border-subtle)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--border-subtle)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent ${
        className || 'w-[224px]'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col gap-[28px] shrink-0">
        {/* Brand identity & mobile close button */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-[12px] px-3 no-underline group"
          >
            {/* Brand mark */}
            <div className="w-[42px] h-[44px] rounded-[10px] bg-[var(--bg-accent-tint)] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <span className="font-arabic text-[27px] leading-[45px] text-[var(--accent-ochre)] font-semibold">
                م
              </span>
            </div>

            {/* Brand label */}
            <div className="flex flex-col justify-center">
              <span className="font-sans text-[20px] leading-[26px] font-bold text-[var(--ink-primary)] tracking-tight">
                Al-Muʿallim
              </span>
            </div>
          </Link>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-[8px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer mr-1"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex flex-col gap-[4px]">
          <div className="px-3 pb-2">
            <span className="font-sans text-[10px] font-semibold text-[var(--ink-muted)] tracking-wider uppercase">
              Workspace
            </span>
          </div>

          <SidebarNavItem
            href="/"
            icon={<Home className="w-[18px] h-[18px]" />}
            label="Home"
            isActive={isHome}
            onClick={onCloseMobile}
          />
          <SidebarNavItem
            href="/generate"
            icon={<BookOpen className="w-[18px] h-[18px]" />}
            label="Learn New Words"
            isActive={isGenerate}
            onClick={onCloseMobile}
          />
          <SidebarNavItem
            href="/flashcards"
            icon={<Layers className="w-[18px] h-[18px]" />}
            label="Practice Flashcards"
            isActive={isFlashcards}
            badge={stats?.readyForRevision ? stats.readyForRevision : undefined}
            onClick={onCloseMobile}
          />
          <SidebarNavItem
            href="/conversations"
            icon={<MessageSquare className="w-[18px] h-[18px]" />}
            label="Dialogues"
            isActive={isConversations}
            onClick={onCloseMobile}
          />
          <SidebarNavItem
            href="/quiz"
            icon={<ClipboardCheck className="w-[18px] h-[18px]" />}
            label="Take a Quiz"
            isActive={isQuiz}
            onClick={onCloseMobile}
          />
          <SidebarNavItem
            href="/library"
            icon={<Library className="w-[18px] h-[18px]" />}
            label="Word Bank"
            isActive={isLibrary}
            badge={stats?.totalWords || 0}
            onClick={onCloseMobile}
          />
        </div>
      </div>

      {/* Bottom Section */}
      <div className="flex flex-col gap-[16px] shrink-0 mt-auto pt-2">
        {/* Daily goal widget */}
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[12px] p-[15px] flex flex-col gap-[10px] shadow-2xs">
          <div className="flex items-center justify-between text-[12px] leading-[18px]">
            <span className="font-semibold text-[var(--ink-primary)]">Today's goal</span>
            <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
              {todayStudied} / {dailyGoal}
            </span>
          </div>

          <ProgressBar value={goalProgress} />

          <span className="text-[11px] leading-[16px] text-[var(--ink-secondary)]">
            {goalProgress >= 100
              ? '🎉 Daily goal achieved!'
              : `${wordsRemaining} new words to go`}
          </span>
        </div>

        {/* Preferences & Quick actions */}
        <div className="flex items-center justify-between px-3 pt-1 border-t border-[var(--border-subtle)]/60">
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className={`flex items-center gap-[11px] text-[12px] leading-[18px] no-underline transition-colors ${
              isSettings
                ? 'text-[var(--accent-ochre)] font-semibold'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
            }`}
          >
            <Settings className="w-[18px] h-[18px]" />
            <span>Preferences</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Palette toggle: Classic Ochre vs Grass Green */}
            {onTogglePalette && (
              <button
                type="button"
                onClick={onTogglePalette}
                className={`p-1.5 rounded-[6px] transition-all cursor-pointer ${
                  palette === 'grass'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 shadow-2xs'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] border border-transparent'
                }`}
                title={palette === 'grass' ? 'Grass Green active (Click for Classic)' : 'Switch to Grass Green theme'}
                aria-label="Toggle Grass Green theme"
              >
                <Leaf className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Theme mode options: Light, Dark, System OS Sync */}
            <div className="flex items-center p-0.5 rounded-[7px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => (onSelectTheme ? onSelectTheme('light') : onToggleTheme?.())}
                className={`p-1 rounded-[5px] transition-all cursor-pointer ${
                  (themeMode ? themeMode === 'light' : theme === 'light')
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] shadow-2xs font-semibold'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
                title="Light mode"
                aria-label="Light mode"
              >
                <Sun className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => (onSelectTheme ? onSelectTheme('dark') : onToggleTheme?.())}
                className={`p-1 rounded-[5px] transition-all cursor-pointer ${
                  (themeMode ? themeMode === 'dark' : theme === 'dark')
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] shadow-2xs font-semibold'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
                title="Dark mode"
                aria-label="Dark mode"
              >
                <Moon className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => (onSelectTheme ? onSelectTheme('system') : onToggleTheme?.())}
                className={`p-1 rounded-[5px] transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] shadow-2xs font-semibold'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                }`}
                title="Sync with OS theme automatically"
                aria-label="Sync with OS theme automatically"
              >
                <Monitor className="w-3.5 h-3.5" />
              </button>
            </div>

            {onLockApp && (
              <button
                onClick={onLockApp}
                className="p-1.5 rounded-[6px] text-[var(--ink-secondary)] hover:text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)]/10 transition-colors cursor-pointer"
                title="Lock Application"
                aria-label="Lock App"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
