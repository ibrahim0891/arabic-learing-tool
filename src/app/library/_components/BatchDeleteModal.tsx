'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface BatchDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onConfirm: () => void;
  isDeleting: boolean;
}

export const BatchDeleteModal: React.FC<BatchDeleteModalProps> = ({
  isOpen,
  onClose,
  selectedCount,
  onConfirm,
  isDeleting,
}) => {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-[16px] shadow-2xl p-6 space-y-4 animate-fadeIn">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-[10px] bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] shrink-0">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-[17px] font-bold text-[var(--ink-primary)]">
              Delete {selectedCount} {selectedCount === 1 ? 'Word' : 'Words'}?
            </h3>
            <p className="text-[12px] text-[var(--ink-muted)] leading-relaxed">
              Are you sure you want to permanently remove {selectedCount} selected {selectedCount === 1 ? 'word' : 'words'} from your Word Bank? This action cannot be undone.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDeleting}
            onClick={onClose}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="danger"
            size="sm"
            disabled={isDeleting}
            isLoading={isDeleting}
            onClick={onConfirm}
            leftIcon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Delete {selectedCount} {selectedCount === 1 ? 'Word' : 'Words'}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
};
