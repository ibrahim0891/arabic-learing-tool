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
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { ConversationSession, ChatMessage } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';
import { Button } from './ui/Button';

const PRESET_TOPICS = [
  { id: 'cafe', label: 'Ordering at a Cafe', prompt: 'Two friends meeting at a lively coffee shop ordering drinks and discussing their day.' },
  { id: 'airport', label: 'At the Airport & Travel', prompt: 'Asking directions, checking luggage, and passport control at the airport.' },
  { id: 'market', label: 'Souq & Haggling Prices', prompt: 'A customer inquiring about fruit and spices at a traditional market and discussing prices.' },
  { id: 'weekend', label: 'Weekend Plans with Friends', prompt: 'Friends deciding whether to go to the beach or dinner this weekend.' },
  { id: 'work', label: 'Work & Professional Chat', prompt: 'Two colleagues discussing a project milestone and setting up a meeting.' },
];

const AVATAR_PALETTES = [
  'from-amber-500/20 to-orange-500/20 text-amber-500 border-amber-500/30',
  'from-emerald-500/20 to-teal-500/20 text-emerald-500 border-emerald-500/30',
  'from-sky-500/20 to-blue-500/20 text-sky-500 border-sky-500/30',
  'from-rose-500/20 to-pink-500/20 text-rose-500 border-rose-500/30',
  'from-violet-500/20 to-purple-500/20 text-violet-500 border-violet-500/30',
];

