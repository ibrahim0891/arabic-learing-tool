'use client';

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Shuffle,
  Volume2
} from 'lucide-react';
import { Word } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';
import confetti from 'canvas-confetti';

interface FlashcardStudyProps {
  initialFilter?: string;
  onSessionComplete?: () => void;
}

export const FlashcardStudyView: React.FC<FlashcardStudyProps> = ({
  initialFilter = 'all',
  onSessionComplete,
}) => {
  const [words, setWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filter, setFilter] = useState<string>(initialFilter);
  const [studiedCount, setStudiedCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    fetchWords();
  }, [filter]);

  const fetchWords = async () => {
    setLoading(true);
    setIsCompleted(false);
    setCurrentIndex(0);
    setIsFlipped(false);

    try {
      let url = '/api/words?';
      if (filter === 'revision') {
        url += 'revision=true';
      } else if (filter === 'struggling') {
        url += 'status=struggling';
      } else if (filter === 'learning') {
        url += 'status=learning';
      }

      const res = await fetch(url);
      const data = await res.json();
      setWords(data || []);
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
    if (!words[currentIndex]) return;
    const currentWord = words[currentIndex];

    try {
      await fetch(`/api/words/${currentWord.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          recordSession: true,
        }),
      });

      setStudiedCount((prev) => prev + 1);

      if (currentIndex + 1 < words.length) {
        setIsFlipped(false);
        setTimeout(() => {
          setCurrentIndex((prev) => prev + 1);
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
    }
  };

  const currentWord = words[currentIndex];

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
          No Flashcards Due Right Now!
        </h3>
        <p className="text-sm text-[var(--ink-secondary)] leading-relaxed">
          {filter === 'revision'
            ? 'Great work! All your saved words are fresh in your memory and none are due for review right now.'
            : filter === 'struggling'
            ? 'You have 0 tricky words right now! Keep up the great work.'
            : 'You haven’t added any words yet. Start by learning a new word set!'}
        </p>
        <button
          onClick={() => setFilter('all')}
          className="btn-quiet px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
        >
          Practice All Words
        </button>
      </div>
    );
  }

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 px-8 border border-[var(--accent-ochre)]/30 rounded-2xl bg-[var(--bg-surface)] space-y-6 animate-fadeIn">
        <div className="space-y-2">
          <span className="font-arabic text-5xl text-[var(--accent-ochre)] font-bold">
            أَحْسَنْتَ ! مُمْتَاز
          </span>
          <h2 className="editorial-title text-3xl font-semibold text-[var(--ink-primary)]">
            Practice Session Done!
          </h2>
          <p className="text-sm text-[var(--ink-secondary)] max-w-md mx-auto leading-relaxed">
            You successfully reviewed <strong className="text-[var(--accent-ochre)]">{studiedCount} words</strong> today. Your spaced repetition schedule has been updated!
          </p>
        </div>

        <div className="flex gap-4 justify-center pt-2">
          <button
            onClick={() => {
              setIsCompleted(false);
              setCurrentIndex(0);
              setIsFlipped(false);
              handleShuffle();
            }}
            className="btn-quiet px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RotateCw className="w-3.5 h-3.5" /> Practice Again
          </button>
          <button
            onClick={() => {
              setFilter('all');
              fetchWords();
            }}
            className="btn-ochre px-6 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Practice More Words
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 animate-fadeIn px-2 sm:px-4">
      {/* Top Filter & Deck Count Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4 text-xs">
        <div className="flex items-center gap-3 sm:gap-4 font-medium">
          <button
            onClick={() => setFilter('all')}
            className={`cursor-pointer transition-colors ${filter === 'all' ? 'text-[var(--accent-ochre)] font-bold text-sm' : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'}`}
          >
            All Words ({words.length})
          </button>
          <span className="text-[var(--border-subtle)]">•</span>
          <button
            onClick={() => setFilter('revision')}
            className={`cursor-pointer transition-colors ${filter === 'revision' ? 'text-[var(--accent-ochre)] font-bold text-sm' : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'}`}
          >
            Words to Review
          </button>
          <span className="text-[var(--border-subtle)]">•</span>
          <button
            onClick={() => setFilter('struggling')}
            className={`cursor-pointer transition-colors ${filter === 'struggling' ? 'text-[var(--accent-terracotta)] font-bold text-sm' : 'text-[var(--ink-muted)] hover:text-[var(--ink-primary)]'}`}
          >
            Tricky Words
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold text-[var(--ink-muted)]">
            Card {currentIndex + 1} of {words.length}
          </span>
          <button
            onClick={handleShuffle}
            className="p-1.5 rounded-lg text-[var(--ink-muted)] hover:text-[var(--accent-ochre)] hover:bg-[var(--accent-ochre-dim)] transition cursor-pointer"
            title="Shuffle card order"
          >
            <Shuffle className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Large Adaptive 3D Flip Flashcard */}
      <div
        className="w-full min-h-[440px] sm:min-h-[500px] lg:min-h-[540px] perspective-1000 cursor-pointer select-none"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          className={`relative w-full h-full min-h-[440px] sm:min-h-[500px] lg:min-h-[540px] rounded-3xl transition-transform duration-500 transform-style-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
        >
          {/* ================= FRONT SIDE ================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rounded-3xl p-6 sm:p-10 lg:p-14 flex flex-col justify-between bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl">
            {/* Top Bar on Front */}
            <div className="flex justify-between items-center">
              <span className="px-3.5 py-1 rounded-full font-semibold bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] uppercase tracking-wider text-xs">
                {currentWord.wordType || 'Vocabulary'}
              </span>
              <AudioPronounceButton arabicText={currentWord.arabic} size="lg" />
            </div>

            {/* Center: Big Prominent Arabic Word */}
            <div className="flex flex-col items-center justify-center text-center py-6 sm:py-10 my-auto w-full space-y-4">
              <div
                style={{ fontSize: '64px' }}
                className="font-arabic font-bold text-[var(--accent-ochre)] harakat-text leading-relaxed text-center mx-auto"
              >
                {currentWord.arabic}
              </div>
              <p className="text-sm sm:text-base text-[var(--ink-muted)] font-serif italic text-center">
                Tap anywhere to flip card and reveal English translation
              </p>
            </div>

            {/* Bottom Bar on Front */}
            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs sm:text-sm text-[var(--ink-muted)]">
              <span>
                Status: <strong className="text-[var(--ink-secondary)] capitalize font-semibold">{currentWord.memoryStatus === 'learning' ? 'Currently Learning' : currentWord.memoryStatus === 'struggling' ? 'Needs Practice' : currentWord.memoryStatus === 'mastered' ? 'Mastered' : 'New Word'}</strong>
              </span>
              <span className="text-[var(--accent-ochre)] font-semibold flex items-center gap-1.5">
                Show Answer <RotateCw className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* ================= BACK SIDE ================= */}
          <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 rounded-3xl p-6 sm:p-10 lg:p-14 flex flex-col justify-between bg-[var(--bg-surface)] border-2 border-[var(--accent-ochre)]/50 shadow-2xl overflow-y-auto">
            {/* Top Bar on Back */}
            <div className="flex justify-between items-center">
              <span className="px-3.5 py-1 rounded-full font-semibold bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] uppercase tracking-wider text-xs">
                {currentWord.wordType || 'Vocabulary'}
              </span>
              <AudioPronounceButton arabicText={currentWord.arabic} size="lg" />
            </div>

            {/* Center Content: Centered Big Arabic + Large English Meaning */}
            <div className="flex flex-col items-center justify-center text-center py-4 sm:py-6 space-y-4 my-auto max-w-2xl mx-auto w-full">
              {/* Arabic + Transliteration */}
              <div className="space-y-1 w-full text-center">
                <div
                  style={{ fontSize: '64px' }}
                  className="font-arabic font-bold text-[var(--accent-ochre)] harakat-text leading-relaxed text-center mx-auto"
                >
                  {currentWord.arabic}
                </div>
                <div className="text-sm sm:text-base font-mono text-[var(--ink-muted)] text-center">
                  {currentWord.transliteration}
                </div>
              </div>

              {/* English Meaning (Large and prominent) */}
              <div className="py-2">
                <span className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)] block mb-1">
                  English Meaning
                </span>
                <span className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--ink-primary)] leading-tight">
                  {currentWord.english}
                </span>
              </div>

              {/* Present tense forms if verb */}
              {currentWord.presentTenseI && (
                <div className="p-3 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm text-[var(--ink-secondary)] inline-block">
                  <span className="font-arabic text-xl text-[var(--accent-cypress)] font-semibold">
                    أَنَا {currentWord.presentTenseI} • هُوَ {currentWord.presentTenseHe || '-'}
                  </span>
                </div>
              )}

              {/* Centered Example Sentence with Listen Button */}
              <div className="pt-3 border-t border-[var(--border-subtle)] space-y-2 text-center w-full">
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <p className="font-arabic text-2xl sm:text-3xl font-semibold text-[var(--ink-primary)] harakat-text leading-loose">
                    {currentWord.exampleArabic}
                  </p>
                  <AudioPronounceButton
                    arabicText={currentWord.exampleArabic}
                    size="sm"
                    label="Listen sentence"
                    title="Listen to full example sentence"
                  />
                </div>
                <p className="text-xs sm:text-sm text-[var(--ink-muted)] font-mono">{currentWord.exampleTransliteration}</p>
                <p className="text-sm sm:text-base text-[var(--ink-secondary)] italic">"{currentWord.exampleEnglish}"</p>
              </div>
            </div>

            {/* Bottom Note */}
            <div className="text-xs sm:text-sm font-semibold text-[var(--ink-muted)] text-center pt-3 border-t border-[var(--border-subtle)]">
              How well did you remember this word?
            </div>
          </div>
        </div>
      </div>

      {/* Action / Response Controls */}
      {isFlipped ? (
        <div className="space-y-2.5 animate-fadeIn max-w-2xl mx-auto">
          <div className="grid grid-cols-4 gap-3">
            {/* Forgot */}
            <button
              onClick={() => handleCardRating(1)}
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-[var(--accent-terracotta)]/40 hover:bg-[var(--accent-terracotta)]/15 text-[var(--accent-terracotta)] text-center cursor-pointer transition transform hover:-translate-y-0.5"
            >
              <span className="block text-sm sm:text-base font-bold">Again</span>
              <span className="text-xs opacity-80 mt-0.5 block">Forgot it</span>
            </button>

            {/* Hard */}
            <button
              onClick={() => handleCardRating(2)}
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-[var(--accent-ochre)]/40 hover:bg-[var(--accent-ochre)]/15 text-[var(--accent-ochre)] text-center cursor-pointer transition transform hover:-translate-y-0.5"
            >
              <span className="block text-sm sm:text-base font-bold">Hard</span>
              <span className="text-xs opacity-80 mt-0.5 block">Partly knew</span>
            </button>

            {/* Good */}
            <button
              onClick={() => handleCardRating(3)}
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-[var(--accent-cypress)]/40 hover:bg-[var(--accent-cypress)]/15 text-[var(--accent-cypress)] text-center cursor-pointer transition transform hover:-translate-y-0.5"
            >
              <span className="block text-sm sm:text-base font-bold">Good</span>
              <span className="text-xs opacity-80 mt-0.5 block">Remembered</span>
            </button>

            {/* Easy */}
            <button
              onClick={() => handleCardRating(4)}
              className="p-3.5 sm:p-4 rounded-2xl border-2 border-[var(--border-strong)] hover:border-[var(--accent-ochre)] text-[var(--ink-primary)] text-center cursor-pointer transition transform hover:-translate-y-0.5"
            >
              <span className="block text-sm sm:text-base font-bold">Easy</span>
              <span className="text-xs opacity-80 mt-0.5 block">Knew well</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex justify-between items-center max-w-2xl mx-auto text-sm pt-1">
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

          <button
            onClick={() => setIsFlipped(true)}
            className="btn-ochre px-8 py-3 rounded-xl text-sm font-bold cursor-pointer shadow-md transition transform hover:-translate-y-0.5"
          >
            Reveal Answer
          </button>

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
  );
};
