'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/context/ThemeContext';
import { useStats } from '@/context/StatsContext';
import { PasscodeLock } from '@/components/PasscodeLock';
import { Sidebar } from '@/components/layout/Sidebar';
import { WorkspaceHeader } from '@/components/layout/WorkspaceHeader';
import { BreadcrumbItem } from '@/components/ui/Breadcrumb';

const APP_PASSCODE = 'kazimuhammadibrahim5033';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const { refreshStats } = useStats();
  const {
    themeMode,
    palette,
    resolvedTheme,
    setThemeMode,
    toggleTheme,
    togglePalette,
  } = useTheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState<boolean>(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);

  useEffect(() => {
    // Check if passcode is stored
    try {
      const stored = localStorage.getItem('fasih_passcode');
      if (stored === APP_PASSCODE) {
        setIsAuthenticated(true);
        initApp();
      }
    } catch (_) {}
    setIsCheckingAuth(false);
  }, []);

  // Lock body scroll and handle Escape key when mobile menu is active
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsMobileMenuOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMobileMenuOpen]);

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

  const handleLock = () => {
    try {
      localStorage.removeItem('fasih_passcode');
    } catch (_) {}
    setIsAuthenticated(false);
  };

  if (isCheckingAuth) {
    return (
      <div suppressHydrationWarning className="min-h-screen flex items-center justify-center bg-[var(--bg-canvas)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-ochre)] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <PasscodeLock onUnlocked={handleUnlocked} />;
  }

  // Derive contextual breadcrumbs based on pathname
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    if (pathname === '/') {
      return [{ label: 'Workspace', href: '/' }, { label: 'Dashboard' }];
    }
    if (pathname.startsWith('/generate')) {
      return [{ label: 'Workspace', href: '/' }, { label: 'Learn New Words' }];
    }
    if (pathname.startsWith('/flashcards')) {
      return [{ label: 'Workspace', href: '/' }, { label: 'Practice Flashcards' }];
    }
    if (pathname.startsWith('/conversations')) {
      return [{ label: 'Workspace', href: '/' }, { label: 'Dialogues' }];
    }
    if (pathname.startsWith('/quiz') || pathname.startsWith('/test')) {
      return [{ label: 'Workspace', href: '/' }, { label: 'Quiz' }];
    }
    if (pathname.startsWith('/library')) {
      return [{ label: 'Workspace', href: '/' }, { label: 'Word Bank' }];
    }
    if (pathname.startsWith('/settings')) {
      return [{ label: 'Workspace', href: '/' }, { label: 'Preferences' }];
    }
    return [{ label: 'Workspace', href: '/' }, { label: 'Overview' }];
  };

  const isConversationsPage = pathname.startsWith('/conversations');

  return (
    <div
      className={`flex bg-[var(--bg-canvas)] text-[var(--ink-primary)] selection:bg-[var(--accent-ochre)] selection:text-white font-sans ${
        isConversationsPage ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block h-screen sticky top-0 shrink-0">
        <Sidebar
          theme={resolvedTheme}
          themeMode={themeMode}
          palette={palette}
          onSelectTheme={setThemeMode}
          onToggleTheme={toggleTheme}
          onTogglePalette={togglePalette}
          onLockApp={handleLock}
        />
      </div>

      {/* Mobile Drawer Overlay with smooth fade */}
      <div
        className={`fixed inset-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${
          isMobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMobileMenuOpen}
      >
        {/* Backdrop overlay */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 ease-in-out"
          onClick={() => setIsMobileMenuOpen(false)}
        />

        {/* Sliding Sidebar Drawer with smooth slide-in / slide-out */}
        <div
          className={`relative z-10 w-[260px] max-w-[85vw] h-full shadow-2xl transform transition-transform duration-300 ease-out will-change-transform flex ${
            isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <Sidebar
            className="w-full h-full border-r border-[var(--border-subtle)]"
            onCloseMobile={() => setIsMobileMenuOpen(false)}
            theme={resolvedTheme}
            themeMode={themeMode}
            palette={palette}
            onSelectTheme={setThemeMode}
            onToggleTheme={toggleTheme}
            onTogglePalette={togglePalette}
            onLockApp={handleLock}
          />
        </div>
      </div>

      {/* Main Workspace Column */}
      <div
        className={`flex-1 flex flex-col min-w-0 ${
          isConversationsPage ? 'h-screen overflow-hidden' : 'min-h-screen'
        }`}
      >
        <WorkspaceHeader
          breadcrumbs={getBreadcrumbs()}
          onOpenMobileSidebar={() => setIsMobileMenuOpen(true)}
          audioActive={isAudioEnabled}
          onToggleAudio={() => setIsAudioEnabled((prev) => !prev)}
        />

        {/* Content canvas: full height minus header (56px mobile / 72px desktop) for conversations */}
        <main
          className={`flex-1 min-h-0 flex flex-col ${
            isConversationsPage ? 'h-[calc(100vh-56px)] sm:h-[calc(100vh-72px)] overflow-hidden' : ''
          }`}
        >
          {children}
        </main>
      </div>
    </div>
  );
};
