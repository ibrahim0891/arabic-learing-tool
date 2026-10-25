'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MessageSquare,
  Sparkles,
  Volume2,
  Trash2,
  Plus,
  Loader2,
  ChevronDown,
  ChevronUp,
  History,
  Users,
  AlertTriangle,
  Info,
  X,
  Search,
  Check,
  BookOpen
} from 'lucide-react';
import { ConversationSession, ChatMessage, WordBreakdownItem } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { ArabicText } from './ui/ArabicText';

const PRESET_TOPICS = [
  { id: 'cafe', label: 'Ordering at a Cafe', prompt: 'Two friends meeting at a lively coffee shop ordering drinks and discussing their day.' },
  { id: 'airport', label: 'At the Airport & Travel', prompt: 'Asking directions, checking luggage, and passport control at the airport.' },
  { id: 'market', label: 'Souq & Haggling Prices', prompt: 'A customer inquiring about fruit and spices at a traditional market and discussing prices.' },
  { id: 'weekend', label: 'Weekend Plans with Friends', prompt: 'Friends deciding whether to go to the beach or dinner this weekend.' },
  { id: 'work', label: 'Work & Professional Chat', prompt: 'Two colleagues discussing a project milestone and setting up a meeting.' },
];

const BREAKDOWN_PREVIEW_COUNT = 5;

export function parseDialogueTitle(title: string): { english: string; arabic: string | null } {
  if (!title) return { english: 'Untitled Dialogue', arabic: null };

  // Match: English Title (Arabic inside parens) e.g. "Ordering at a Cafe (فِي المَقْهَى)"
  const engArMatch = title.match(/^(.*?)\s*\(([^)]*[\u0600-\u06FF][^)]*)\)$/);
  if (engArMatch) {
    return { english: engArMatch[1].trim(), arabic: engArMatch[2].trim() };
  }

  // Match: Arabic Title (English inside parens)
  const arEngMatch = title.match(/^([^)]*[\u0600-\u06FF][^)]*)\s*\((.*?)\)$/);
  if (arEngMatch) {
    return { english: arEngMatch[2].trim(), arabic: arEngMatch[1].trim() };
  }

  // Pure Arabic title without parens
  if (/^[\u0600-\u06FF\s\d.,!?-]+$/.test(title.trim())) {
    return { english: title.trim(), arabic: title.trim() };
  }

  return { english: title.trim(), arabic: null };
}