const SPEAKER_STYLES = [
  {
    badge: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
    bubble: 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]/50 shadow-xs',
    avatar: 'bg-gradient-to-br from-amber-500/20 to-amber-600/30 text-amber-600 dark:text-amber-400 border-amber-500/30',
  },
  {
    badge: 'bg-[#9a5d16]/15 text-[#9a5d16] dark:text-[#e09848] border-[#9a5d16]/30',
    bubble: 'bg-gradient-to-br from-[#9a5d16]/12 via-[#9a5d16]/8 to-[var(--bg-surface-elevated)] border border-[#9a5d16]/30 hover:border-[#9a5d16]/55 shadow-xs',
    avatar: 'bg-gradient-to-br from-[#9a5d16]/25 to-[#9a5d16]/40 text-[#9a5d16] dark:text-[#e09848] border-[#9a5d16]/35',
  },
  {
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    bubble: 'bg-gradient-to-br from-emerald-500/10 to-[var(--bg-surface-elevated)] border border-emerald-500/30 hover:border-emerald-500/50 shadow-xs',
    avatar: 'bg-gradient-to-br from-emerald-500/20 to-emerald-600/30 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  },
];

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

  // Interactive message bubble state: tracks which message has its translation/transliteration revealed
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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
      try {
        setIsLoadingHistory(true);
        const res = await fetch('/api/conversations');
        if (res.ok) {
          const data = await res.json();
          const list: ConversationSession[] = data.conversations || [];
          setHistoryList(list);

          // If no active conversation in localStorage or state, default to the latest one
          if (!activeConversation && list.length > 0) {
            setActiveConversation(list[0]);
            try {
              localStorage.setItem('fasih_active_conversation', JSON.stringify(list[0]));
            } catch (_) {}
          }
        }
      } catch (err) {
        console.warn('Could not load conversations:', err);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    fetchHistory();
  }, []);

  const handleSelectConversation = (conv: ConversationSession) => {
    setActiveConversation(conv);
    setExpandedMessageId(null);
    try {
      localStorage.setItem('fasih_active_conversation', JSON.stringify(conv));
    } catch (_) {}
    setIsMobileSidebarOpen(false);
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setErrorMsg(null);

    const topicLabel = customTopic.trim()
      ? customTopic.trim()
      : PRESET_TOPICS.find((p) => p.id === selectedPreset)?.prompt || 'Everyday conversation';

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: topicLabel,
          difficulty,
          speakerCount,
          turns: turnsCount,
          includeKnownWords,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to generate dialogue');
      }

      const data = await res.json();
      if (data.conversation) {
        const newConv: ConversationSession = data.conversation;
        setActiveConversation(newConv);
        setHistoryList((prev) => [newConv, ...prev.filter((c) => c.id !== newConv.id)]);
        setExpandedMessageId(null);
        try {
          localStorage.setItem('fasih_active_conversation', JSON.stringify(newConv));
        } catch (_) {}
        setIsModalOpen(false);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || 'Error communicating with AI service');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await fetch(`/api/conversations?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
      setHistoryList((prev) => prev.filter((c) => c.id !== id));
      if (activeConversation?.id === id) {
        const remaining = historyList.filter((c) => c.id !== id);
        const nextActive = remaining.length > 0 ? remaining[0] : null;
        setActiveConversation(nextActive);
        if (nextActive) {
          localStorage.setItem('fasih_active_conversation', JSON.stringify(nextActive));
        } else {
          localStorage.removeItem('fasih_active_conversation');
        }
      }
      setConfirmDeleteId(null);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const filteredHistory = historyList.filter((c) =>
    c.title.toLowerCase().includes(searchHistory.toLowerCase()) ||
    c.topic.toLowerCase().includes(searchHistory.toLowerCase()) ||
    c.speakers.some((s) => s.toLowerCase().includes(searchHistory.toLowerCase()))
  );

  return (
    <div className="w-full h-full flex flex-col bg-[var(--bg-surface)] overflow-hidden font-sans">
      
      {/* Top Messenger Header Bar (Lively & Polished) */}
      <header className="h-14 px-4 sm:px-6 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] flex items-center justify-between gap-3 shrink-0 shadow-xs">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile sidebar toggle button */}
          <button
            type="button"
            onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            className="md:hidden p-1.5 rounded-lg text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] hover:bg-[var(--accent-ochre-dim)] transition cursor-pointer"
            aria-label="Toggle Conversations List"
          >
            <History className="w-4 h-4 text-[var(--accent-ochre)]" />
          </button>

          {/* Icon Badge with warm gradient */}
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#9a5d16] to-[#b87320] text-white font-bold flex items-center justify-center shrink-0 shadow-xs">
            <MessageSquare className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="font-semibold text-sm sm:text-base text-[var(--ink-primary)] truncate tracking-tight">
                {activeConversation ? activeConversation.title : 'Spoken Arabic Dialogues'}
              </h1>
              {activeConversation && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] px-2 py-0.5 rounded-full border border-[var(--accent-ochre)]/25 font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {activeConversation.difficulty}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--ink-muted)] truncate flex items-center gap-1.5">
              {activeConversation ? (
                <>
                  <span className="font-medium text-[var(--ink-secondary)]">{activeConversation.speakers.join(' & ')}</span>
                  <span>•</span>
                  <span className="font-mono">{activeConversation.messages.length} lines</span>
                </>
              ) : (
                'Select an existing dialogue or generate a new conversation'
              )}
            </p>
          </div>
        </div>

        {/* Action Controls: New Conversation Button & Active Delete */}
        <div className="flex items-center gap-2 shrink-0">
          {activeConversation && (
            <button
              type="button"
              onClick={() => setConfirmDeleteId(confirmDeleteId ? null : activeConversation.id)}
              className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-2 rounded-lg transition cursor-pointer border border-transparent hover:border-red-500/20"
              title="Delete this conversation"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#9a5d16] to-[#b87320] hover:from-[#834e10] hover:to-[#9a5d16] text-white shadow-xs hover:shadow transition transform active:scale-[0.98] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Conversation</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>
      </header>

      {/* Main Split Layout: Left Conversations List + Right Chat Feed */}
      <div className="flex-1 min-h-0 flex overflow-hidden relative">
        
        {/* Left Sidebar: Conversations History List (Vibrant & Structured) */}
        <aside
          className={`w-64 sm:w-72 lg:w-80 border-r border-[var(--border-subtle)] bg-[var(--bg-surface)] flex flex-col shrink-0 transition-transform duration-200 z-20 md:static md:translate-x-0 ${
            isMobileSidebarOpen
              ? 'absolute inset-y-0 left-0 shadow-2xl translate-x-0'
              : 'absolute inset-y-0 left-0 -translate-x-full md:translate-x-0'
          }`}
        >
          {/* Search Bar & Counter */}
          <div className="p-3 border-b border-[var(--border-subtle)] space-y-2 bg-[var(--bg-surface-elevated)]">
            <div className="flex items-center justify-between text-xs px-0.5">
              <span className="font-semibold text-[var(--ink-secondary)] flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-[var(--accent-ochre)]" />
                <span>Conversations</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-muted)]">
                {historyList.length} chats
              </span>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--ink-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by topic or speaker..."
                value={searchHistory}
                onChange={(e) => setSearchHistory(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] focus:ring-1 focus:ring-[var(--accent-ochre)]/30 transition"
              />
            </div>
          </div>

          {/* Conversations List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]/40">
            {isLoadingHistory && historyList.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--ink-muted)] flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[var(--accent-ochre)]" />
                <span>Loading chats...</span>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="p-6 text-center text-xs text-[var(--ink-muted)] space-y-2.5">
                <p>No conversations found.</p>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(true)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)] text-[var(--ink-primary)] cursor-pointer hover:bg-[var(--accent-ochre-dim)] transition"
                >
                  Create one now
                </button>
              </div>
            ) : (
              filteredHistory.map((conv, idx) => {
                const isSelected = activeConversation?.id === conv.id;
                const lastMsg = conv.messages[conv.messages.length - 1];
                const palette = AVATAR_PALETTES[idx % AVATAR_PALETTES.length];

                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`p-3 cursor-pointer transition-all flex items-start gap-3 select-none group border-l-3 ${
                      isSelected
                        ? 'bg-[var(--accent-ochre-dim)]/70 border-[var(--accent-ochre)] shadow-xs'
                        : 'hover:bg-[var(--bg-surface-elevated)] border-transparent'
                    }`}
                  >
                    {/* Vibrant Initial Avatar */}
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${palette} font-arabic font-bold flex items-center justify-center text-sm shrink-0 mt-0.5 shadow-xs border`}>
                      {conv.speakers[0] ? conv.speakers[0].charAt(0) : 'ح'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <h3 className="font-semibold text-xs text-[var(--ink-primary)] truncate">
                          {conv.title}
                        </h3>
                        <span className="text-[9px] text-[var(--accent-ochre)] font-mono shrink-0 uppercase bg-[var(--accent-ochre-dim)] px-1.5 py-0.2 rounded-xs border border-[var(--accent-ochre)]/20 font-bold">
                          {conv.difficulty.slice(0, 3)}
                        </span>
                      </div>

                      {/* Arabic snippet from last message */}
                      {lastMsg && (
                        <p className="text-[12px] text-[var(--ink-secondary)] font-arabic truncate text-right dir-rtl leading-snug">
                          {lastMsg.arabic}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)] mt-1 font-mono">
                        <span className="truncate">{conv.speakers.join(', ')}</span>
                        <span>{conv.messages.length} lines</span>
                      </div>
                    </div>

                    {/* Quick Delete button on hover */}
                    <button
                      type="button"
                      onClick={(e) => handleDelete(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-[var(--ink-muted)] hover:text-red-400 hover:bg-red-500/10 rounded-md transition shrink-0"
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

        {/* Backdrop for mobile drawer */}
        {isMobileSidebarOpen && (
          <div
            onClick={() => setIsMobileSidebarOpen(false)}
            className="md:hidden fixed inset-0 z-10 bg-black/40 backdrop-blur-xs"
          />
        )}

        {/* Right Area: Interactive Chat Feed with Ambient Texture */}
        <main className="flex-1 flex flex-col bg-[var(--bg-primary)]/80 relative overflow-hidden min-w-0">
          
          {/* Ambient subtle background grid for chat atmosphere */}
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.035] dark:opacity-[0.06]"
            style={{
              backgroundImage: `radial-gradient(var(--ink-primary) 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
            }}
          />

          {/* Active Delete Confirmation Bar */}
          {activeConversation && confirmDeleteId === activeConversation.id && (
            <div className="flex items-center justify-between p-2.5 px-5 bg-red-500/10 border-b border-red-500/20 text-xs text-red-300 animate-fadeIn shrink-0 z-10">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Delete this conversation from your saved history?</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-2.5 py-1 rounded-md bg-[var(--bg-surface)] text-[var(--ink-secondary)] cursor-pointer text-xs border border-[var(--border-subtle)]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(activeConversation.id)}
                  className="px-3 py-1 rounded-md bg-red-600 text-white font-semibold cursor-pointer hover:bg-red-700 text-xs"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          )}

          {activeConversation ? (
            <div className="flex-1 flex flex-col overflow-hidden relative z-0">
              {/* Scrollable Chat Feed Area */}
              <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
                
                {/* Topic context pill */}
                <div className="text-center py-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[11px] text-[var(--ink-muted)] shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[var(--accent-ochre)]" />
                    Scenario: <strong className="text-[var(--ink-primary)] font-semibold">{activeConversation.topic}</strong>
                  </span>
                </div>

                {/* Message Bubbles */}
                {activeConversation.messages.map((msg, idx) => {
                  const speakerIndex = activeConversation.speakers.indexOf(msg.speakerName);
                  const isFirstSpeaker = speakerIndex <= 0;
                  const style = SPEAKER_STYLES[(speakerIndex >= 0 ? speakerIndex : idx) % SPEAKER_STYLES.length];
                  const isExpanded = expandedMessageId === msg.id;

                  return (
                    <div
                      key={msg.id || idx}
                      className={`flex flex-col ${isFirstSpeaker ? 'items-start' : 'items-end'} space-y-1`}
                    >
                      {/* Speaker Badge */}
                      <div className="flex items-center gap-1.5 px-1 font-arabic">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${style.badge}`}>
                          {msg.speakerName}
                          {msg.speakerRole && (
                            <span className="text-[10px] opacity-75 font-normal">({msg.speakerRole})</span>
                          )}
                        </span>
                      </div>

                      {/* Interactive Chat Bubble */}
                      <div className="relative group chat-bubble-container max-w-[90%] sm:max-w-[76%]">
                        <div
                          onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                          className={`p-4 sm:p-5 rounded-2xl cursor-pointer transition-all duration-200 select-none ${style.bubble} ${
                            isFirstSpeaker ? 'rounded-tl-xs' : 'rounded-tr-xs'
                          }`}
                        >
                          {/* Arabic Spoken Message */}
                          <div className="flex items-start justify-between gap-3">
                            <p
                              dir="rtl"
                              className="font-arabic text-xl sm:text-2xl font-semibold text-[var(--ink-primary)] harakat-text leading-relaxed text-right flex-1"
                            >
                              {msg.arabic}
                            </p>

                            {/* Audio Listen Button with subtle hover glow */}
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="shrink-0 opacity-80 group-hover:opacity-100 transition-opacity mt-0.5"
                            >
                              <AudioPronounceButton
                                arabicText={msg.arabic}
                                size="sm"
                                title="Listen to authentic spoken pronunciation"
                              />
                            </div>
                          </div>

                          {/* Reveal translation helper hint */}
                          <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-[var(--ink-muted)] font-mono">
                            <span>{isExpanded ? 'Click to hide translation' : 'Click to see translation & transliteration'}</span>
                            {isExpanded ? <ChevronUp className="w-3 h-3 text-[var(--accent-ochre)]" /> : <ChevronDown className="w-3 h-3" />}
                          </div>

                          {/* Expanded Transliteration & English Translation */}
                          {isExpanded && (
                            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2 animate-fadeIn text-left bg-[var(--bg-surface-elevated)]/60 -mx-1 p-3 rounded-xl border border-[var(--border-subtle)]/70">
                              {msg.transliteration && (
                                <div className="space-y-0.5">
                                  <span className="text-[9px] uppercase tracking-wider font-mono text-[var(--accent-ochre)] font-bold">Pronunciation:</span>
                                  <p className="text-xs sm:text-sm font-mono text-[var(--ink-secondary)] font-medium">
                                    {msg.transliteration}
                                  </p>
                                </div>
                              )}
                              <div className="space-y-0.5">
                                <span className="text-[9px] uppercase tracking-wider font-mono text-[var(--ink-muted)] font-bold">Meaning:</span>
                                <p className="text-xs sm:text-sm text-[var(--ink-primary)] italic font-serif">
                                  "{msg.english}"
                                </p>
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

              {/* Chat Bottom Helper Banner */}
              <div className="h-9 px-4 sm:px-6 bg-[var(--bg-surface-elevated)] border-t border-[var(--border-subtle)] text-[11px] text-[var(--ink-muted)] flex items-center justify-between shrink-0 font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent-ochre)]" />
                  Tap any bubble to reveal phonetics and translation
                </span>
                <span>{activeConversation.messages.length} messages</span>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#9a5d16]/20 to-[#b87320]/20 text-[var(--accent-ochre)] flex items-center justify-center border border-[var(--accent-ochre)]/30 shadow-inner">
                <MessageSquare className="w-7 h-7" />
              </div>
              <div className="space-y-1.5 max-w-sm">
                <h3 className="font-bold text-base text-[var(--ink-primary)]">
                  No conversation active
                </h3>
                <p className="text-xs text-[var(--ink-muted)] leading-relaxed">
                  Select a past dialogue from the left history or create a brand new conversation.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#9a5d16] to-[#b87320] hover:from-[#834e10] hover:to-[#9a5d16] text-white shadow-sm transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Conversation</span>
              </button>
            </div>
          )}
        </main>
      </div>

      {/* ================= NEW CONVERSATION MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-[var(--bg-surface)] border border-[var(--border-strong)] rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn max-h-[92vh]">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-gradient-to-br from-[#9a5d16] to-[#b87320] text-white shadow-xs">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[var(--ink-primary)]">
                    Create New Dialogue
                  </h3>
                  <p className="text-[11px] text-[var(--ink-muted)]">
                    Natural spoken Arabic with full diacritics
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--accent-ochre-dim)] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 space-y-4 overflow-y-auto text-xs">
              
              {/* Difficulty Level */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                  Difficulty Level
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['beginner', 'intermediate', 'advanced'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`capitalize py-2 px-3 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                        difficulty === d
                          ? 'bg-gradient-to-r from-[#9a5d16] to-[#b87320] text-white border-transparent shadow-xs'
                          : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Predefined Topics */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
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
                        className={`py-1.5 px-3 rounded-lg text-xs border transition cursor-pointer ${
                          isSelected
                            ? 'bg-[var(--accent-ochre-dim)] border-[var(--accent-ochre)] text-[var(--accent-ochre)] font-bold'
                            : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--accent-ochre)]'
                        }`}
                      >
                        {pt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Topic Input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                  Or Custom Topic / Situation
                </label>
                <input
                  type="text"
                  placeholder="e.g. Asking for gym membership discount or booking a ride..."
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs placeholder:text-[var(--ink-muted)] focus:outline-none focus:border-[var(--accent-ochre)] focus:ring-1 focus:ring-[var(--accent-ochre)]/30"
                />
              </div>

              {/* Number of Speakers & Length */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)] flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Speakers
                  </label>
                  <select
                    value={speakerCount}
                    onChange={(e) => setSpeakerCount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-medium focus:outline-none"
                  >
                    <option value={2}>2 People</option>
                    <option value={3}>3 People</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-[var(--ink-secondary)]">
                    Dialogue Length
                  </label>
                  <select
                    value={turnsCount}
                    onChange={(e) => setTurnsCount(Number(e.target.value))}
                    className="w-full p-2 rounded-lg bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-xs font-medium focus:outline-none"
                  >
                    <option value={4}>4 turns (Quick)</option>
                    <option value={6}>6 turns (Standard)</option>
                    <option value={8}>8 turns (Extended)</option>
                    <option value={10}>10 turns (Deep)</option>
                  </select>
                </div>
              </div>

              {/* Word Bank Integration Toggle */}
              <div className="pt-1">
                <label className="flex items-start gap-3 p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] cursor-pointer hover:border-[var(--accent-ochre)]/50 transition">
                  <input
                    type="checkbox"
                    checked={includeKnownWords}
                    onChange={(e) => setIncludeKnownWords(e.target.checked)}
                    className="mt-0.5 accent-[#9a5d16] rounded cursor-pointer w-4 h-4"
                  />
                  <div className="flex-1">
                    <span className="block text-xs font-semibold text-[var(--ink-primary)]">
                      Incorporate words from my Word Bank
                    </span>
                    <span className="block text-[11px] text-[var(--ink-muted)] mt-0.5 leading-snug">
                      {includeKnownWords
                        ? 'Gemini will intelligently weave in only contextually relevant words to keep the dialogue natural.'
                        : 'Omit Word Bank. Gemini will create a completely fresh dialogue without existing vocabulary constraints.'}
                    </span>
                  </div>
                </label>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  {errorMsg}
                </div>
              )}

              <div className="text-[11px] text-[var(--ink-muted)] flex items-start gap-2 bg-[var(--accent-ochre-dim)] p-3 rounded-xl border border-[var(--accent-ochre)]/20 leading-relaxed">
                <Info className="w-4 h-4 shrink-0 text-[var(--accent-ochre)] mt-0.5" />
                <span>
                  {includeKnownWords
                    ? 'Gemini 3.5 Flash Lite selectively integrates relevant known words into natural spoken dialogue with tashkeel.'
                    : 'Gemini 3.5 Flash Lite will generate natural spoken dialogue with tashkeel without Word Bank constraints.'}
                </span>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-[var(--border-subtle)] bg-[var(--bg-surface-elevated)] shrink-0">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:text-[var(--ink-primary)] cursor-pointer hover:bg-[var(--bg-surface)] transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-lg bg-gradient-to-r from-[#9a5d16] to-[#b87320] hover:from-[#834e10] hover:to-[#9a5d16] text-white shadow-sm transition cursor-pointer disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Dialogue</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
