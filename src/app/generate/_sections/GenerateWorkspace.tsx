'use client';

import React, { useState } from 'react';
import { Sparkles, PenTool, Inbox } from 'lucide-react';
import { ArabicText } from '@/components/ui/ArabicText';
import { useWordGenerator } from '../_hooks/useWordGenerator';
import { ConfigPanelSection, GenerateMode } from './ConfigPanelSection';
import { PreviewPanelSection } from './PreviewPanelSection';
import { DraftsSection } from './DraftsSection';

interface GenerateWorkspaceProps {
  onSavedSuccess: (savedCount: number) => void;
  onNavigateToStudy: () => void;
}

type WorkspaceTab = 'generate' | 'drafts';

export const GenerateWorkspace: React.FC<GenerateWorkspaceProps> = ({
  onSavedSuccess,
  onNavigateToStudy,
}) => {
  const gen = useWordGenerator({ onSavedSuccess });
  const [workspaceTab, setWorkspaceTab] = useState<WorkspaceTab>('generate');
  const [activeMode, setActiveMode] = useState<GenerateMode>('curated');

  return (
    <div className="p-6 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-6 animate-fadeIn pb-16">
      {/* 1. Page Heading Area */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-[26px] sm:text-[28px] leading-[38px] sm:leading-[42px] font-semibold text-[var(--ink-primary)] tracking-tight">
              Learn New Words
            </h1>
            <ArabicText as="span" size="sm" color="accent" weight="medium">
              تَعَلَّمْ كَلِمَاتٍ جَدِيدَة
            </ArabicText>
          </div>
          <p className="text-[13px] sm:text-[14px] leading-[21px] text-[var(--ink-secondary)] max-w-2xl">
            Generate a custom vocabulary set tailored to your current level. Words include diacritics, root analysis, and practical example sentences.
          </p>
        </div>

        {/* Drafts collection trigger */}
        <button
          type="button"
          onClick={() => setWorkspaceTab(workspaceTab === 'drafts' ? 'generate' : 'drafts')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] border text-[12px] font-semibold transition cursor-pointer self-start sm:self-auto ${workspaceTab === 'drafts'
              ? 'bg-[var(--accent-ochre)] text-white border-[var(--accent-ochre)]'
              : 'bg-[var(--bg-surface)] text-[var(--ink-secondary)] border-[var(--border-subtle)] hover:text-[var(--ink-primary)]'
            }`}
        >
          <Inbox className="w-4 h-4" />
          <span>Drafts Collection</span>
          {gen.draftCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] text-[10px] font-bold">
              {gen.draftCount}
            </span>
          )}
        </button>
      </div>

      {/* 2. Learning Mode Switch Bar (Figma Specs) */}
      {workspaceTab === 'generate' && (
        <div className="flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3.5">
          <button
            type="button"
            onClick={() => {
              setActiveMode('curated');
              if (gen.topic === 'custom') gen.setTopic('daily life');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${activeMode === 'curated'
                ? 'bg-[var(--accent-ochre)] text-white shadow-2xs border border-[var(--accent-ochre)]'
                : 'bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--border-subtle)]'
              }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Curated Topics</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveMode('custom');
              gen.setTopic('custom');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-[13px] font-semibold transition cursor-pointer ${activeMode === 'custom'
                ? 'bg-[var(--accent-ochre)] text-white shadow-2xs border border-[var(--accent-ochre)]'
                : 'bg-[var(--bg-surface)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] border border-[var(--border-subtle)]'
              }`}
          >
            <PenTool className="w-4 h-4" />
            <span>Custom Prompt</span>
          </button>
        </div>
      )}

      {/* 3. Auto-draft confirmation banner if present */}
      {gen.autoDraftMsg && workspaceTab === 'generate' && (
        <div className="flex items-center justify-between gap-3 p-3 rounded-[8px] bg-[var(--accent-cypress-dim)] border border-[var(--accent-cypress)]/30 text-[12px] text-[var(--accent-cypress)] animate-fadeIn">
          <span className="flex items-center gap-2 font-medium">
            <Sparkles className="w-4 h-4 shrink-0" />
            {gen.autoDraftMsg}
          </span>
          <button
            type="button"
            onClick={() => setWorkspaceTab('drafts')}
            className="font-bold underline cursor-pointer hover:opacity-80 shrink-0"
          >
            View Drafts Collection
          </button>
        </div>
      )}

      {/* 4. Main Two-Column Layout (Left: 664px Config, Right: 448px Preview) */}
      {workspaceTab === 'drafts' ? (
        <DraftsSection
          gen={gen}
          onSavedSuccess={onSavedSuccess}
          onNavigateToStudy={onNavigateToStudy}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Configuration Column (7 of 12 columns ~ 664px) */}
          <div className="lg:col-span-5">
            <ConfigPanelSection gen={gen} activeMode={activeMode} />
          </div>

          {/* Right Live Preview Column (5 of 12 columns ~ 448px) */}
          <div className="lg:col-span-7">
            <PreviewPanelSection
              gen={gen}
              onNavigateToStudy={onNavigateToStudy}
            />
          </div>
        </div>
      )}
    </div>
  );
};
