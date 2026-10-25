'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Shuffle, RotateCw, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Word } from '@/lib/types';
import { DeckCounts } from '@/lib/srs';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { FlashcardStudyCard } from '../_components/FlashcardStudyCard';
import { SRSActionButtons } from '../_components/SRSActionButtons';
import { RecallTipCard } from '../_components/RecallTipCard';
import { SessionProgressCard } from '../_components/SessionProgressCard';
import { FlashcardDeckQueue } from '../_components/FlashcardDeckQueue';
import { KeyboardShortcutsCard } from '../_components/KeyboardShortcutsCard';
import { SessionCompletedSection } from './SessionCompletedSection';

interface FlashcardStudyArenaProps {
  initialFilter?: string;
  initialMode?: string;
  initialStatus?: string;
  onSessionComplete?: () => void;
}

interface QueueResponse {
  words: Word[];
  counts: DeckCounts;
  total: number;
}

export const FlashcardStudyArena: React.FC<FlashcardStudyArenaProps> = ({
  initialFilter = 'smart',
  initialMode,
  initialStatus,
  onSessionComplete,
}) => {
  const router = useRouter();
  const [words, setWords] = useState<Word[]>([]);
  const [counts, setCounts] = useState<DeckCounts | null>(null);
  const [totalWords, setTotalWords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [studiedCount, setStudiedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Casual Free Practice mode (does not alter SRS schedules)
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(initialMode === 'practice');
  const [practiceDeckLabel, setPracticeDeckLabel] = useState<string>('');
  const [sessionRatedWords, setSessionRatedWords] = useState<Record<string, 1 | 2 | 3 | 4>>({});

  useEffect(() => {
    fetchWords();
  }, [filter]);

  const fetchWords = async () => {
    setLoading(true);
    setIsCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionRatedWords({});

    try {
      let practicePayload: { ids?: string[]; tab?: string; label?: string; practiceOnly?: boolean } | null = null;
      try {
        const stored = sessionStorage.getItem('fasih_practice_deck');
        if (stored) practicePayload = JSON.parse(stored);
      } catch (_) {}

      const params = new URLSearchParams();
      if (initialMode === 'practice' || practicePayload?.practiceOnly) {
        setIsPracticeMode(true);
        params.set('practice', 'true');
        if (practicePayload?.ids?.length) {
          params.set('ids', practicePayload.ids.join(','));
        }
        const statusTab = practicePayload?.tab || initialStatus;
        if (statusTab) {
          params.set('status', statusTab);
          setPracticeDeckLabel(
            practicePayload?.label || `${initialStatus ? initialStatus.toUpperCase() : statusTab.toUpperCase()} Deck`
          );
        }
      } else {
        params.set('deck', filter);
      }

      const res = await fetch(`/api/words/queue?${params.toString()}`);
      const data: QueueResponse = await res.json();
      const rawWords = data?.words || [];

      // Limit to 20 cards by default
      setWords(rawWords.slice(0, 20));
      if (data?.counts) setCounts(data.counts);
      if (typeof data?.total === 'number') setTotalWords(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFinishEarly = () => {
    setIsCompleted(true);
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 },
    });
    if (onSessionComplete) onSessionComplete();
  };

  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleNextCard = () => {
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setStudiedCount((prev) => prev + 1);
    } else {
      setStudiedCount((prev) => prev + 1);
      setIsCompleted(true);
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.6 },
      });
      if (onSessionComplete) onSessionComplete();
    }
  };

  const handlePrevCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleCardRating = async (rating: 1 | 2 | 3 | 4) => {
    if (isSubmitting || !words[currentIndex]) return;
    setIsSubmitting(true);
    const currentWord = words[currentIndex];
    const willRequeue = rating === 1 && !currentWord.isRequeued;
    const nextDeckLength = words.length + (willRequeue ? 1 : 0);

    if (isPracticeMode) {
      setStudiedCount((prev) => prev + 1);
      if (currentIndex + 1 < nextDeckLength) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex((prev) => Math.min(prev + 1, nextDeckLength - 1));
        }, 120);
      } else {
        setIsCompleted(true);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
      setIsSubmitting(false);
      return;
    }

    const isAlreadyRated = !!sessionRatedWords[currentWord.id];

    try {
      const res = await fetch(`/api/words/${currentWord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          recordSession: true,
          isUpdateRating: isAlreadyRated,
        }),
      });

      if (res.ok) {
        const updatedWord: Word = await res.json();
        setWords((prevWords) => {
          const updated = prevWords.map((w, idx) => (idx === currentIndex ? { ...w, ...updatedWord } : w));
          if (rating === 1 && !prevWords[currentIndex]?.isRequeued) {
            const reinsertIndex = Math.min(updated.length, currentIndex + 4);
            const repeatWord = { ...updatedWord, isRequeued: true };
            updated.splice(reinsertIndex, 0, repeatWord);
          }
          return updated;
        });
        setSessionRatedWords((prev) => ({ ...prev, [currentWord.id]: rating }));
      }

      if (!isAlreadyRated) {
        setStudiedCount((prev) => prev + 1);
      }

      if (currentIndex + 1 < nextDeckLength) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex((prev) => Math.min(prev + 1, nextDeckLength - 1));
        }, 120);
      } else {
        setIsCompleted(true);
        confetti({
          particleCount: 70,
          spread: 60,
          origin: { y: 0.6 },
        });
        if (onSessionComplete) onSessionComplete();
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (isPracticeMode) {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          handleNextCard();
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          handlePrevCard();
        } else if (e.key.toLowerCase() === 's') {
          handleShuffle();
        }
      } else if (isFlipped) {
        if (e.key === '1') handleCardRating(1);
        else if (e.key === '2') handleCardRating(2);
        else if (e.key === '3') handleCardRating(3);
        else if (e.key === '4') handleCardRating(4);
      } else {
        if (e.key === 'ArrowRight' || e.key === 'Enter') {
          setIsFlipped(true);
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          handlePrevCard();
        } else if (e.key.toLowerCase() === 's') {
          handleShuffle();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, words, isPracticeMode]);

  const currentWord = words[currentIndex];

  if (loading) {
    return (
      <div className="py-24 text-center text-[var(--ink-secondary)] space-y-3">
        <div className="font-arabic text-4xl text-[var(--accent-ochre)] animate-pulse">
          جَارٍ تَحْمِيلُ البِطَاقَاتِ...
        </div>
        <p className="text-sm font-semibold">Loading your flashcards...</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-8 border border-dashed border-[var(--border-subtle)] rounded-[12px] bg-[var(--bg-surface)] space-y-4">
        <span className="font-arabic text-4xl text-[var(--accent-ochre)] font-bold">مُمْتَاز</span>
        <h3 className="text-[22px] font-semibold text-[var(--ink-primary)]">
          {filter === 'smart' ? 'All Caught Up! 🎉' : 'No Flashcards Ready'}
        </h3>
        <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
          {filter === 'smart'
            ? 'Great work! All your active words are currently practiced. They will reappear when their scheduled review date arrives.'
            : 'Your review deck is currently clear.'}
        </p>
        <Button
          variant="primary"
          size="md"
          onClick={() => setFilter('all')}
        >
          Practice All Words ({totalWords}) Anyway
        </Button>
      </div>
    );
  }

  if (isCompleted || !currentWord) {
    return (
      <SessionCompletedSection
        studiedCount={studiedCount}
        totalCards={words.length}
        isPracticeMode={isPracticeMode}
        practiceDeckLabel={practiceDeckLabel}
        onRestart={() => {
          setCurrentIndex(0);
          setIsCompleted(false);
          setIsFlipped(false);
          fetchWords();
        }}
      />
    );
  }

  return (
    <div className="p-3.5 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-4 sm:gap-6 animate-fadeIn">
      {/* ==================== 1. MOBILE STUDY HEADER (< sm) ==================== */}
      <div className="sm:hidden flex flex-col gap-2.5 pb-1">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between gap-2">
          {/* Exit / End Session */}
          <button
            type="button"
            onClick={handleFinishEarly}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[12px] font-medium text-[var(--ink-secondary)] active:scale-95 shadow-2xs hover:text-[var(--ink-primary)] transition-all cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
            <span>End session</span>
          </button>

          {/* Deck Title & Current Counter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-[var(--ink-primary)] max-w-[140px] truncate">
              {isPracticeMode ? practiceDeckLabel || 'Practice' : 'Saved Words'}
            </span>
            <span className="text-[11px] font-mono font-medium text-[var(--accent-ochre)] bg-[var(--bg-surface)] border border-[var(--border-subtle)] px-2 py-0.5 rounded-full shadow-2xs">
              {currentIndex + 1} / {words.length}
            </span>
          </div>

          {/* Shuffle Icon Button */}
          <button
            type="button"
            onClick={handleShuffle}
            title="Shuffle deck"
            className="p-1.5 rounded-[8px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] text-[var(--ink-secondary)] active:scale-95 shadow-2xs hover:text-[var(--ink-primary)] transition-all cursor-pointer"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-[var(--border-subtle)]/70 h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[var(--accent-ochre)] h-full transition-all duration-300 rounded-full"
            style={{ width: `${Math.round(((currentIndex + 1) / words.length) * 100)}%` }}
          />
        </div>

        {/* Sub-label */}
        <div className="flex items-center justify-between text-[11px] text-[var(--ink-secondary)] px-0.5 font-mono">
          <span>Arabic → English</span>
          <span>{Math.max(0, words.length - (currentIndex + 1))} remaining</span>
        </div>
      </div>

      {/* ==================== 2. DESKTOP PAGE HEADING AREA (>= sm) ==================== */}
      <div className="hidden sm:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[28px] leading-[38px] sm:leading-[42px] font-semibold text-[var(--ink-primary)] tracking-tight">
            Practice Flashcards
          </h1>
          <p className="text-[13px] sm:text-[14px] leading-[21px] text-[var(--ink-secondary)]">
            Strengthen your memory, one word at a time.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={handleFinishEarly}
        >
          End session
        </Button>
      </div>

      {/* Desktop Controls & Filter Bar (>= sm) */}
      <div className="hidden sm:flex flex-row items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3">
          <span className="text-[13px] font-semibold text-[var(--ink-primary)]">
            {isPracticeMode ? practiceDeckLabel || 'Practice Deck' : 'Saved Words'}
          </span>
          <Badge variant="ochre">
            {words.length} cards
          </Badge>
          <span className="hidden md:inline text-[12px] text-[var(--ink-secondary)]">
            Learning schedule & review order will not be changed
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          leftIcon={<Shuffle className="w-3.5 h-3.5" />}
          onClick={handleShuffle}
        >
          Shuffle
        </Button>
      </div>

      {/* ==================== 3. MAIN STUDY ARENA ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
        {/* Left Column: Flashcard & Controls (8 of 12 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-3 sm:gap-4">
          {/* Card Counter Header (Desktop only, mobile has it in top bar) */}
          <div className="hidden sm:flex items-center justify-between text-[12px] leading-[18px] text-[var(--ink-secondary)] px-1">
            <span>
              Card {currentIndex + 1} of {words.length}
            </span>
            <span className="font-mono text-[11px]">
              Arabic → English
            </span>
          </div>

          {/* Flashcard Component */}
          <FlashcardStudyCard
            word={currentWord}
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped((prev) => !prev)}
            isPracticeMode={isPracticeMode}
          />

          {/* Navigation & SRS Rating Controls */}
          <div className="pt-1">
            <SRSActionButtons
              isFlipped={isFlipped}
              onFlip={() => setIsFlipped((prev) => !prev)}
              onPrev={handlePrevCard}
              onNext={handleNextCard}
              canPrev={currentIndex > 0}
              onRate={handleCardRating}
              isSubmitting={isSubmitting}
              word={currentWord}
              isPracticeMode={isPracticeMode}
            />
          </div>

          {/* Learning Tip Card (Hidden on mobile to preserve vertical space) */}
          <div className="hidden sm:block">
            <RecallTipCard />
          </div>

          {/* Mobile collapsible queue view */}
          <details className="lg:hidden mt-2 group rounded-[10px] border border-[var(--border-subtle)] bg-[var(--bg-surface)] overflow-hidden">
            <summary className="text-[12px] font-medium text-[var(--ink-secondary)] cursor-pointer px-4 py-2.5 flex items-center justify-between select-none hover:text-[var(--ink-primary)] transition-colors list-none">
              <span>Deck Queue ({words.length} cards)</span>
              <span className="text-[11px] text-[var(--accent-ochre)] font-mono group-open:rotate-180 transition-transform">▼</span>
            </summary>
            <div className="border-t border-[var(--border-subtle)]">
              <FlashcardDeckQueue
                words={words}
                currentIndex={currentIndex}
                onSelectIndex={(idx) => {
                  setCurrentIndex(idx);
                  setIsFlipped(false);
                }}
              />
            </div>
          </details>
        </div>

        {/* Right Column: Widgets Stack (4 of 12 columns, desktop only) */}
        <div className="hidden lg:flex lg:col-span-4 flex-col gap-5">
          {/* Widget 1: Session Progress */}
          <SessionProgressCard
            currentIndex={currentIndex + 1}
            totalCards={words.length}
            studiedCount={studiedCount}
          />

          {/* Widget 2: Deck Queue Preview */}
          <FlashcardDeckQueue
            words={words}
            currentIndex={currentIndex}
            onSelectIndex={(idx) => {
              setCurrentIndex(idx);
              setIsFlipped(false);
            }}
          />

          {/* Widget 3: Keyboard Shortcuts Guide */}
          <KeyboardShortcutsCard />
        </div>
      </div>
    </div>
  );
};
