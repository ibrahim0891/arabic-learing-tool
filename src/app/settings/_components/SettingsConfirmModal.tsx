'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface SettingsConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'progress' | 'all';
  onConfirm: () => void;
  isResetting: boolean;
}

export const SettingsConfirmModal: React.FC<SettingsConfirmModalProps> = ({
  isOpen,
  onClose,
  type,
  onConfirm,
  isResetting,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  const isAll = type === 'all';

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md p-6 bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[16px] shadow-2xl space-y-4 animate-fadeIn">
        <div className="flex items-start gap-3">
          <div
            className={`p-2.5 rounded-[10px] shrink-0 ${
              isAll
                ? 'bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)]'
                : 'bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)]'
            }`}
          >
            {isAll ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
          </div>

          <div className="space-y-1">
            <h3 className="text-[17px] font-bold text-[var(--ink-primary)]">
              {isAll ? 'Confirm Factory Reset?' : 'Reset Study History & Intervals?'}
            </h3>
            <p className="text-[12px] text-[var(--ink-secondary)] leading-relaxed">
              {isAll
                ? 'Are you completely sure? Every word in your library, generated topic sets, and quiz logs will be wiped permanently from your database and local storage. This action cannot be undone.'
                : 'All your words and collections will remain safely in your library, but their spaced repetition memory status, review intervals, and quiz history will be reset to 0.'}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isResetting}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant={isAll ? 'danger' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isResetting}
          >
            {isAll ? 'Yes, Delete Everything' : 'Yes, Reset Progress'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
