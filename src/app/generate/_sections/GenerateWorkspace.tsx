'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, PenTool, Inbox, X, BookOpen } from 'lucide-react';
import { ArabicText } from '@/components/ui/ArabicText';
import { Button } from '@/components/ui/Button';
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
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);

  // Close on Escape + lock body scroll while modal is open
  useEffect(() => {
    if (!isMobileModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsMobileModalOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isMobileModalOpen]);

  return (
    <div className="p-4 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-6 animate-fadeIn pb-24 lg:pb-16">
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

      {/* 2. Learning Mode Switch Bar (Visible on desktop; on mobile included in modal) */}
      {workspaceTab === 'generate' && (
        <div className="hidden lg:flex items-center gap-2 border-b border-[var(--border-subtle)] pb-3.5">
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

      {/* 4. Main Two-Column Layout (Desktop unchanged; Mobile shows empty space trigger or generated results) */}
      {workspaceTab === 'drafts' ? (
        <DraftsSection
          gen={gen}
          onSavedSuccess={onSavedSuccess}
          onNavigateToStudy={onNavigateToStudy}
        />
      ) : (
        <>
          {/* Mobile Empty Space Action Card (when no words generated yet and not loading) */}
          {!gen.generatedResult && !gen.isLoading && (
            <div
              onClick={() => setIsMobileModalOpen(true)}
              className="lg:hidden p-6 rounded-2xl bg-[var(--bg-surface)] border-2 border-dashed border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/60 text-center flex flex-col items-center justify-center gap-3 cursor-pointer shadow-xs active:scale-[0.99] transition"
            >
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)]">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-[17px] font-semibold text-[var(--ink-primary)]">
                  Learn New Words
                </h3>
                <p className="text-[12px] text-[var(--ink-secondary)] max-w-xs">
                  Tap here to configure topics, difficulty, and word count with AI.
                </p>
              </div>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                className="mt-1 pointer-events-none"
              >
                Configure & Generate
              </Button>
            </div>
          )}

          {/* Desktop Two-Column Layout + Mobile Results Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Configuration Column: HIDDEN on mobile/tablet (< lg), visible on desktop (lg:block) */}
            <div className="hidden lg:block lg:col-span-5">
              <ConfigPanelSection gen={gen} activeMode={activeMode} />
            </div>

            {/* Right Live Preview Column: (Results visible on mobile; Default empty card hidden on mobile) */}
            <div className="lg:col-span-7">
              <PreviewPanelSection
                gen={gen}
                onNavigateToStudy={onNavigateToStudy}
              />
            </div>
          </div>

          {/* Mobile Floating Action Button (only shown once words exist so it doesn't duplicate the empty state card) */}
          {!!gen.generatedResult && (
            <div className="fixed bottom-6 right-6 z-40 lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileModalOpen(true)}
                className="flex items-center gap-2 px-5 py-3 rounded-full bg-[var(--accent-ochre)] text-white shadow-xl active:scale-95 transition cursor-pointer font-semibold text-sm"
                aria-label="Open Learn New Words configuration"
              >
                <Sparkles className="w-4 h-4" />
                <span>Learn New Words</span>
              </button>
            </div>
          )}

          {/* Mobile Bottom-Sheet Modal — rendered at <body> via portal so it is ALWAYS a true overlay */}
          {isMobileModalOpen && createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Learn New Words configuration"
              className="fixed inset-0 z-[9999] flex flex-col justify-end"
            >
              {/* Dark scrim backdrop — clicking it closes the sheet */}
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
                onClick={() => setIsMobileModalOpen(false)}
              />

              {/* The sheet itself — slides up from the bottom */}
              <div
                className="relative w-full flex flex-col rounded-t-[24px] bg-[var(--bg-surface)] shadow-2xl animate-slideUp"
                style={{ maxHeight: '92dvh' }}
              >
                {/* ── STICKY HEADER ─────────────────────────────── */}
                <div className="shrink-0 flex flex-col items-center px-5 pt-3 pb-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-t-[24px]">
                  {/* Drag pill */}
                  <div className="w-10 h-[5px] rounded-full bg-[var(--border-subtle)] mb-3" />

                  {/* Title row */}
                  <div className="w-full flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)] shadow-2xs">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div className="text-left">
                        <h3 className="text-[16px] font-bold text-[var(--ink-primary)] leading-tight">
                          Learn New Words
                        </h3>
                        <span className="text-[11px] text-[var(--ink-secondary)]">
                          Powered by Gemini AI
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsMobileModalOpen(false)}
                      className="w-9 h-9 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition cursor-pointer active:scale-95"
                      aria-label="Close"
                    >
                      <X className="w-4.5 h-4.5" />
                    </button>
                  </div>

                  {/* Mode pills */}
                  <div className="w-full grid grid-cols-2 gap-1.5 mt-3 p-1 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMode('curated');
                        if (gen.topic === 'custom') gen.setTopic('daily life');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition cursor-pointer ${
                        activeMode === 'curated'
                          ? 'bg-[var(--accent-ochre)] text-white shadow-sm'
                          : 'text-[var(--ink-secondary)]'
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Curated Topics
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setActiveMode('custom');
                        gen.setTopic('custom');
                      }}
                      className={`flex items-center justify-center gap-1.5 py-2 rounded-lg text-[12px] font-semibold transition cursor-pointer ${
                        activeMode === 'custom'
                          ? 'bg-[var(--accent-ochre)] text-white shadow-sm'
                          : 'text-[var(--ink-secondary)]'
                      }`}
                    >
                      <PenTool className="w-3.5 h-3.5" />
                      Custom Prompt
                    </button>
                  </div>
                </div>

                {/* ── SCROLLABLE BODY ────────────────────────────── */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5">
                  <ConfigPanelSection
                    gen={gen}
                    activeMode={activeMode}
                    isEmbedded={true}
                    onGenerated={() => setIsMobileModalOpen(false)}
                  />
                </div>

                {/* ── PINNED BOTTOM ACTION BAR ───────────────────── */}
                <div className="shrink-0 px-5 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shadow-[0_-6px_20px_rgba(0,0,0,0.07)] flex flex-col gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
                  <Button
                    type="submit"
                    form="mobile-config-form"
                    variant="primary"
                    size="lg"
                    isLoading={gen.isLoading}
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    className="w-full justify-center font-bold text-[15px] py-3.5"
                  >
                    {gen.isLoading ? 'Generating…' : `Generate ${gen.count} Words`}
                  </Button>
                  <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] px-0.5">
                    <span>Estimated: ~5–10 seconds</span>
                    <span className="font-arabic text-[13px] text-[var(--accent-ochre)]">تَوْلِيد كَلِمَات</span>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )}
        </>
      )}
    </div>
  );
};
