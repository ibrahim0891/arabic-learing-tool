'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-canvas)] overflow-hidden">
      {/* Sub-Header Toolbar */}
      <div className="h-[56px] sm:h-[64px] px-3 sm:px-6 flex items-center justify-between gap-2 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)] shrink-0 z-10">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-1.5 rounded-[8px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] transition cursor-pointer shrink-0"
            title="Toggle history"
            aria-label="Toggle dialogues list"
          >
            <History className="w-4 h-4" />
          </button>

          <div className="hidden sm:flex w-8 h-8 rounded-[8px] bg-[var(--bg-accent-tint)] items-center justify-center shrink-0 text-[var(--accent-ochre)]">
            <MessageSquare className="w-4 h-4" />
          </div>

          <div className="flex flex-col min-w-0 justify-center">
            <div className="flex items-center gap-1.5 min-w-0">
              <h1 className="text-[13px] sm:text-[16px] font-semibold text-[var(--ink-primary)] tracking-tight truncate">
                {activeConversation ? activeConversation.title : 'Spoken Dialogues'}
              </h1>
              {activeConversation && (
                <div className="hidden sm:inline-flex shrink-0">
                  <Badge variant="ochre" className="capitalize text-[10px]">
                    {activeConversation.difficulty}
                  </Badge>
                </div>
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

      {/* Main Split: Left Dialogues List + Right Chat Feed */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        {/* Left Sidebar: Conversations List */}
        <aside
          className={`w-72 sm:w-80 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col shrink-0 transition-transform duration-200 z-20 md:static md:translate-x-0 ${
            isMobileSidebarOpen
              ? 'absolute inset-y-0 left-0 shadow-xl translate-x-0'
              : 'absolute inset-y-0 left-0 -translate-x-full md:translate-x-0'
          }`}
        >
          {/* Search Bar */}
          <div className="p-3 border-b border-[var(--border-subtle)] flex flex-col gap-2">
            <div className="flex items-center justify-between text-[12px] px-1">
              <span className="font-semibold text-[var(--ink-primary)]">
                Dialogues
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
                className="w-full pl-8 pr-3 py-1.5 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[12px] text-[var(--ink-primary)] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] transition"
              />
            </div>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
            {isLoadingHistory && historyList.length === 0 ? (
              <div className="p-8 text-center text-[12px] text-[var(--ink-secondary)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-ochre)]" />
                <span>Loading dialogues...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-8 text-center text-[12px] text-[var(--ink-secondary)] flex flex-col items-center gap-2">
                <p>No dialogues found.</p>
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(true)}>
                  Create one now
                </Button>
              </div>
            ) : (
              filteredHistory.map((conv) => {
                const isSelected = activeConversation?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`relative p-3 rounded-[8px] cursor-pointer transition-colors flex items-start gap-3 select-none group border ${
                      isSelected
                        ? 'bg-[var(--bg-accent-tint)] border-[var(--border-accent)]'
                        : 'bg-[var(--bg-surface)] border-transparent hover:bg-[var(--bg-canvas)]'
                    }`}
                  >
                    {/* Speaker initial pill */}
                    <div className={`w-8 h-8 rounded-[8px] font-arabic font-bold flex items-center justify-center text-sm shrink-0 border ${
                      isSelected
                        ? 'bg-[var(--accent-ochre)] text-white border-transparent'
                        : 'bg-[var(--bg-accent-tint)] text-[var(--accent-ochre)] border-[var(--border-accent)]'
                    }`}>
                      {conv.speakers[0] ? conv.speakers[0].charAt(0) : 'ح'}
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col gap-1">
                      <h3 className={`font-semibold text-[13px] leading-[18px] truncate pr-5 ${
                        isSelected ? 'text-[var(--accent-ochre)]' : 'text-[var(--ink-primary)]'
                      }`}>
                        {conv.title}
                      </h3>

                      {lastMsg && (
                        <p dir="rtl" className="font-arabic text-[13px] leading-[18px] text-[var(--ink-secondary)] truncate">
                          {lastMsg.arabic}
                        </p>
                      )}

                      <div className="flex items-center justify-between gap-2 text-[10px] text-[var(--ink-secondary)] pt-0.5">
                        <span className="truncate">{conv.speakers.join(', ')}</span>
                        <span className="shrink-0">{conv.messages.length} lines</span>
                      </div>
                    </div>

                    {/* Delete hover button */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="absolute top-2.5 right-2 opacity-0 group-hover:opacity-100 p-1 text-[var(--ink-muted)] hover:text-red-500 hover:bg-red-500/10 rounded-[6px] transition"
                      title="Delete chat"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </aside>

        {/* Mobile drawer backdrop */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-10 bg-black/40 backdrop-blur-xs"
          />
        )}

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

      {/* New Dialogue Creation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg rounded-[12px] bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--accent-ochre)]" />
                <h3 className="text-[16px] font-semibold text-[var(--ink-primary)]">
                  Generate New Arabic Dialogue
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-[6px] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-canvas)] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex flex-col gap-4 text-[12px]">
              {/* Difficulty */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[var(--ink-primary)]">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`capitalize py-2 px-3 rounded-[8px] text-[12px] font-semibold border transition cursor-pointer ${
                        difficulty === d
                          ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] shadow-2xs'
                          : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Predefined Scenarios */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[var(--ink-primary)]">
                  Predefined Scenarios
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {PRESET_TOPICS.map((pt) => {
                    const isSelected = selectedPreset === pt.id && !customTopic.trim();
                    return (
                      <button
                        key={pt.id}
                        type="button"
                        onClick={() => {
                          setSelectedPreset(pt.id);
                          setCustomTopic('');
                        }}
                        className={`py-1.5 px-3 rounded-[8px] text-[12px] border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--bg-accent-tint)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] font-semibold'
                            : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)]'
                        }`}
                      >
                        {pt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Topic Input */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-[var(--ink-primary)]">
                  Or Custom Situation / Topic
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asking for gym membership discount or booking a ride..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[12px] placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] transition"
                />
              </div>

              {/* Speakers & Length */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[var(--ink-primary)] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[var(--ink-secondary)]" />
                    <span>Speakers</span>
                  </label>
                  <select
                    value={speakerCount}
                    onChange={(e) => setSpeakerCount(Number(e.target.value))}
                    className="w-full p-2 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[12px] font-medium focus:outline-none"
                  >
                    <option value={2}>2 People</option>
                    <option value={3}>3 People</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="font-semibold text-[var(--ink-primary)]">
                    Dialogue Length
                  </label>
                  <select
                    value={turnsCount}
                    onChange={(e) => setTurnsCount(Number(e.target.value))}
                    className="w-full p-2 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[12px] font-medium focus:outline-none"
                  >
                    <option value={4}>4 turns (Quick)</option>
                    <option value={6}>6 turns (Standard)</option>
                    <option value={8}>8 turns (Extended)</option>
                    <option value={10}>10 turns (Deep)</option>
                  </select>
                </div>
              </div>

              {/* Word Bank Integration Toggle */}
              <label className="flex items-start gap-3 p-3 rounded-[8px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-ochre)]/40 transition select-none">
                <input
                  type="checkbox"
                  checked={includeKnownWords}
                  onChange={(e) => setIncludeKnownWords(e.target.checked)}
                  className="mt-0.5 accent-[var(--accent-ochre)] rounded cursor-pointer w-4 h-4"
                />
                <div className="flex-1">
                  <span className="block text-[12px] font-semibold text-[var(--ink-primary)]">
                    Incorporate words from my Word Bank
                  </span>
                  <span className="block text-[11px] text-[var(--ink-secondary)] mt-0.5 leading-snug">
                    {includeKnownWords
                      ? 'Gemini will intelligently weave in relevant saved words from your vocabulary.'
                      : 'Create dialogue without existing vocabulary constraints.'}
                  </span>
                </div>
              </label>

              {errorMsg && (
                <div className="p-3 rounded-[8px] bg-red-500/10 border border-red-500/20 text-[12px] text-red-500">
                  {errorMsg}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] shrink-0">
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleGenerate}
                disabled={isGenerating}
                isLoading={isGenerating}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isGenerating ? 'Generating...' : 'Generate Dialogue'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
