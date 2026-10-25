'use client';

import React, { useState } from 'react';
import { SettingsHeader } from '../_components/SettingsHeader';
import { SettingsOptionCard } from '../_components/SettingsOptionCard';
import { SettingsConfirmModal } from '../_components/SettingsConfirmModal';
import { Button } from '@/components/ui/Button';
import {
  RotateCcw,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Palette,
  Sun,
  Moon,
  Monitor,
  Leaf,
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';

interface SettingsWorkspaceProps {
  onResetCompleted?: () => void;
  onNavigateHome?: () => void;
}

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
  onResetCompleted,
  onNavigateHome,
}) => {
  const { themeMode, setThemeMode, palette, setPalette } = useTheme();
  const [isResetting, setIsResetting] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<'progress' | 'all' | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleReset = async (action: 'reset_progress_only' | 'reset_all') => {
    setIsResetting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to complete reset');
      }

      const data = await res.json();
      setMessage({ text: data.message, type: 'success' });
      setConfirmDialog(null);
      if (onResetCompleted) onResetCompleted();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error executing reset', type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  const handleRestoreStarterWords = async () => {
    setIsResetting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Failed to seed starter vocabulary');
      setMessage({
        text: 'Starter vocabulary restored successfully! Everyday foundation words are now available in your Word Bank.',
        type: 'success',
      });
      if (onResetCompleted) onResetCompleted();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error restoring starter words', type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* 1. Header */}
      <SettingsHeader />

      {/* 2. Feedback Notification Banner */}
      {message && (
        <div
          className={`p-4 rounded-[10px] text-[13px] flex items-center gap-3 border animate-fadeIn ${
            message.type === 'success'
              ? 'bg-[var(--accent-cypress-dim)]/40 border-[var(--accent-cypress)]/30 text-[var(--accent-cypress)]'
              : 'bg-[var(--accent-terracotta)]/15 border-[var(--accent-terracotta)]/30 text-[var(--accent-terracotta)]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 stroke-[2.5]" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0 stroke-[2.5]" />
          )}
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* 3. Settings Cards */}
      <div className="space-y-4">
        {/* Appearance & Theme Setting */}
        <div className="p-4 sm:p-5 rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex flex-col gap-4 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-9 h-9 rounded-[10px] bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] flex items-center justify-center shrink-0">
                <Palette className="w-4 h-4" />
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-[14px] text-[var(--ink-primary)]">Interface Theme & Palette</h3>
                  <span dir="rtl" className="font-arabic text-[13px] text-[var(--accent-ochre)] font-bold">مَظْهَرُ التَّطْبِيق</span>
                </div>
                <p className="text-[12px] text-[var(--ink-secondary)] leading-relaxed">
                  Customize your workspace color palette and illumination mode. Both Classic Ochre and Grass Green adapt seamlessly across Light and Dark variations.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[var(--border-subtle)]/70 flex flex-col md:flex-row md:items-center justify-between gap-3.5">
            {/* Color Palette Choice */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Palette:</span>
              <div className="flex items-center p-1 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setPalette('classic')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                    palette === 'classic'
                      ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] font-semibold shadow-xs'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#A46518] shrink-0" />
                  <span>Classic Ochre</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPalette('grass')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                    palette === 'grass'
                      ? 'bg-[var(--bg-surface)] text-emerald-600 dark:text-emerald-400 font-semibold shadow-xs'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-[#2E8B57] shrink-0" />
                  <Leaf className="w-3.5 h-3.5" />
                  <span>Grass Green</span>
                </button>
              </div>
            </div>

            {/* Mode Choice (Light, Dark, OS Sync) */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Mode:</span>
              <div className="flex items-center p-1 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setThemeMode('light')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] font-semibold shadow-xs'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>Light</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode('dark')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] font-semibold shadow-xs'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <Moon className="w-3.5 h-3.5" />
                  <span>Dark</span>
                </button>

                <button
                  type="button"
                  onClick={() => setThemeMode('system')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-all cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-[var(--bg-surface)] text-[var(--accent-ochre)] font-semibold shadow-xs'
                      : 'text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Sync with OS</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Option 1: Reset Study Progress Only */}
        <SettingsOptionCard
          title="Reset Progress & Quiz History"
          arabic="إِعَادَةُ ضَبْطِ التَّقَدُّم"
          badge={{ label: 'Safe Reset', variant: 'neutral' }}
          icon={<RotateCcw className="w-4 h-4" />}
          description={
            <>
              Clears your test scores, mistake logs, and resets all saved words back to the "New Word" status. <strong className="text-[var(--ink-primary)]">Your saved words, custom examples, and topic sets are kept safely.</strong>
            </>
          }
          actionButton={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmDialog('progress')}
              disabled={isResetting}
            >
              Reset Progress Only
            </Button>
          }
        />

        {/* Option 2: Restore Default Starter Vocabulary */}
        <SettingsOptionCard
          title="Restore Starter Vocabulary"
          arabic="اسْتِعَادَةُ الكَلِمَاتِ الأَسَاسِيَّة"
          badge={{ label: 'Recommended for Beginners', variant: 'ochre' }}
          icon={<Sparkles className="w-4 h-4" />}
          description={
            <>
              Populates your vocabulary bank with core foundation words (e.g., book, read, library, friend, beautiful) including complete diacritics, root analysis, and situational example sentences.
            </>
          }
          actionButton={
            <Button
              variant="primary"
              size="sm"
              onClick={handleRestoreStarterWords}
              isLoading={isResetting}
            >
              Restore Starter Set
            </Button>
          }
        />

        {/* Option 3: Wipe Everything (Factory Reset) */}
        <SettingsOptionCard
          title="Wipe Everything (Factory Reset)"
          arabic="حَذْفُ جَمِيعِ البَيَانَات"
          badge={{ label: 'Danger Zone', variant: 'danger' }}
          icon={<Trash2 className="w-4 h-4" />}
          isDanger={true}
          description={
            <>
              Permanently deletes <strong className="text-[var(--accent-terracotta)]">all saved vocabulary, generated collections, study sessions, and test history</strong> from your database. This action is irreversible.
            </>
          }
          actionButton={
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDialog('all')}
              disabled={isResetting}
            >
              Delete Everything
            </Button>
          }
        />
      </div>

      {/* 4. Confirmation Dialog */}
      <SettingsConfirmModal
        isOpen={confirmDialog !== null}
        type={confirmDialog || 'progress'}
        onClose={() => setConfirmDialog(null)}
        onConfirm={() =>
          handleReset(confirmDialog === 'all' ? 'reset_all' : 'reset_progress_only')
        }
        isResetting={isResetting}
      />
    </div>
  );
};
