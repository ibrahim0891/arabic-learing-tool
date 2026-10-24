'use client';

import React from 'react';
import { DraftsManager } from '@/components/DraftsManager';
import type { WordGeneratorState } from '../_hooks/useWordGenerator';

interface DraftsSectionProps {
  gen: WordGeneratorState;
  onSavedSuccess: (savedCount: number) => void;
  onNavigateToStudy: () => void;
}

/**
 * Drafts collection view — wraps the existing DraftsManager
 * functionality unchanged, refreshed whenever new words are generated.
 */
export const DraftsSection: React.FC<DraftsSectionProps> = ({
  gen,
  onSavedSuccess,
  onNavigateToStudy,
}) => {
  return (
    <DraftsManager
      onSavedToWordBank={(count) => {
        // After promoting drafts to the Word Bank, refresh
        // the drafts badge so the header count stays accurate.
        gen.setDraftsVersion((v) => v + 1);
        onSavedSuccess(count);
      }}
      onNavigateToStudy={onNavigateToStudy}
      draftsVersion={gen.draftsVersion}
    />
  );
};
