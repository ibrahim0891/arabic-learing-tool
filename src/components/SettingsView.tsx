'use client';

import React from 'react';
import { SettingsWorkspace } from '@/app/settings/_sections/SettingsWorkspace';

interface SettingsViewProps {
  onResetCompleted?: () => void;
  onNavigateHome?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onResetCompleted,
  onNavigateHome,
}) => {
  return (
    <SettingsWorkspace
      onResetCompleted={onResetCompleted}
      onNavigateHome={onNavigateHome}
    />
  );
};