export const ConversationPracticeView: React.FC = () => {
  // Modal creation state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('cafe');
  const [customTopic, setCustomTopic] = useState<string>('');
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [speakerCount, setSpeakerCount] = useState<number>(2);
  const [turnsCount, setTurnsCount] = useState<number>(6);
  const [includeKnownWords, setIncludeKnownWords] = useState<boolean>(true);

  // Active conversation & history list
  const [activeConversation, setActiveConversation] = useState<ConversationSession | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fasih_active_conversation');
        if (cached) return JSON.parse(cached);
      } catch (_) {}
    }
    return null;
  });

  const [historyList, setHistoryList] = useState<ConversationSession[]>([]);
  const [searchHistory, setSearchHistory] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Interactive message bubble state: tracks which message has its translation revealed
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // On-demand AI word-by-word breakdown state
  const [breakdownLoadingId, setBreakdownLoadingId] = useState<string | null>(null);
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  const [expandedBreakdownIds, setExpandedBreakdownIds] = useState<Record<string, boolean>>({});

  // Mobile sidebar toggle
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);

  // Chat feed scroll container
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Escape key + scroll lock for the modal
  useEffect(() => {
    if (!isModalOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsModalOpen(false); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  // Escape key for mobile dialogues drawer
  useEffect(() => {
    if (!isMobileSidebarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileSidebarOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
    };
  }, [isMobileSidebarOpen]);

  // Click outside listener to collapse expanded message translation
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.chat-bubble-container')) {
        setExpandedMessageId(null);
      }
    };
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, []);

  // Fetch history list & sync active conversation
  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoadingHistory(true);
      try {
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const data = await res.json();
          const sessions: ConversationSession[] = data.conversations || data.sessions || [];
          setHistoryList(sessions);

          if (!activeConversation && sessions.length > 0) {
            setActiveConversation(sessions[0]);
            try {
              localStorage.setItem('fasih_active_conversation', JSON.stringify(sessions[0]));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.error('Failed to load conversation history:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  // Auto scroll to bottom when opening or switching conversation
  useEffect(() => {
    if (activeConversation && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.id]);

  const handleSelectConversation = (conv: ConversationSession) => {
    setActiveConversation(conv);
    setIsMobileSidebarOpen(false);
    setExpandedMessageId(null);
    setExpandedBreakdownIds({});
    try {
      localStorage.setItem('fasih_active_conversation', JSON.stringify(conv));
    } catch (_) {}
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    try {
      const res = await fetch(`/api/conversations?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        const updated = historyList.filter((c) => c.id !== id);
        setHistoryList(updated);

        if (activeConversation?.id === id) {
          const nextActive = updated[0] || null;
          setActiveConversation(nextActive);
          if (nextActive) {
            localStorage.setItem('fasih_active_conversation', JSON.stringify(nextActive));
          } else {
            localStorage.removeItem('fasih_active_conversation');
          }
        }
        setConfirmDeleteId(null);
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    const presetObj = PRESET_TOPICS.find((p) => p.id === selectedPreset);
    const finalTopic = customTopic.trim() || (presetObj ? presetObj.label : 'Everyday Conversation');
    const promptDetails = customTopic.trim() || (presetObj ? presetObj.prompt : '');

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: finalTopic,
          promptDetails,
          difficulty,
          speakerCount,
          turnsCount,
          includeKnownWords,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate dialogue.');
      }

      const data = await res.json();
      const newSession: ConversationSession | null = data.conversation || data.session || null;
      if (newSession) {
        setHistoryList((prev) => [newSession, ...prev]);
        setActiveConversation(newSession);
        try {
          localStorage.setItem('fasih_active_conversation', JSON.stringify(newSession));
        } catch (_) {}
        setIsModalOpen(false);
        setCustomTopic('');
      } else {
        throw new Error('No dialogue session returned from server.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Something went wrong while generating dialogue.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateBreakdown = async (message: ChatMessage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (breakdownLoadingId === message.id) return;

    setBreakdownLoadingId(message.id);
    setBreakdownError(null);

    try {
      const res = await fetch('/api/conversations/breakdown', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messageId: message.id,
          arabic: message.arabic,
          english: message.english,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to analyze words.');
      }

      const data = await res.json();
      if (data.breakdown && activeConversation) {
        const updatedMessages = activeConversation.messages.map((m) =>
          m.id === message.id ? { ...m, breakdown: data.breakdown } : m
        );
        const updatedConv = { ...activeConversation, messages: updatedMessages };
        setActiveConversation(updatedConv);
        try {
          localStorage.setItem('fasih_active_conversation', JSON.stringify(updatedConv));
        } catch (_) {}
      }
    } catch (err: unknown) {
      setBreakdownError(err instanceof Error ? err.message : 'Word breakdown failed.');
    } finally {
      setBreakdownLoadingId(null);
    }
  };

  const filteredHistory = historyList.filter((conv) => {
    const q = searchHistory.toLowerCase().trim();
    if (!q) return true;
    return (
      conv.title.toLowerCase().includes(q) ||
      conv.topic.toLowerCase().includes(q) ||
      conv.speakers.some((s) => s.toLowerCase().includes(q)) ||
      conv.messages.some((m) => m.arabic.includes(q) || m.english.toLowerCase().includes(q))
    );
  });

  const renderSearchBar = () => (
    <div className="p-3 border-b border-[var(--border-subtle)] flex flex-col gap-2 shrink-0">
      <div className="flex items-center justify-between text-[12px] px-1">
        <span className="font-semibold text-[var(--ink-primary)]">
          Saved Dialogues
        </span>
        <span className="text-[11px] text-[var(--ink-secondary)] font-mono">
          {historyList.length} chats
        </span>
      </div>

      <div className="relative">
        <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search dialogues..."
          value={searchHistory}
          onChange={(e) => setSearchHistory(e.target.value)}
          className="w-full pl-8 pr-7 py-1.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[12px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] transition"
        />
        {searchHistory && (
          <button
            type="button"
            onClick={() => setSearchHistory('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[var(--ink-muted)] hover:text-[var(--ink-primary)] transition cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );

  const renderDialogueCards = (onSelect?: () => void) => {
    if (isLoadingHistory && historyList.length === 0) {
      return (
        <div className="p-8 text-center text-[12px] text-[var(--ink-secondary)] flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-ochre)]" />
          <span>Loading dialogues...</span>
        </div>
      );
    }

    if (filteredHistory.length === 0) {
      return (
        <div className="p-8 text-center text-[12px] text-[var(--ink-secondary)] flex flex-col items-center gap-2">
          {searchHistory ? (
            <>
              <p className="text-[var(--ink-muted)]">No dialogues matching "{searchHistory}"</p>
              <button
                type="button"
                onClick={() => setSearchHistory('')}
                className="text-[11px] text-[var(--accent-ochre)] font-semibold hover:underline cursor-pointer"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <p className="text-[var(--ink-muted)]">No dialogues found.</p>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (onSelect) onSelect();
                  setIsModalOpen(true);
                }}
              >
                Create one now
              </Button>
            </>
          )}
        </div>
      );
    }

    return filteredHistory.map((conv) => {
      const isSelected = activeConversation?.id === conv.id;
      const lastMsg = conv.messages[conv.messages.length - 1];
      const { english: engTitle, arabic: arTitle } = parseDialogueTitle(conv.title);

      return (
        <div
          key={conv.id}
          onClick={() => {
            handleSelectConversation(conv);
            if (onSelect) onSelect();
          }}
          className={`relative p-3 rounded-[10px] cursor-pointer transition-all flex items-start gap-3 select-none group border ${
            isSelected
              ? 'bg-[var(--bg-accent-tint)] border-[var(--border-accent)] shadow-2xs'
              : 'bg-[var(--bg-surface)] border-[var(--border-subtle)]/60 hover:border-[var(--accent-ochre)]/40 hover:bg-[var(--bg-canvas)]'
          }`}
        >
          {/* Active indicator bar */}
          {isSelected && (
            <div className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-[var(--accent-ochre)]" />
          )}

          {/* Speaker initial pill / avatar */}
          <div
            className={`w-9 h-9 rounded-xl font-arabic font-bold flex items-center justify-center text-[15px] shrink-0 border transition-all ${
              isSelected
                ? 'bg-[var(--accent-ochre)] text-white border-transparent shadow-xs'
                : 'bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] border-[var(--border-accent)] group-hover:scale-105'
            }`}
          >
            <span className="leading-none select-none">
              {conv.speakers[0] ? conv.speakers[0].charAt(0) : 'ح'}
            </span>
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-0.5">
            {/* Title with isolated BiDi text to prevent scrambling */}
            <div className="flex items-center gap-1.5 min-w-0 pr-5">
              <h3
                dir="ltr"
                className={`font-semibold text-[13px] leading-[18px] truncate ${
                  isSelected ? 'text-[var(--accent-ochre)] font-bold' : 'text-[var(--ink-primary)]'
                }`}
              >
                <bdi>{engTitle}</bdi>
              </h3>
            </div>

            {/* Arabic Title Subtitle */}
            {arTitle && (
              <span
                dir="rtl"
                className="font-arabic text-[12px] text-[var(--accent-ochre)] font-medium leading-tight truncate self-start opacity-95"
              >
                {arTitle}
              </span>
            )}

            {/* Snippet of last message */}
            {lastMsg && (
              <p dir="rtl" className="font-arabic text-[12px] leading-[18px] text-[var(--ink-secondary)] truncate mt-0.5 opacity-80">
                {lastMsg.arabic}
              </p>
            )}

            {/* Meta info footer */}
            <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--ink-secondary)] pt-1 border-t border-[var(--border-subtle)]/40 mt-1">
              <span className="truncate max-w-[120px]">{conv.speakers.join(', ')}</span>
              <span className="shrink-0 font-medium px-1.5 py-0.5 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[10px] text-[var(--ink-muted)]">
                {conv.messages.length} lines
              </span>
            </div>
          </div>

          {/* Delete hover button */}
          <button
            type="button"
            onClick={(e) => handleDelete(conv.id, e)}
            className="absolute top-2.5 right-2 p-1 text-[var(--ink-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition opacity-70 sm:opacity-0 sm:group-hover:opacity-100 cursor-pointer"
            title="Delete dialogue"
            aria-label="Delete dialogue"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    });
  };

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-canvas)] overflow-hidden">
      {/* Sub-Header Toolbar */}
      <div className="h-[56px] sm:h-[64px] px-3 sm:px-6 flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile dialogues list opener */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] bg-[var(--bg-canvas)] hover:bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] transition cursor-pointer shrink-0 active:scale-95 shadow-2xs"
            title="Open dialogues list"
            aria-label="Open dialogues list"
          >
            <MessageSquare className="w-3.5 h-3.5 text-[var(--accent-ochre)]" />
            <span className="text-[12px] font-semibold">Chats</span>
            <span className="px-1.5 py-0.2 rounded-full bg-[var(--bg-accent-tint)] text-[10px] font-mono text-[var(--accent-ochre)] font-bold">
              {historyList.length}
            </span>
          </button>

          <div className="hidden sm:flex w-8 h-8 rounded-[8px] bg-[var(--bg-accent-tint)] items-center justify-center shrink-0 text-[var(--accent-ochre)]">
            <MessageSquare className="w-4 h-4" />
          </div>

          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-center gap-1.5 min-w-0">
              {activeConversation ? (
                <>
                  <h1 className="text-[13px] sm:text-[16px] font-semibold text-[var(--ink-primary)] tracking-tight truncate">
                    <bdi>{parseDialogueTitle(activeConversation.title).english}</bdi>
                  </h1>
                  {parseDialogueTitle(activeConversation.title).arabic && (
                    <span dir="rtl" className="hidden sm:inline font-arabic text-[12px] text-[var(--accent-ochre)] font-medium shrink-0">
                      ({parseDialogueTitle(activeConversation.title).arabic})
                    </span>
                  )}
                  <div className="hidden sm:inline-flex shrink-0">
                    <Badge variant="ochre" className="capitalize text-[10px]">
                      {activeConversation.difficulty}
                    </Badge>
                  </div>
                </>
              ) : (
                <h1 className="text-[13px] sm:text-[16px] font-semibold text-[var(--ink-primary)] tracking-tight truncate">
                  Spoken Dialogues
                </h1>
              )}
            </div>

            <span className="text-[10px] sm:text-[11px] leading-tight sm:leading-[15px] text-[var(--ink-secondary)] truncate">
              {activeConversation ? (
                <>
                  <span className="font-medium text-[var(--ink-primary)]">{activeConversation.speakers.join(' & ')}</span>
                  <span> • </span>
                  <span>{activeConversation.messages.length} turns</span>
                </>
              ) : (
                'Select or create dialogue'
              )}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {activeConversation && (
            <button
              type="button"
              onClick={() => setConfirmDeleteId(confirmDeleteId ? null : activeConversation.id)}
              className="p-1.5 sm:p-2 rounded-[8px] text-[var(--ink-secondary)] hover:text-red-500 hover:bg-red-500/10 transition cursor-pointer"
              title="Delete conversation"
              aria-label="Delete dialogue"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="w-3.5 h-3.5" />}
            onClick={() => setIsModalOpen(true)}
            className="px-2.5 sm:px-3 text-[12px] h-8 sm:h-9"
          >
            <span className="hidden sm:inline">New Dialogue</span>
            <span className="sm:hidden font-medium">New</span>
          </Button>
        </div>
      </div>

      {/* Mobile Dialogues Drawer Overlay */}
      <div
        className={`fixed inset-0 z-50 md:hidden transition-all duration-300 ease-in-out ${
          isMobileSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden={!isMobileSidebarOpen}
      >
        {/* Backdrop Scrim */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileSidebarOpen(false)}
        />

        {/* Slide-out Drawer Panel */}
        <aside
          className={`relative z-10 w-[86vw] max-w-[340px] h-full bg-[var(--bg-surface)] shadow-2xl flex flex-col transform transition-transform duration-300 ease-out will-change-transform ${
            isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drawer Header */}
          <div className="p-3.5 px-4 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-surface)] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] flex items-center justify-center shrink-0 shadow-2xs">
                <MessageSquare className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-[14px] text-[var(--ink-primary)] leading-tight truncate">Dialogues</h2>
                <span className="text-[11px] text-[var(--ink-secondary)] font-mono">{historyList.length} saved</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileSidebarOpen(false)}
              className="w-8 h-8 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] active:scale-95 transition cursor-pointer"
              aria-label="Close dialogues list"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Bar */}
          {renderSearchBar()}

          {/* Dialogue Cards */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
            {renderDialogueCards(() => setIsMobileSidebarOpen(false))}
          </div>

          {/* Pinned Bottom Action Button */}
          <div className="p-3.5 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 pb-[calc(0.875rem+env(safe-area-inset-bottom))]">
            <Button
              variant="primary"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setIsMobileSidebarOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full justify-center h-11 text-[13px] font-bold shadow-xs active:scale-[0.99] transition"
            >
              New Dialogue
            </Button>
          </div>
        </aside>
      </div>

      {/* Main Split: Left Dialogues List (Desktop) + Right Chat Feed */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Desktop Left Sidebar */}
        <aside className="hidden md:flex w-72 lg:w-80 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex-col shrink-0">
          {renderSearchBar()}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
            {renderDialogueCards()}
          </div>
          <div className="p-3 border-t border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0">
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsModalOpen(true)}
              className="w-full justify-center h-9 text-[12px] font-semibold shadow-2xs"
            >
              New Dialogue
            </Button>
          </div>
        </aside>

        {/* Right Area: Interactive Chat Feed */}
        <main className="flex-1 flex flex-col bg-[var(--bg-canvas)] relative overflow-hidden min-w-0">
          {/* Active Delete Confirmation Bar */}
          {activeConversation && confirmDeleteId === activeConversation.id && (
            <div className="flex items-center justify-between p-3 px-6 bg-red-500/10 border-b border-red-500/20 text-[12px] text-red-400 shrink-0 z-10 animate-fadeIn">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>Delete this dialogue from your saved history?</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={() => setConfirmDeleteId(null)}>
                  Cancel
                </Button>
                <button
                  onClick={() => handleDelete(activeConversation.id)}
                  className="px-3 py-1.5 rounded-[8px] bg-red-600 text-white font-semibold text-[12px] hover:bg-red-700 transition cursor-pointer"
                >
                  Delete
                </button>
              </div>
            </div>
          )}

          {activeConversation ? (
            <div className="flex-1 flex flex-col overflow-hidden relative">
              {/* Scrollable Feed */}
              <div className="flex-1 p-3 sm:p-8 overflow-y-auto">
                <div className="max-w-3xl mx-auto w-full flex flex-col gap-4">
                  {/* Topic context banner */}
                  <div className="flex justify-center py-1">
                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[12px] text-[var(--ink-secondary)] shadow-2xs">
                      <Sparkles className="w-3.5 h-3.5 text-[var(--accent-ochre)]" />
                      <span>Scenario: <strong className="text-[var(--ink-primary)] font-semibold">{activeConversation.topic}</strong></span>
                    </span>
                  </div>

                  {/* Message Bubbles */}
                  {activeConversation.messages.map((msg, idx) => {
                    const speakerIndex = activeConversation.speakers.indexOf(msg.speakerName);
                    const isFirstSpeaker = speakerIndex <= 0;
                    const isExpanded = expandedMessageId === msg.id;
                    const breakdownWords = msg.breakdown || [];
                    const isBreakdownOpen = !!expandedBreakdownIds[msg.id];
                    const visibleBreakdownWords = isBreakdownOpen
                      ? breakdownWords
                      : breakdownWords.slice(0, BREAKDOWN_PREVIEW_COUNT);
                    const hasMoreBreakdown = breakdownWords.length > BREAKDOWN_PREVIEW_COUNT;

                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isFirstSpeaker ? 'items-start' : 'items-end'} gap-1 w-full`}
                      >
                        {/* Speaker Name Tag */}
                        <div className="flex items-center gap-1.5 px-1">
                          <span className="text-[11px] font-semibold text-[var(--ink-secondary)]">
                            {msg.speakerName}
                          </span>
                          {msg.speakerRole && (
                            <span className="text-[10px] text-[var(--ink-muted)]">
                              ({msg.speakerRole})
                            </span>
                          )}
                        </div>

                        {/* Chat Bubble Container */}
                        <div className="relative group chat-bubble-container max-w-[92%] sm:max-w-[80%]">
                          <div
                            onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                            className={`p-4 sm:p-5 rounded-[12px] cursor-pointer transition-all border shadow-2xs select-none ${
                              isFirstSpeaker
                                ? 'bg-[var(--bg-surface)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/50'
                                : 'bg-[var(--bg-accent-tint)] border-[var(--border-accent)] hover:border-[var(--accent-ochre)]'
                            }`}
                          >
                            {/* Arabic Spoken Message */}
                            <div className="flex items-start justify-between gap-4">
                              <p
                                dir="rtl"
                                className="font-arabic text-xl sm:text-2xl font-semibold text-[var(--ink-primary)] leading-[170%] text-right flex-1 select-text"
                              >
                                {msg.arabic}
                              </p>

                              <div onClick={(e) => e.stopPropagation()} className="shrink-0 pt-0.5">
                                <AudioPronounceButton
                                  arabicText={msg.arabic}
                                  size="sm"
                                  title="Listen to pronunciation"
                                />
                              </div>
                            </div>

                            {/* Translation toggle hint */}
                            <div className="flex items-center justify-end gap-1 mt-2 text-[11px] text-[var(--ink-secondary)] opacity-80">
                              <span>{isExpanded ? 'Hide translation' : 'Tap to reveal translation'}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>

                            {/* Expanded Translation & Word-by-Word Breakdown */}
                            {isExpanded && (
                              <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] flex flex-col gap-2.5 animate-fadeIn bg-[var(--bg-canvas)] p-3 rounded-[8px]">
                                {msg.transliteration && (
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] uppercase font-mono font-semibold text-[var(--accent-ochre)]">
                                      Pronunciation
                                    </span>
                                    <p className="text-[12px] font-mono text-[var(--ink-secondary)]">
                                      {msg.transliteration}
                                    </p>
                                  </div>
                                )}

                                <div className="flex flex-col gap-0.5">
                                  <span className="text-[10px] uppercase font-mono font-semibold text-[var(--ink-muted)]">
                                    English Meaning
                                  </span>
                                  <p className="text-[13px] text-[var(--ink-primary)] font-normal">
                                    "{msg.english}"
                                  </p>
                                </div>

                                {/* Word-by-word Breakdown */}
                                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--border-subtle)]">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] uppercase font-mono font-semibold text-[var(--accent-ochre)]">
                                      Word by Word {breakdownWords.length > 0 ? `(${breakdownWords.length})` : ''}
                                    </span>

                                    {breakdownWords.length === 0 && (
                                      <button
                                        type="button"
                                        onClick={(e) => handleGenerateBreakdown(msg, e)}
                                        disabled={breakdownLoadingId === msg.id}
                                        className="flex items-center gap-1 px-2.5 py-1 rounded-[6px] text-[11px] font-semibold bg-[var(--accent-ochre)] hover:opacity-90 text-white transition cursor-pointer disabled:opacity-60"
                                      >
                                        {breakdownLoadingId === msg.id ? (
                                          <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>Analyzing...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="w-3 h-3" />
                                            <span>Break down words</span>
                                          </>
                                        )}
                                      </button>
                                    )}
                                  </div>

                                  {/* Breakdown list */}
                                  {breakdownWords.length > 0 && (
                                    <div className="flex flex-col gap-1.5 pt-1">
                                      {visibleBreakdownWords.map((item, bIdx) => (
                                        <div
                                          key={bIdx}
                                          className="p-2 rounded-[6px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] flex items-center justify-between gap-2 text-[12px]"
                                        >
                                          <div className="flex items-center gap-2">
                                            <span dir="rtl" className="font-arabic font-semibold text-[var(--accent-ochre)] text-[16px]">
                                              {item.arabic}
                                            </span>
                                            <span className="font-mono text-[11px] text-[var(--ink-muted)]">
                                              ({item.transliteration})
                                            </span>
                                          </div>
                                          <span className="text-[12px] text-[var(--ink-primary)] text-right">
                                            {item.english}
                                          </span>
                                        </div>
                                      ))}

                                      {hasMoreBreakdown && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setExpandedBreakdownIds((prev) => ({
                                              ...prev,
                                              [msg.id]: !prev[msg.id],
                                            }));
                                          }}
                                          className="text-[11px] text-[var(--accent-ochre)] hover:underline self-center pt-1 cursor-pointer"
                                        >
                                          {isBreakdownOpen
                                            ? 'Show less'
                                            : `+ ${breakdownWords.length - BREAKDOWN_PREVIEW_COUNT} more words`}
                                        </button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={chatBottomRef} />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center gap-3">
              <div className="w-12 h-12 rounded-[12px] bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <h2 className="text-[18px] font-semibold text-[var(--ink-primary)]">
                No Dialogue Selected
              </h2>
              <p className="text-[13px] text-[var(--ink-secondary)] max-w-sm">
                Choose a conversation from the left sidebar or create an authentic AI-generated Arabic chat.
              </p>
              <Button
                variant="primary"
                size="md"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => setIsModalOpen(true)}
              >
                Create Dialogue
              </Button>
            </div>
          )}
        </main>
      </div>

      {/* New Dialogue Creation — bottom-sheet portal */}
      {isModalOpen && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Generate new Arabic dialogue"
          className="fixed inset-0 z-[9999] flex flex-col justify-end"
        >
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fadeIn"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Sheet */}
          <div
            className="relative w-full flex flex-col rounded-t-[24px] bg-[var(--bg-surface)] shadow-2xl animate-slideUp"
            style={{ maxHeight: '92dvh' }}
          >
            {/* Sticky Header */}
            <div className="shrink-0 flex flex-col items-center px-5 pt-3 pb-3 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] rounded-t-[24px]">
              <div className="w-10 h-[5px] rounded-full bg-[var(--border-subtle)] mb-3" />
              <div className="w-full flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[var(--bg-accent-tint)] flex items-center justify-center text-[var(--accent-ochre)] shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-[16px] font-bold text-[var(--ink-primary)] leading-tight">New Arabic Dialogue</h3>
                    <span className="text-[11px] text-[var(--ink-secondary)]">Powered by Gemini AI</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-9 h-9 rounded-full bg-[var(--bg-canvas)] border border-[var(--border-subtle)] flex items-center justify-center text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] transition cursor-pointer active:scale-95"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-5 flex flex-col gap-5">

              {/* Difficulty */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Difficulty Level</span>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`capitalize py-2.5 px-3 rounded-[8px] text-[12px] font-semibold border transition cursor-pointer ${
                        difficulty === d
                          ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] ring-1 ring-[var(--accent-ochre)]'
                          : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--accent-ochre)]/40'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Predefined Scenarios */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Predefined Scenarios</span>
                <div className="grid grid-cols-2 gap-2">
                  {PRESET_TOPICS.map((pt) => {
                    const isSelected = selectedPreset === pt.id && !customTopic.trim();
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => { setSelectedPreset(pt.id); setCustomTopic(''); }}
                        className={`py-2.5 px-3 rounded-[8px] text-[12px] border text-left transition cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] font-semibold ring-1 ring-[var(--accent-ochre)]'
                            : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:border-[var(--accent-ochre)]/40'
                        }`}
                      >
                        {pt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Topic */}
              <div className="flex flex-col gap-2">
                <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Or Custom Situation</span>
                <input
                  type="text"
                  placeholder="e.g. Asking for gym membership discount or booking a ride..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[13px] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] transition"
                />
              </div>

              {/* Speakers & Length */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-semibold text-[var(--ink-primary)] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[var(--ink-secondary)]" />
                    Speakers
                  </span>
                  <select
                    value={speakerCount}
                    onChange={(e) => setSpeakerCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[12px] font-medium focus:outline-none focus:border-[var(--accent-ochre)] transition"
                  >
                    <option value={2}>2 People</option>
                    <option value={3}>3 People</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-semibold text-[var(--ink-primary)]">Dialogue Length</span>
                  <select
                    value={turnsCount}
                    onChange={(e) => setTurnsCount(Number(e.target.value))}
                    className="w-full p-2.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[12px] font-medium focus:outline-none focus:border-[var(--accent-ochre)] transition"
                  >
                    <option value={4}>4 turns (Quick)</option>
                    <option value={6}>6 turns (Standard)</option>
                    <option value={8}>8 turns (Extended)</option>
                    <option value={10}>10 turns (Deep)</option>
                  </select>
                </div>
              </div>

              {/* Word Bank Toggle */}
              <label className={`flex items-start gap-3 p-3.5 rounded-[10px] border cursor-pointer select-none transition ${
                includeKnownWords
                  ? 'bg-[var(--bg-accent-tint)] border-[var(--border-accent)]'
                  : 'bg-[var(--bg-canvas)] border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/40'
              }`}>
                <input
                  type="checkbox"
                  checked={includeKnownWords}
                  onChange={(e) => setIncludeKnownWords(e.target.checked)}
                  className="mt-0.5 accent-[var(--accent-ochre)] rounded cursor-pointer w-4 h-4 shrink-0"
                />
                <div className="flex-1">
                  <span className="block text-[13px] font-semibold text-[var(--ink-primary)]">Weave in my Word Bank</span>
                  <span className="block text-[11px] text-[var(--ink-secondary)] mt-0.5 leading-snug">
                    {includeKnownWords
                      ? 'Gemini will weave in relevant saved words from your vocabulary.'
                      : 'Generate dialogue without vocabulary constraints.'}
                  </span>
                </div>
              </label>

              {errorMsg && (
                <div className="p-3 rounded-[8px] bg-red-500/10 border border-red-500/20 text-[12px] text-red-500">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Pinned Action Bar */}
            <div className="shrink-0 px-5 py-4 bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shadow-[0_-6px_20px_rgba(0,0,0,0.07)] flex flex-col gap-2 pb-[calc(1rem+env(safe-area-inset-bottom))]">
              <Button
                variant="primary"
                size="lg"
                onClick={handleGenerate}
                disabled={isGenerating}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4" />}
                className="w-full justify-center font-bold text-[15px] py-3.5"
              >
                {isGenerating ? 'Generating...' : 'Generate Dialogue'}
              </Button>
              <div className="flex items-center justify-between text-[11px] text-[var(--ink-muted)] px-0.5">
                <span>Approx. 10–20 seconds</span>
                <span className="font-arabic text-[13px] text-[var(--accent-ochre)]">إِنْشَاء حِوَار</span>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
