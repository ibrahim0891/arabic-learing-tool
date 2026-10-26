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
  Droplet,
  Palette,
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
      className={`h-full flex flex-col overflow-y-auto overscroll-contain p-[24px_16px_20px] gap-[20px] bg-[var(--bg-sidebar)] border-r border-[var(--border-subtle)] shrink-0 select-none [scrollbar-width:thin] [scrollbar-color:var(--border-subtle)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-[var(--border-subtle)] [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent ${
        className || 'w-[250px]'
      }`}
    >
      {/* Top Section */}
      <div className="flex flex-col gap-[28px] shrink-0">
        {/* Brand identity & mobile close button */}
        <div className="flex items-center justify-between px-1">
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-[10px] no-underline group"
          >
            {/* Brand mark */}
            <div className="w-[38px] h-[40px] rounded-[10px] bg-[var(--bg-accent-tint)] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <span className="font-arabic text-[24px] leading-[40px] text-[var(--accent-ochre)] font-semibold">
                م
              </span>
            </div>

            {/* Brand label */}
            <div className="flex flex-col justify-center">
              <span className="font-sans text-[17px] leading-[22px] font-bold text-[var(--ink-primary)] tracking-tight whitespace-nowrap">
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
        <div className="flex flex-col gap-[3px]">
          <div className="px-2.5 pb-1.5">
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
        <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-[12px] p-[12px_14px] flex flex-col gap-[8px] shadow-2xs">
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
        <div className="flex items-center justify-between px-2 pt-1 border-t border-[var(--border-subtle)]/60">
          <Link
            href="/settings"
            onClick={onCloseMobile}
            className={`flex items-center gap-[9px] text-[12px] leading-[18px] no-underline transition-colors ${
              isSettings
                ? 'text-[var(--accent-ochre)] font-semibold'
                : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
            }`}
          >
            <Settings className="w-[16px] h-[16px]" />
            <span>Preferences</span>
          </Link>

          <div className="flex items-center gap-1.5">
            {/* Palette cycler: Classic Ochre → Grass Green → Crimson → Classic Ochre */}
            {onTogglePalette && (
              <button
                type="button"
                onClick={onTogglePalette}
                className={`p-1.5 rounded-[6px] transition-all cursor-pointer border ${
                  palette === 'grass'
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border-emerald-500/30 shadow-2xs'
                    : palette === 'crimson'
                      ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 font-bold border-rose-500/30 shadow-2xs'
                      : 'bg-amber-500/15 text-amber-700 dark:text-amber-400 font-bold border-amber-500/30 shadow-2xs'
                }`}
                title={`Palette: ${
                  palette === 'grass'
                    ? 'Grass Green (click for Crimson)'
                    : palette === 'crimson'
                      ? 'Crimson (click for Classic Ochre)'
                      : 'Classic Ochre (click for Grass Green)'
                }`}
                aria-label="Cycle color palette (Classic Ochre, Grass Green, Crimson)"
              >
                {palette === 'grass' ? (
                  <Leaf className="w-3.5 h-3.5" />
                ) : palette === 'crimson' ? (
                  <Droplet className="w-3.5 h-3.5" />
                ) : (
                  <Palette className="w-3.5 h-3.5" />
                )}
              </button>
            )}

            {/* Theme mode cycler: Light → Dark → System */}
            {onSelectTheme && (
              <button
                type="button"
                onClick={() => {
                  const nextMode: ThemeMode =
                    themeMode === 'system' ? 'light' : themeMode === 'light' ? 'dark' : 'system';
                  onSelectTheme(nextMode);
                }}
                className={`p-1.5 rounded-[6px] transition-all cursor-pointer border ${
                  themeMode === 'system'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] border-[var(--border-subtle)] shadow-2xs font-semibold'
                    : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] border-transparent'
                }`}
                title={`Theme: ${themeMode === 'system' ? 'Sync with OS (click for Light)' : themeMode === 'light' ? 'Light mode (click for Dark)' : 'Dark mode (click for System)'}`}
                aria-label="Cycle theme mode (Light, Dark, System)"
              >
                {themeMode === 'light' ? (
                  <Sun className="w-3.5 h-3.5" />
                ) : themeMode === 'dark' ? (
                  <Moon className="w-3.5 h-3.5" />
                ) : (
                  <Monitor className="w-3.5 h-3.5" />
                )}
              </button>
            )}

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
