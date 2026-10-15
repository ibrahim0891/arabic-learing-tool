'use client';

import React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  ArrowRight,
  TrendingUp,
  Clock,
  Compass,
  Repeat,
  AlertCircle,
  BookmarkCheck
} from 'lucide-react';
import { DashboardStats, DailySentence } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';

interface DashboardProps {
  stats: DashboardStats | null;
  onNavigate: (view: 'dashboard' | 'generate' | 'flashcards' | 'test' | 'library') => void;
  onQuickStudy: (filter?: string) => void;
  onQuickTest: (filter?: string) => void;
}

export const DashboardView: React.FC<DashboardProps> = ({
  stats,
  onNavigate,
  onQuickStudy,
  onQuickTest,
}) => {
  // Initialize directly from localStorage if present to prevent any UI flashing/layout shift
  const [dailySentence, setDailySentence] = React.useState<DailySentence | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('fasih_daily_sentence');
        if (cached) {
          return JSON.parse(cached);
        }
      } catch (_) {}
    }
    return null;
  });

  React.useEffect(() => {
    // Also re-verify on client mount in case initial render was SSR
    try {
      const cached = localStorage.getItem('fasih_daily_sentence');
      if (cached && !dailySentence) {
        setDailySentence(JSON.parse(cached));
      }
    } catch (_) {}

    const syncDailySentence = async () => {
      try {
        const res = await fetch('/api/daily-sentence');
        if (res.ok) {
          const data = await res.json();
          if (data.sentence && data.sentence.arabic) {
            const fresh: DailySentence = data.sentence;
            
            // Check if different from current local storage/state
            setDailySentence((prev) => {
              const hasChanged =
                !prev ||
                prev.arabic !== fresh.arabic ||
                prev.slotDate !== fresh.slotDate ||
                prev.slotIndex !== fresh.slotIndex;

              if (hasChanged) {
                try {
                  localStorage.setItem('fasih_daily_sentence', JSON.stringify(fresh));
                } catch (_) {}
                return fresh;
              }
              return prev;
            });
          }
        }
      } catch (err) {
        console.warn('Failed to sync daily sentence:', err);
      }
    };

    syncDailySentence();
  }, []);

  const dailyProgress = stats
    ? Math.min(100, Math.round(((stats.todayStudiedCount || 0) / (stats.dailyGoal || 20)) * 100))
    : 0;

  return (
    <div className="space-y-12 animate-fadeIn">
      {/* 1. Welcoming Hero Banner */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end border-b border-[var(--border-subtle)] pb-10">
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--accent-ochre)]">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-ochre)] animate-pulse" />
            <span>Daily Arabic Inspiration</span>
          </div>

          <div className="space-y-3">
            <div>
              <h1 className="editorial-title text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--ink-primary)]">
                Welcome back! Ready to learn some Arabic?
              </h1>
              {/* Default Welcome Arabic Sentence */}
              <div className="flex items-center gap-2 mt-1">
                <p className="font-arabic text-2xl text-[var(--accent-ochre)] harakat-text font-semibold">
                  أَهْلاً وَسَهْلاً بِكَ فِي رِحْلَةِ تَعَلُّمِ العَرَبِيَّةِ
                </p>
                <AudioPronounceButton
                  arabicText="أَهْلاً وَسَهْلاً بِكَ فِي رِحْلَةِ تَعَلُّمِ العَرَبِيَّةِ"
                  size="sm"
                  title="Listen to welcome sentence"
                />
              </div>
            </div>

            {/* AI Generated Daily Practice Sentence */}
            {dailySentence && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] space-y-2.5 mt-2 shadow-xs">
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-subtle)]/60 pb-2">
                  <div className="flex items-center gap-2 text-[11px] font-semibold text-[var(--accent-ochre)]">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Sentence of the Day</span>
                  </div>
                  <AudioPronounceButton
                    arabicText={dailySentence.arabic}
                    size="sm"
                    title="Listen to today's sentence"
                  />
                </div>

                <p
                  dir="rtl"
                  className="font-arabic text-2xl sm:text-3xl text-[var(--ink-primary)] harakat-text font-semibold leading-relaxed text-right"
                >
                  {dailySentence.arabic}
                </p>

                {dailySentence.transliteration && (
                  <p className="text-xs sm:text-sm font-mono text-[var(--ink-secondary)]">
                    {dailySentence.transliteration}
                  </p>
                )}

                <p className="text-sm sm:text-base text-[var(--ink-muted)] font-serif italic">
                  "{dailySentence.english}"
                </p>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-[var(--ink-muted)] max-w-2xl leading-relaxed">
            Pick up right where you left off. Learn new words with real-life example sentences, practice with flashcards, and test your memory when you feel ready.
          </p>
        </div>

        {/* Daily Goal Card */}
        <div className="lg:col-span-4 flex flex-col justify-end lg:items-end">
          <div className="w-full lg:max-w-xs space-y-2.5 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
            <div className="flex justify-between items-baseline text-xs">
              <span className="font-semibold text-[var(--ink-secondary)]">
                Today's Goal
              </span>
              <span className="text-sm font-bold text-[var(--ink-primary)]">
                {stats?.todayStudiedCount || 0} <span className="text-xs font-normal text-[var(--ink-muted)]">/ {stats?.dailyGoal || 20} words reviewed</span>
              </span>
            </div>
            {/* Progress line */}
            <div className="w-full h-2 bg-[var(--border-subtle)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--accent-ochre)] rounded-full transition-all duration-500"
                style={{ width: `${dailyProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-[var(--ink-muted)]">
              <span>{dailyProgress >= 100 ? '🎉 Goal accomplished today!' : `${(stats?.dailyGoal || 20) - (stats?.todayStudiedCount || 0)} more words to go`}</span>
              <span className="text-[var(--accent-ochre)] font-semibold">{dailyProgress}% done</span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Three Primary Action Pathways */}
      <section className="space-y-4">
        <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)]">
          What would you like to do?
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Action 1: Learn New Words */}
          <div
            onClick={() => onNavigate('generate')}
            className="lg:col-span-7 group cursor-pointer p-7 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)] transition-all flex flex-col justify-between space-y-6"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)]">
                  Step 1 • Learn
                </span>
                <span className="font-arabic text-2xl font-bold text-[var(--accent-ochre)]/60 group-hover:text-[var(--accent-ochre)] transition-colors">
                  كَلِمَاتٌ جَدِيدَة
                </span>
              </div>
              <h2 className="editorial-title text-2xl font-semibold text-[var(--ink-primary)] group-hover:text-[var(--accent-ochre)] transition-colors">
                Learn 10 New Words
              </h2>
              <p className="text-sm text-[var(--ink-secondary)] leading-relaxed max-w-xl">
                Choose a fun everyday topic like food, daily life, or travel. The AI will give you 10 easy-to-learn words with audio pronunciation, diacritics, and natural sentences.
              </p>
            </div>

            <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs font-semibold text-[var(--accent-ochre)]">
              <span>Pick a topic and get started</span>
              <span className="flex items-center gap-1.5 group-hover:translate-x-1 transition-transform">
                Start learning <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>

          {/* Action 2 & 3: Flashcards and Quizzes */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Flashcards */}
            <div
              onClick={() => onNavigate('flashcards')}
              className="flex-1 group cursor-pointer p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-cypress)] transition-all flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-semibold text-[var(--accent-cypress)] block mb-1">
                    Step 2 • Practice
                  </span>
                  <h3 className="editorial-title text-xl font-semibold text-[var(--ink-primary)] group-hover:text-[var(--accent-cypress)] transition-colors">
                    Practice Flashcards
                  </h3>
                </div>
                <span className="font-arabic text-xl text-[var(--ink-muted)]">بِطَاقَات</span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed mb-3">
                Flip cards to test your memory, listen to audio, and mark if a word was easy, good, or hard for you.
              </p>
              <div className="flex items-center justify-between text-xs text-[var(--accent-cypress)] font-semibold pt-2 border-t border-[var(--border-subtle)]">
                <span>{stats?.readyForRevision ? `${stats.readyForRevision} words to review now` : 'Ready to practice'}</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Quiz */}
            <div
              onClick={() => onNavigate('test')}
              className="flex-1 group cursor-pointer p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-terracotta)] transition-all flex flex-col justify-between"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-semibold text-[var(--accent-terracotta)] block mb-1">
                    Step 3 • Check Yourself
                  </span>
                  <h3 className="editorial-title text-xl font-semibold text-[var(--ink-primary)] group-hover:text-[var(--accent-terracotta)] transition-colors">
                    Take a Quick Quiz
                  </h3>
                </div>
                <span className="font-arabic text-xl text-[var(--ink-muted)]">اخْتِبَار</span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed mb-3">
                Fun quizzes with multiple choice, fill-in-the-blank, and typing. See how many words you remember!
              </p>
              <div className="flex items-center justify-between text-xs text-[var(--accent-terracotta)] font-semibold pt-2 border-t border-[var(--border-subtle)]">
                <span>Test your vocabulary</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Dialogues Practice Card */}
            <Link
              href="/conversations"
              className="flex-1 group cursor-pointer p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)] transition-all flex flex-col justify-between no-underline"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs font-semibold text-[var(--accent-ochre)] block mb-1">
                    Step 4 • Read & Chat
                  </span>
                  <h3 className="editorial-title text-xl font-semibold text-[var(--ink-primary)] group-hover:text-[var(--accent-ochre)] transition-colors">
                    Spoken Dialogues
                  </h3>
                </div>
                <span className="font-arabic text-xl text-[var(--ink-muted)]">حِوَارَات</span>
              </div>
              <p className="text-xs text-[var(--ink-secondary)] leading-relaxed mb-3">
                Read authentic conversational chats, hover for audio, and tap bubbles to reveal translations.
              </p>
              <div className="flex items-center justify-between text-xs text-[var(--accent-ochre)] font-semibold pt-2 border-t border-[var(--border-subtle)]">
                <span>Practice Spoken Dialogues</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Your Memory Progress Breakdown */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between border-b border-[var(--border-subtle)] pb-2">
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)]">
            Your Vocabulary Progress
          </div>
          <button
            onClick={() => onNavigate('library')}
            className="text-xs text-[var(--accent-ochre)] hover:underline flex items-center gap-1 cursor-pointer font-medium"
          >
            See all {stats?.totalWords || 0} saved words <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Beginner-friendly 4-stage breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-2">
          {/* Total Words */}
          <div
            onClick={() => onNavigate('library')}
            className="space-y-1 cursor-pointer group"
          >
            <span className="text-xs text-[var(--ink-muted)] font-medium block">
              Total Words Saved
            </span>
            <div className="editorial-title text-4xl sm:text-5xl font-semibold text-[var(--ink-primary)] group-hover:text-[var(--accent-ochre)] transition-colors">
              {stats?.totalWords || 0}
            </div>
            <p className="text-xs text-[var(--ink-secondary)]">In your personal word bank</p>
          </div>

          {/* Currently Learning */}
          <div
            onClick={() => onQuickStudy('learning')}
            className="space-y-1 cursor-pointer group"
          >
            <span className="text-xs text-[var(--accent-cypress)] font-semibold block">
              Currently Learning
            </span>
            <div className="editorial-title text-4xl sm:text-5xl font-semibold text-[var(--accent-cypress)]">
              {stats?.currentlyStudying || 0}
            </div>
            <p className="text-xs text-[var(--ink-secondary)]">Words you are practicing</p>
          </div>

          {/* Words to Practice More */}
          <div
            onClick={() => onQuickTest('struggling')}
            className="space-y-1 cursor-pointer group"
          >
            <span className="text-xs text-[var(--accent-terracotta)] font-semibold block">
              Need Practice
            </span>
            <div className="editorial-title text-4xl sm:text-5xl font-semibold text-[var(--accent-terracotta)]">
              {stats?.struggling || 0}
            </div>
            <p className="text-xs text-[var(--ink-secondary)]">Tricky words to review</p>
          </div>

          {/* Mastered Words */}
          <div
            onClick={() => onNavigate('library')}
            className="space-y-1 cursor-pointer group"
          >
            <span className="text-xs text-[var(--accent-ochre)] font-semibold block">
              Mastered Words
            </span>
            <div className="editorial-title text-4xl sm:text-5xl font-semibold text-[var(--accent-ochre)]">
              {stats?.mastered || 0}
            </div>
            <p className="text-xs text-[var(--ink-secondary)]">Words you know by heart</p>
          </div>
        </div>
      </section>

      {/* 4. Recent Study History */}
      <section className="space-y-4 pt-4 border-t border-[var(--border-subtle)]">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)]">
            Recent Activity
          </div>
          <span className="text-xs text-[var(--ink-secondary)]">
            Overall Accuracy: <strong className="text-[var(--accent-ochre)] font-semibold">{stats?.accuracyRate || 85}%</strong>
          </span>
        </div>

        {stats?.recentSessions && stats.recentSessions.length > 0 ? (
          <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-[var(--border-subtle)]">
            {stats.recentSessions.map((session) => (
              <div
                key={session.id}
                className="py-3.5 flex items-center justify-between text-xs hover:bg-[var(--accent-ochre-dim)] px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                      session.type === 'test'
                        ? 'text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10'
                        : 'text-[var(--accent-cypress)] bg-[var(--accent-cypress)]/10'
                    }`}
                  >
                    {session.type === 'test' ? 'Quiz' : 'Flashcards'}
                  </span>
                  <span className="text-[var(--ink-primary)] font-medium">
                    {session.type === 'test'
                      ? `Scored ${session.score} out of ${session.totalQuestions} correct (${session.accuracyPercentage}%)`
                      : `Practiced ${session.cardsStudied} flashcards`}
                  </span>
                </div>
                <span className="text-[var(--ink-muted)] text-[11px]">
                  {new Date(session.date).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-[var(--ink-muted)] border border-dashed border-[var(--border-subtle)] rounded-xl">
            No study activity yet today. Click <strong>Learn 10 New Words</strong> above to begin your Arabic journey!
          </div>
        )}
      </section>
    </div>
  );
};
