'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  RotateCcw,
  Check,
  Shuffle,
  Volume2,
  Layers,
  Keyboard,
  CheckCircle2,
  Clock,
  Sparkles,
  BookmarkCheck,
  AlertCircle,
  BookOpen
} from 'lucide-react';
import { Word } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';
import { Button } from './ui/Button';
import { sortWordsBySmartPriority } from '@/lib/srs';
import confetti from 'canvas-confetti';

interface FlashcardStudyProps {
  initialFilter?: string;
  initialMode?: string;
  initialStatus?: string;
  onSessionComplete?: () => void;
}

export const FlashcardStudyView: React.FC<FlashcardStudyProps> = ({
  initialFilter = 'smart',
  initialMode,
  initialStatus,
  onSessionComplete,
}) => {
  const router = useRouter();
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [studiedCount, setStudiedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Casual Free Practice mode (does not alter learning statistics or SRS intervals)
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(initialMode === 'practice');
  const [practiceDeckLabel, setPracticeDeckLabel] = useState<string>('');

  useEffect(() => {
    fetchWords();
  }, [filter]);

  const fetchWords = async () => {
    setLoading(true);
    setIsCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      const res = await fetch('/api/words');
      const data: Word[] = await res.json();
      const wordList = data || [];
      setAllWords(wordList);
      const now = Date.now();

      // Check for Casual Practice Deck loaded from Word Bank tab
      let practicePayload: { ids?: string[]; tab?: string; label?: string; practiceOnly?: boolean } | null = null;
      try {
        const stored = sessionStorage.getItem('fasih_practice_deck');
        if (stored) {
          practicePayload = JSON.parse(stored);
        }
      } catch (_) {}

      if (initialMode === 'practice' || practicePayload?.practiceOnly) {
        setIsPracticeMode(true);
        if (practicePayload?.label) {
          setPracticeDeckLabel(practicePayload.label);
        } else if (initialStatus) {
          setPracticeDeckLabel(`${initialStatus.toUpperCase()} Deck`);
        }

        let customQueue: Word[] = [];
        if (practicePayload?.ids && practicePayload.ids.length > 0) {
          const idSet = new Set(practicePayload.ids);
          customQueue = wordList.filter((w) => idSet.has(w.id));
        } else if (initialStatus) {
          customQueue = initialStatus === 'all'
            ? wordList
            : wordList.filter((w) => w.memoryStatus === initialStatus);
        }

        if (customQueue.length > 0) {
          setWords(customQueue);
          setLoading(false);
          return;
        }
      }

      if (filter === 'smart') {
        // Smart queue: omit mastered words that are NOT yet due.
        // They will automatically reappear when their SRS review schedule arrives.
        const active = wordList.filter(w => {
          if (w.memoryStatus === 'mastered') {
            return w.nextReviewDate && new Date(w.nextReviewDate).getTime() <= now;
          }
          return true;
        });
        setWords(sortWordsBySmartPriority(active));
      } else if (filter === 'focus') {
        // Focus mode: only struggling + learning + new (never mastered, even if due)
        const focusWords = wordList.filter(w => w.memoryStatus !== 'mastered');
        setWords(sortWordsBySmartPriority(focusWords));
      } else if (filter === 'revision') {
        const dueWords = wordList.filter(w => w.nextReviewDate && new Date(w.nextReviewDate).getTime() <= now);
        setWords(sortWordsBySmartPriority(dueWords));
      } else if (filter === 'struggling') {
        const tricky = wordList.filter(w => w.memoryStatus === 'struggling');
        setWords(sortWordsBySmartPriority(tricky));
      } else if (filter === 'learning') {
        const learning = wordList.filter(w => w.memoryStatus === 'learning');
        setWords(sortWordsBySmartPriority(learning));
      } else {
        // 'all': all words in the word bank including all mastered words
        setWords(wordList);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setIsFlipped(false);
  };

  const handleCardRating = async (rating: 1 | 2 | 3 | 4) => {
    if (isSubmitting || !words[currentIndex]) return;
    setIsSubmitting(true);
    const currentWord = words[currentIndex];

    // A card marked "Again" is re-queued once per session (unless it is already
    // a re-queued copy), which grows the deck by one. Track the deck length we
    // will have AFTER this action so the end-of-session check is accurate.
    const willRequeue = rating === 1 && !currentWord.isRequeued;
    const nextDeckLength = words.length + (willRequeue ? 1 : 0);

    // In Casual Free Practice Mode: zero impact on learning metrics or SRS schedules!
    if (isPracticeMode) {
      if (rating === 1 && !currentWord.isRequeued) {
        setWords((prevWords) => {
          const updated = [...prevWords];
          const reinsertIndex = Math.min(updated.length, currentIndex + 4);
          const repeatWord = { ...currentWord, isRequeued: true };
          updated.splice(reinsertIndex, 0, repeatWord);
          return updated;
        });
      }

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

    try {
      const res = await fetch(`/api/words/${currentWord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          recordSession: true,
        }),
      });

      if (res.ok) {
        const updatedWord: Word = await res.json();
        
        // Intelligently update session deck:
        setWords((prevWords) => {
          const updated = prevWords.map((w, idx) => (idx === currentIndex ? { ...w, ...updatedWord } : w));

          // In-Session Intelligent SRS Repetition:
          // If rated "Again" (1), re-queue this card ~4 cards ahead (or at the end of the session)
          // so the user actually gets a chance to practice and retain it before finishing!
          if (rating === 1 && !prevWords[currentIndex]?.isRequeued) {
            const reinsertIndex = Math.min(updated.length, currentIndex + 4);
            const repeatWord = { ...updatedWord, isRequeued: true };
            updated.splice(reinsertIndex, 0, repeatWord);
          }
          return updated;
        });
      }

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
        if (onSessionComplete) onSessionComplete();
      }
    } catch (err) {
      console.error('Failed to submit rating:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Casual Mode Navigation Handlers (no rating needed!)
  const handleNextCasualCard = () => {
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
    }
  };

  const handlePrevCasualCard = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleRepeatCasualCard = () => {
    if (!currentWord || currentWord.isRequeued) {
      handleNextCasualCard();
      return;
    }
    setWords((prevWords) => {
      const updated = [...prevWords];
      const reinsertIndex = Math.min(updated.length, currentIndex + 4);
      const repeatWord = { ...currentWord, isRequeued: true };
      updated.splice(reinsertIndex, 0, repeatWord);
      return updated;
    });
    handleNextCasualCard();
  };

  // Desktop keyboard shortcuts
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
          handleNextCasualCard();
        } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
          handlePrevCasualCard();
        } else if (e.key.toLowerCase() === 'r' && isFlipped) {
          handleRepeatCasualCard();
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
          setCurrentIndex((prev) => prev - 1);
          setIsFlipped(false);
        } else if (e.key.toLowerCase() === 's') {
          handleShuffle();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFlipped, currentIndex, words, isPracticeMode]);

  const now = Date.now();
  const currentWord = words[currentIndex];
  const smartWordsCount = allWords.filter(w => {
    if (w.memoryStatus === 'mastered') {
      return w.nextReviewDate && new Date(w.nextReviewDate).getTime() <= now;
    }
    return true;
  }).length;
  const dueWordsCount = allWords.filter(w => w.nextReviewDate && new Date(w.nextReviewDate).getTime() <= now).length;
  const strugglingWordsCount = allWords.filter(w => w.memoryStatus === 'struggling').length;
  const masteredOmittedCount = allWords.filter(w => w.memoryStatus === 'mastered' && (!w.nextReviewDate || new Date(w.nextReviewDate).getTime() > now)).length;

  const masteredCount = words.filter((w) => w.memoryStatus === 'mastered').length;
  const learningCount = words.filter((w) => w.memoryStatus === 'learning').length;
  const strugglingCount = words.filter((w) => w.memoryStatus === 'struggling').length;
  const progressPercent = words.length > 0 ? Math.round(((currentIndex + 1) / words.length) * 100) : 0;

  if (loading) {
    return (
      <div className="py-24 text-center text-[var(--ink-muted)] space-y-3">
        <div className="font-arabic text-4xl text-[var(--accent-ochre)] animate-pulse">
          جَارٍ تَحْمِيلُ البِطَاقَاتِ...
        </div>
        <p className="text-sm font-semibold">Loading your flashcards...</p>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 px-8 border border-dashed border-[var(--border-subtle)] rounded-2xl space-y-4">
        <span className="font-arabic text-4xl text-[var(--accent-ochre)] font-bold">مُمْتَاز</span>
        <h3 className="editorial-title text-2xl font-semibold text-[var(--ink-primary)]">
          {filter === 'smart'
            ? 'All Caught Up! 🎉'
            : filter === 'revision'
            ? 'No Flashcards Due Right Now!'
            : filter === 'struggling'
            ? 'No Tricky Words!'
            : 'Nothing To Study Yet'}
        </h3>
        <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
          {filter === 'smart'
            ? `Great work! All your active words are practiced or mastered. Mastered words will automatically reappear here when their scheduled review date arrives.`
            : filter === 'revision'
            ? 'Great work! All your saved words are fresh in your memory and none are due for review right now.'
            : filter === 'struggling'
            ? 'You have 0 tricky words right now! Keep up the great work.'
            : 'Your Word Bank is empty. Start by generating a new word set to study!'}
        </p>
        <button
          onClick={() => setFilter('all')}
          className="btn-quiet px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
        >
          {filter === 'smart' || filter === 'revision' || filter === 'struggling' ? `Practice All Words (${allWords.length}) Anyway` : 'Reload'}
        </button>
      </div>
    );
  }

  if (isCompleted || !currentWord) {
    return (
      <div className="max-w-3xl mx-auto text-center py-16 px-8 border border-[var(--accent-ochre)]/30 rounded-2xl bg-[var(--bg-surface)] space-y-6 animate-fadeIn">
        <div className="space-y-2">
          <span className="font-arabic text-5xl text-[var(--accent-ochre)] font-bold">
            أَحْسَنْتَ ! مُمْتَاز
          </span>
          <h2 className="editorial-title text-3xl font-semibold text-[var(--ink-primary)]">
            {isPracticeMode ? 'Casual Practice Finished!' : 'Practice Session Done!'}
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] max-w-md mx-auto leading-relaxed">
            {isPracticeMode
              ? `You reviewed ${studiedCount} cards from your ${practiceDeckLabel || 'Word Bank'} deck without altering any of your learning statistics or review schedules.`
              : `You completed ${studiedCount} card reviews today. Your spaced repetition schedule has been updated!`}
          </p>
        </div>

        <div className="flex gap-4 justify-center pt-2">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setIsCompleted(false);
              setIsFlipped(false);
            }}
            className="btn-quiet px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" /> Practice Again
          </button>
          {isPracticeMode ? (
            <button
              onClick={() => {
                try { sessionStorage.removeItem('fasih_practice_deck'); } catch (_) {}
                router.push('/library');
              }}
              className="btn-ochre px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Back to Word Bank
            </button>
          ) : (
            filter !== 'all' && (
              <button
                onClick={() => {
                  setFilter('all');
                }}
                className="btn-ochre px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Practice All Words ({allWords.length})
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-fadeIn">
      {/* Top Filter & Deck Count Toolbar */}
      {isPracticeMode ? (
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-2xl bg-[var(--accent-cypress)]/10 border border-[var(--accent-cypress)]/25 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="badge-cypress flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs shadow-xs"
              style={{ backgroundColor: 'var(--accent-cypress)', color: '#ffffff' }}
            >
              <BookOpen className="w-3.5 h-3.5" style={{ color: '#ffffff', stroke: '#ffffff' }} />
              <span style={{ color: '#ffffff' }} className="font-bold">
                Casual Practice Mode
              </span>
            </span>
            <span className="font-semibold text-[var(--ink-primary)]">
              {practiceDeckLabel || 'Selected Tab'} ({words.length} cards)
            </span>
            <span className="text-[var(--ink-muted)] hidden sm:inline">
              • Learning statistics & review schedule will not be changed
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-[var(--ink-muted)]">
              Card {currentIndex + 1} of {words.length}
            </span>
            <button
              type="button"
              onClick={handleShuffle}
              className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--accent-ochre)] hover:bg-[var(--accent-ochre-dim)] transition cursor-pointer flex items-center gap-1.5"
              title="Shuffle card order (S)"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">Shuffle</span>
            </button>
            <button
              type="button"
              onClick={() => {
                try { sessionStorage.removeItem('fasih_practice_deck'); } catch (_) {}
                router.push('/library');
              }}
              className="btn-quiet px-3 py-1 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Exit to Word Bank
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border-subtle)] pb-4 text-xs">
          <div className="flex items-center gap-1.5 sm:gap-2 font-medium flex-wrap">
            <button
              onClick={() => setFilter('smart')}
              className={`cursor-pointer transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                filter === 'smart'
                  ? 'bg-[var(--accent-ochre)] text-white shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Smart Queue ({smartWordsCount})</span>
            </button>

            <button
              onClick={() => setFilter('revision')}
              className={`cursor-pointer transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                filter === 'revision'
                  ? 'bg-[var(--accent-ochre)] text-white shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Due for Review ({dueWordsCount})</span>
            </button>

            <button
              onClick={() => setFilter('struggling')}
              className={`cursor-pointer transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                filter === 'struggling'
                  ? 'bg-[var(--accent-terracotta)] text-white shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--accent-terracotta)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              <span>Tricky Words ({strugglingWordsCount})</span>
            </button>

            <button
              onClick={() => setFilter('all')}
              className={`cursor-pointer transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${
                filter === 'all'
                  ? 'bg-[var(--ink-secondary)] text-white shadow-xs'
                  : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
              title="Practice all words in your bank including mastered"
            >
              <span>All Words ({allWords.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {filter === 'smart' && masteredOmittedCount > 0 && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--accent-cypress)]/10 text-[var(--accent-cypress)] border border-[var(--accent-cypress)]/20">
                <CheckCircle2 className="w-3 h-3" />
                {masteredOmittedCount} mastered words omitted
              </span>
            )}
            <span className="text-xs font-semibold text-[var(--ink-muted)]">
              Card {currentIndex + 1} of {words.length}
            </span>
            <button
              onClick={handleShuffle}
              className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--accent-ochre)] hover:bg-[var(--accent-ochre-dim)] transition cursor-pointer flex items-center gap-1.5"
              title="Shuffle card order (S)"
            >
              <Shuffle className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">Shuffle</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Study Arena: 2-Column Desktop Layout */}
      <div className="study-arena-grid">
        {/* Left Column (Flashcard + Action Controls) */}
        <div className="study-arena-main">
          {/* Centered Flashcard & Action Container */}
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Adaptive 3D Flip Flashcard */}
            <div
              className="w-full min-h-[460px] sm:min-h-[490px] lg:min-h-[510px] perspective-1000 cursor-pointer select-none"
              onClick={() => setIsFlipped(!isFlipped)}
            >
            <div
              className={`relative w-full h-full min-h-[460px] sm:min-h-[500px] lg:min-h-[520px] rounded-3xl transition-transform duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* ================= FRONT SIDE ================= */}
              <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-6 sm:p-10 lg:p-12 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-xl overflow-hidden hover:border-[var(--accent-ochre)]/40 transition-colors">
                {/* Top Bar on Front */}
                <div className="flex justify-between items-center w-full">
                  <span className="px-3.5 py-1 rounded-full font-semibold bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] uppercase tracking-wider text-xs">
                    {currentWord?.wordType || 'Vocabulary'}
                  </span>
                  {currentWord?.arabic && <AudioPronounceButton arabicText={currentWord.arabic} size="lg" />}
                </div>

                {/* Center: Big Prominent Arabic Word */}
                <div className="flex flex-col items-center justify-center text-center py-6 sm:py-10 my-auto w-full space-y-4">
                  <div
                    dir="rtl"
                    style={{ fontSize: 'clamp(56px, 8vw, 88px)', textAlign: 'center' }}
                    className="font-arabic font-bold text-[var(--accent-ochre)] harakat-text leading-snug text-center mx-auto w-full"
                  >
                    {currentWord?.arabic}
                  </div>
                  <p className="text-sm sm:text-base text-[var(--ink-muted)] font-serif italic text-center">
                    Click anywhere or press <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] text-xs font-mono">Space</kbd> to flip card
                  </p>
                </div>

                {/* Bottom Bar on Front */}
                <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs sm:text-sm text-[var(--ink-muted)] w-full">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span>
                      Status: <strong className="text-[var(--ink-secondary)] capitalize font-semibold">{currentWord?.memoryStatus === 'learning' ? 'Currently Learning' : currentWord?.memoryStatus === 'struggling' ? 'Needs Practice' : currentWord?.memoryStatus === 'mastered' ? 'Mastered' : 'New Word'}</strong>
                    </span>
                    {currentWord?.isRequeued && (
                      <span className="px-1.5 py-0.5 rounded-sm text-[10px] bg-red-500/15 text-red-400 font-bold">
                        Re-queued (Again)
                      </span>
                    )}
                    {!currentWord?.isRequeued && currentWord?.nextReviewDate && (
                      <span className="text-[11px] font-mono text-[var(--ink-muted)]">
                        {new Date(currentWord.nextReviewDate).getTime() <= Date.now()
                          ? '• Due Today'
                          : `• Review in ${Math.max(1, Math.ceil((new Date(currentWord.nextReviewDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))}d`}
                      </span>
                    )}
                  </div>
                  <span className="text-[var(--accent-ochre)] font-semibold flex items-center gap-1.5">
                    Show Answer <RotateCw className="w-4 h-4" />
                  </span>
                </div>
              </div>

              {/* ================= BACK SIDE ================= */}
              <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-8 lg:p-10 flex flex-col justify-between bg-[var(--bg-surface)] border-2 border-[var(--accent-ochre)]/50 shadow-xl overflow-y-auto no-scrollbar">
                {/* Top Bar on Back */}
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2.5">
                    <span className="px-3.5 py-1 rounded-full font-semibold bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] uppercase tracking-wider text-xs">
                      {currentWord?.wordType || 'Vocabulary'}
                    </span>
                    {currentWord?.root && (
                      <span className="text-xs text-[var(--ink-muted)] hidden sm:inline-block">
                        Root: <strong className="text-[var(--ink-secondary)] font-mono">{currentWord.root}</strong>
                      </span>
                    )}
                  </div>
                  {currentWord?.arabic && <AudioPronounceButton arabicText={currentWord.arabic} size="lg" />}
                </div>

                {/* Center Content: Roomy Wide Layout */}
                <div className="flex flex-col items-center justify-center text-center py-2 sm:py-3 space-y-3 sm:space-y-4 my-auto max-w-4xl mx-auto w-full">
                  {/* Arabic + Transliteration */}
                  <div className="space-y-1 w-full text-center">
                    <div
                      dir="rtl"
                      style={{ fontSize: 'clamp(46px, 7vw, 70px)', textAlign: 'center' }}
                      className="font-arabic font-bold text-[var(--accent-ochre)] harakat-text leading-snug text-center mx-auto w-full"
                    >
                      {currentWord?.arabic}
                    </div>
                    <div className="text-sm sm:text-base font-mono text-[var(--ink-muted)] text-center tracking-wide">
                      {currentWord?.transliteration}
                    </div>
                  </div>

                  {/* English Meaning (Large and prominent) */}
                  <div className="py-0.5 text-center">
                    <span className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)] block mb-1">
                      English Meaning
                    </span>
                    <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--ink-primary)] leading-tight text-center">
                      {currentWord?.english}
                    </span>
                  </div>

                  {/* Present tense forms if verb */}
                  {currentWord?.presentTenseI && (
                    <div className="px-4 py-1.5 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-xs sm:text-sm text-[var(--ink-secondary)] inline-flex items-center gap-2">
                      <span className="text-[var(--ink-muted)] text-xs font-medium">Verb Conjugation:</span>
                      <span dir="rtl" className="font-arabic text-lg sm:text-xl text-[var(--accent-cypress)] font-semibold harakat-text">
                        أَنَا {currentWord.presentTenseI} • هُوَ {currentWord.presentTenseHe || '-'}
                      </span>
                    </div>
                  )}

                  {/* Example Sentence with Audio */}
                  {currentWord?.exampleArabic && (
                    <div className="pt-2.5 border-t border-[var(--border-subtle)] space-y-1.5 text-center w-full max-w-3xl mx-auto">
                      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
                        <p
                          dir="rtl"
                          style={{ textAlign: 'center' }}
                          className="font-arabic text-xl sm:text-2xl lg:text-3xl font-semibold text-[var(--ink-primary)] harakat-text leading-relaxed text-center"
                        >
                          {currentWord.exampleArabic}
                        </p>
                        <AudioPronounceButton
                          arabicText={currentWord.exampleArabic}
                          size="sm"
                          label="Listen sentence"
                          title="Listen to full example sentence"
                        />
                      </div>
                      {currentWord.exampleTransliteration && (
                        <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-mono">{currentWord.exampleTransliteration}</p>
                      )}
                      {currentWord.exampleEnglish && (
                        <p className="text-xs sm:text-sm text-[var(--ink-secondary)] italic font-serif">"{currentWord.exampleEnglish}"</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Bottom Note */}
                <div className="text-xs font-semibold text-[var(--ink-muted)] text-center pt-2 border-t border-[var(--border-subtle)] w-full">
                  {isPracticeMode ? (
                    <span className="text-[var(--ink-secondary)]">
                      Casual Practice Mode • Learning metrics & review schedules are not modified
                    </span>
                  ) : (
                    'How well did you remember this word?'
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action / Response Controls */}
          {isPracticeMode ? (
            <div className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 w-full text-sm pt-1 animate-fadeIn">
              {/* Previous */}
              <button
                type="button"
                onClick={handlePrevCasualCard}
                disabled={currentIndex === 0}
                className="btn-quiet px-4 py-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer font-semibold text-xs sm:text-sm"
                title="Previous Card (Left Arrow)"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              {/* Center actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFlipped((prev) => !prev)}
                  className="btn-quiet px-4 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-medium text-xs sm:text-sm hover:border-[var(--accent-ochre)]"
                  title="Flip Card (Space)"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{isFlipped ? 'Show Front' : 'Show Answer'}</span>
                  <span className="font-mono text-[10px] text-[var(--ink-muted)] hidden sm:inline">[Space]</span>
                </button>

                {isFlipped && (
                  <button
                    type="button"
                    onClick={handleRepeatCasualCard}
                    className="btn-quiet px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 cursor-pointer font-medium text-xs sm:text-sm text-[var(--accent-ochre)] border-[var(--accent-ochre)]/30 hover:bg-[var(--accent-ochre-dim)]"
                    title="Review again later in this session (R)"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Review Again</span>
                    <span className="font-mono text-[10px] opacity-70 hidden sm:inline">[R]</span>
                  </button>
                )}
              </div>

              {/* Next / Finish */}
              {currentIndex + 1 < words.length ? (
                <Button
                  type="button"
                  onClick={handleNextCasualCard}
                  variant="primary"
                  size="md"
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold shadow-sm flex items-center gap-1.5"
                  title="Next Card (Right Arrow or Enter)"
                >
                  <span>Next Card</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleNextCasualCard}
                  variant="primary"
                  size="md"
                  className="px-6 py-2.5 text-xs sm:text-sm font-bold shadow-md bg-[var(--accent-cypress)] border-[var(--accent-cypress)] text-white hover:opacity-90 flex items-center gap-1.5"
                  title="Finish Practice"
                >
                  <Check className="w-4 h-4" />
                  <span>Finish Practice</span>
                </Button>
              )}
            </div>
          ) : isFlipped ? (
            <div className="space-y-2.5 animate-fadeIn w-full">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {/* Forgot */}
                <button
                  onClick={() => handleCardRating(1)}
                  disabled={isSubmitting}
                  className="p-3.5 sm:p-4 rounded-xl border-2 border-[var(--accent-terracotta)]/40 hover:bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] text-center cursor-pointer transition transform hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="block text-base sm:text-lg font-bold">Again</span>
                  <span className="text-xs opacity-80 mt-0.5 block">Forgot it (1)</span>
                  <span className="text-[10px] opacity-70 mt-1 block font-mono">1d • Re-queues</span>
                </button>

                {/* Hard */}
                <button
                  onClick={() => handleCardRating(2)}
                  disabled={isSubmitting}
                  className="p-3.5 sm:p-4 rounded-xl border-2 border-[var(--accent-ochre)]/40 hover:bg-[var(--accent-ochre)]/15 text-[var(--accent-ochre)] text-center cursor-pointer transition transform hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="block text-base sm:text-lg font-bold">Hard</span>
                  <span className="text-xs opacity-80 mt-0.5 block">Partly knew (2)</span>
                  <span className="text-[10px] opacity-70 mt-1 block font-mono">1–2 days</span>
                </button>

                {/* Good */}
                <button
                  onClick={() => handleCardRating(3)}
                  disabled={isSubmitting}
                  className="p-3.5 sm:p-4 rounded-xl border-2 border-[var(--accent-cypress)]/40 hover:bg-[var(--accent-cypress)]/15 text-[var(--accent-cypress)] text-center cursor-pointer transition transform hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="block text-base sm:text-lg font-bold">Good</span>
                  <span className="text-xs opacity-80 mt-0.5 block">Remembered (3)</span>
                  <span className="text-[10px] opacity-70 mt-1 block font-mono">4–10 days</span>
                </button>

                {/* Easy */}
                <button
                  onClick={() => handleCardRating(4)}
                  disabled={isSubmitting}
                  className="p-3.5 sm:p-4 rounded-xl border-2 border-[var(--border-strong)] hover:border-[var(--accent-ochre)] hover:bg-[var(--accent-ochre)]/10 text-[var(--ink-primary)] text-center cursor-pointer transition transform hover:-translate-y-0.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="block text-base sm:text-lg font-bold">Easy</span>
                  <span className="text-xs opacity-80 mt-0.5 block">Knew well (4)</span>
                  <span className="text-[10px] opacity-70 mt-1 block font-mono">7–25+ days</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center w-full text-sm pt-1">
              <button
                onClick={() => {
                  if (currentIndex > 0) {
                    setCurrentIndex((prev) => prev - 1);
                    setIsFlipped(false);
                  }
                }}
                disabled={currentIndex === 0}
                className="btn-quiet px-5 py-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>

              <div className="hidden sm:block">
                <Button
                  onClick={() => setIsFlipped(true)}
                  variant="primary"
                  size="md"
                  className="px-8 py-3 text-sm font-bold shadow-md"
                >
                  Reveal Answer <span className="font-mono text-xs opacity-80">[Space]</span>
                </Button>
              </div>

              <button
                onClick={() => {
                  if (currentIndex + 1 < words.length) {
                    setCurrentIndex((prev) => prev + 1);
                    setIsFlipped(false);
                  }
                }}
                disabled={currentIndex + 1 >= words.length}
                className="btn-quiet px-5 py-2.5 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer font-semibold"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
          </div>
        </div>

        {/* Right Column (Desktop Companion Sidebar) */}
        <div className="hidden lg:flex flex-col space-y-5 study-arena-sidebar">
          {/* 1. Deck Session Progress Panel */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-4 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--accent-ochre)] flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Session Progress
              </span>
              <span className="text-xs font-mono font-bold text-[var(--ink-secondary)]">
                {currentIndex + 1} / {words.length}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-2.5 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-ochre)] rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Mastery Status Breakdown Chips */}
            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border-subtle)] text-center text-xs">
              <div className="py-2 px-1.5 rounded-xl bg-[var(--accent-cypress)]/10 border border-[var(--accent-cypress)]/20 flex flex-col items-center justify-center">
                <span className="block font-bold text-sm text-[var(--accent-cypress)]">{masteredCount}</span>
                <span className="text-[10px] text-[var(--ink-muted)] whitespace-nowrap">Mastered</span>
              </div>
              <div className="py-2 px-1.5 rounded-xl bg-[var(--accent-ochre-dim)] border border-[var(--accent-ochre)]/20 flex flex-col items-center justify-center">
                <span className="block font-bold text-sm text-[var(--accent-ochre)]">{learningCount}</span>
                <span className="text-[10px] text-[var(--ink-muted)] whitespace-nowrap">Learning</span>
              </div>
              <div className="py-2 px-1.5 rounded-xl bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/20 flex flex-col items-center justify-center">
                <span className="block font-bold text-sm text-[var(--accent-terracotta)]">{strugglingCount}</span>
                <span className="text-[10px] text-[var(--ink-muted)] whitespace-nowrap">Tricky</span>
              </div>
            </div>
          </div>

          {/* 2. Deck Queue & Card Navigator */}
          <div className="p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--accent-ochre)]" /> Deck Queue
              </span>
              <span className="text-[11px] text-[var(--ink-muted)]">Click card to jump</span>
            </div>

            <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-1 no-scrollbar">
              {words.map((w, idx) => {
                const isActive = idx === currentIndex;
                return (
                  <div
                    key={w.id || idx}
                    onClick={() => {
                      setCurrentIndex(idx);
                      setIsFlipped(false);
                    }}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 text-xs ${
                      isActive
                        ? 'border-[var(--accent-ochre)] bg-[var(--accent-ochre-dim)] text-[var(--ink-primary)] font-semibold shadow-xs'
                        : 'border-transparent hover:bg-[var(--bg-surface-elevated)] text-[var(--ink-secondary)]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate min-w-0">
                      <span className="w-5 text-center font-mono text-[10px] text-[var(--ink-muted)] shrink-0">
                        {idx + 1}
                      </span>
                      <span dir="rtl" className="font-arabic text-base text-[var(--ink-primary)] harakat-text font-semibold truncate">
                        {w.arabic}
                      </span>
                    </div>

                    <span className="text-[10px] uppercase font-semibold text-[var(--ink-muted)] px-1.5 py-0.5 rounded bg-[var(--border-subtle)] shrink-0 whitespace-nowrap">
                      {w.wordType || 'Word'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Desktop Keyboard Shortcuts Guide */}
          <div className="p-4 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-2.5 text-xs text-[var(--ink-muted)]">
            <div className="flex items-center gap-1.5 font-semibold text-[var(--ink-primary)]">
              <Keyboard className="w-4 h-4 text-[var(--accent-ochre)]" />
              <span>Desktop Keyboard Shortcuts</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] gap-1">
                <span className="truncate">Flip Card</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] font-mono text-[10px] shrink-0">Space</kbd>
              </div>
              {isPracticeMode ? (
                <>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] gap-1">
                    <span className="truncate">Next</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] font-mono text-[10px] shrink-0">→</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] gap-1">
                    <span className="truncate">Previous</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] font-mono text-[10px] shrink-0">←</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] gap-1">
                    <span className="truncate">Repeat</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] font-mono text-[10px] shrink-0">R</kbd>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] gap-1">
                    <span className="truncate">Forgot</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] font-mono text-[10px] shrink-0">1</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] gap-1">
                    <span className="truncate">Hard</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] font-mono text-[10px] shrink-0">2</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] gap-1">
                    <span className="truncate">Good</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] font-mono text-[10px] shrink-0">3</kbd>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] gap-1">
                    <span className="truncate">Easy</span>
                    <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] font-mono text-[10px] shrink-0">4</kbd>
                  </div>
                </>
              )}
              <div className="flex items-center justify-between p-1.5 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] gap-1">
                <span className="truncate">Shuffle</span>
                <kbd className="px-1.5 py-0.5 rounded bg-[var(--border-subtle)] font-mono text-[10px] shrink-0">S</kbd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
