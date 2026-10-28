'use client';

import React from 'react';
import { Volume2, Menu } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/ui/Badge';

interface WorkspaceHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onOpenMobileSidebar?: () => void;
  audioActive?: boolean;
  onToggleAudio?: () => void;
}

export const WorkspaceHeader: React.FC<WorkspaceHeaderProps> = ({
  breadcrumbs,
  onOpenMobileSidebar,
  audioActive = true,
  onToggleAudio,
}) => {
  return (
    <header className="sticky top-0 z-40 h-[56px] sm:h-[72px] px-4 sm:px-10 flex items-center justify-between gap-3 bg-[var(--bg-surface)]/95 backdrop-blur-md border-b border-[var(--border-subtle)] shrink-0 shadow-2xs">
      {/* Left Breadcrumb & Mobile Menu Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {onOpenMobileSidebar && (
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-1.5 -ml-1 rounded-[8px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] transition-colors cursor-pointer shrink-0"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div className="min-w-0">
          <Breadcrumb items={breadcrumbs} />
        </div>
      </div>

      {/* Right Language & Audio Meta */}
      <div className="flex items-center gap-2.5 sm:gap-5 shrink-0">
        {/* Status Badge: only on md/desktop screens where there is ample room */}
        <div className="hidden md:flex items-center">
          <Badge variant="ochre">
            Modern Standard Arabic
          </Badge>
        </div>

        {/* Audio status pill / button */}
        <button
          onClick={onToggleAudio}
          className="p-1.5 sm:p-0 flex items-center gap-[7px] text-[12px] leading-[18px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition-colors cursor-pointer bg-transparent border-0 rounded-[6px] hover:bg-[var(--bg-canvas)] sm:hover:bg-transparent"
          title="Toggle audio narration"
          aria-label={audioActive ? 'Mute audio' : 'Unmute audio'}
        >
          <Volume2 className={`w-4 h-4 ${audioActive ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-muted)]'}`} />
          <span className="hidden md:inline">{audioActive ? 'Audio on' : 'Audio off'}</span>
        </button>

        {/* Arabic script mark */}
        <span className="font-arabic text-[18px] sm:text-[20px] leading-tight text-[var(--accent-ochre)] font-bold text-right select-none">
          المُعَلِّم
        </span>
      </div>
    </header>
  );
};
