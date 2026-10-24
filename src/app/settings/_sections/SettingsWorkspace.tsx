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
} from 'lucide-react';

interface SettingsWorkspaceProps {
  onResetCompleted?: () => void;
  onNavigateHome?: () => void;
}

export const SettingsWorkspace: React.FC<SettingsWorkspaceProps> = ({
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
