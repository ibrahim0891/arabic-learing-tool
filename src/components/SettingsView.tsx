'use client';

import React, { useState } from 'react';
import {
  Settings,
  RotateCcw,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Database,
  RefreshCw,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

interface SettingsViewProps {
  onResetCompleted: () => void;
  onNavigateHome: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onResetCompleted,
  onNavigateHome,
}) => {
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
      onResetCompleted();
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
      const data = await res.json();
      setMessage({
        text: 'Starter vocabulary restored successfully! You now have everyday foundation words in your Word Bank.',
        type: 'success',
      });
      onResetCompleted();
    } catch (err: any) {
      setMessage({ text: err.message || 'Error restoring starter words', type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fadeIn">
      {/* Header */}
      <div className="space-y-2 border-b border-[var(--border-subtle)] pb-6">
        <div className="text-xs uppercase tracking-wider font-semibold text-[var(--accent-ochre)] flex items-center gap-2">
          <Settings className="w-3.5 h-3.5" /> App Settings & Storage
        </div>
        <h1 className="editorial-title text-3xl font-semibold text-[var(--ink-primary)]">
          Manage Your Learning Data
        </h1>
        <p className="text-sm text-[var(--ink-secondary)] max-w-xl leading-relaxed">
          Need a fresh start? You can reset your study intervals, quiz history, or completely wipe all saved vocabulary from both Supabase and local storage.
        </p>
      </div>

      {/* Notifications */}
      {message && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            message.type === 'success'
              ? 'bg-[var(--accent-cypress)]/15 border-[var(--accent-cypress)]/40 text-[var(--accent-cypress)]'
              : 'bg-[var(--accent-terracotta)]/15 border-[var(--accent-terracotta)]/40 text-[var(--accent-terracotta)]'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Reset Options */}
      <div className="space-y-6">
        {/* Option 1: Reset Study Progress Only */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div>
              <h3 className="editorial-title text-xl font-semibold text-[var(--ink-primary)]">
                Reset Progress & Quiz History
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-lg leading-relaxed">
                Clears your test scores, mistake logs, and resets all saved words back to "New Word" state. <strong>Your words and topics are kept safely.</strong>
              </p>
            </div>

            <button
              onClick={() => setConfirmDialog('progress')}
              disabled={isResetting}
              className="btn-quiet px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap self-start sm:self-auto hover:text-[var(--accent-ochre)]"
            >
              Reset Progress Only
            </button>
          </div>
        </div>

        {/* Option 2: Complete Reset (Wipe Everything) */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--accent-terracotta)]/30 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--accent-terracotta)]">
                  Danger Zone
                </span>
              </div>
              <h3 className="editorial-title text-xl font-semibold text-[var(--ink-primary)] mt-1">
                Wipe Everything (Factory Reset)
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-lg leading-relaxed">
                Permanently deletes <strong>all saved words, generated word sets, study sessions, and quiz scores</strong> from Supabase and local storage. This action cannot be undone.
              </p>
            </div>

            <button
              onClick={() => setConfirmDialog('all')}
              disabled={isResetting}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-terracotta)]/15 border border-[var(--accent-terracotta)]/50 text-[var(--accent-terracotta)] hover:bg-[var(--accent-terracotta)] hover:text-white transition cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              Delete Everything
            </button>
          </div>
        </div>

        {/* Option 3: Restore Default Starter Vocabulary */}
        <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-3">
            <div>
              <h3 className="editorial-title text-xl font-semibold text-[var(--ink-primary)]">
                Restore Starter Vocabulary
              </h3>
              <p className="text-xs text-[var(--ink-secondary)] mt-1 max-w-lg leading-relaxed">
                Add beginner-friendly everyday Arabic words (book, read, library, friend, beautiful) with full diacritics and example sentences.
              </p>
            </div>

            <button
              onClick={handleRestoreStarterWords}
              disabled={isResetting}
              className="btn-ochre px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap self-start sm:self-auto"
            >
              Restore Starter Set
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {confirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md p-6 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-[var(--accent-terracotta)]">
              <ShieldAlert className="w-5 h-5 shrink-0" />
              <h4 className="editorial-title text-lg font-bold">
                {confirmDialog === 'all'
                  ? 'Confirm Complete Reset?'
                  : 'Reset Study History & Intervals?'}
              </h4>
            </div>

            <p className="text-xs text-[var(--ink-secondary)] leading-relaxed">
              {confirmDialog === 'all'
                ? 'Are you completely sure? Every word in your library, generated topic sets, and quiz logs will be wiped permanently.'
                : 'All your words will stay in your library, but their memory progress, intervals, and test history will be reset to 0 so you can start fresh.'}
            </p>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="btn-quiet px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  handleReset(
                    confirmDialog === 'all' ? 'reset_all' : 'reset_progress_only'
                  )
                }
                disabled={isResetting}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-terracotta)] text-white hover:brightness-110 transition cursor-pointer flex items-center gap-1.5"
              >
                {isResetting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Resetting...
                  </>
                ) : (
                  <>Yes, Reset Now</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
