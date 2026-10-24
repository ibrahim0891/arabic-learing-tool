'use client';

import React from 'react';
import { QuizWorkspace } from '@/app/quiz/_sections/QuizWorkspace';

interface TestGeneratorProps {
  initialFilter?: string;
  onTestComplete?: () => void;
}

export const TestGeneratorView: React.FC<TestGeneratorProps> = ({
  initialFilter = 'all',
  onTestComplete,
}) => {
  return (
    <QuizWorkspace
      initialFilter={initialFilter}
      onTestComplete={onTestComplete}
    />
  );
};
