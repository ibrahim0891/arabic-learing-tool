'use client';

import React from 'react';
import { LibraryWorkspace } from '@/app/library/_sections/LibraryWorkspace';

interface VocabularyLibraryProps {
  onWordCountChange?: () => void;
}

export const VocabularyLibraryView: React.FC<VocabularyLibraryProps> = ({
  onWordCountChange,
}) => {
  return (
    <LibraryWorkspace
      onWordCountChange={onWordCountChange}
    />
  );
};
