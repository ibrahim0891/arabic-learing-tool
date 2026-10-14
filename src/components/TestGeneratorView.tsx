'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Sparkles,
  Check,
  X,
  RotateCw,
  Loader2,
  ArrowRight,
  Keyboard as KeyboardIcon
} from 'lucide-react';
import { WordSet, QuizQuestion, QuizResult } from '@/lib/types';
import { AudioPronounceButton } from './AudioPronounceButton';
import { ArabicVirtualKeyboard } from './ArabicVirtualKeyboard';
import confetti from 'canvas-confetti';

interface TestGeneratorProps {
  initialFilter?: string;
  onTestComplete?: () => void;
}

export const TestGeneratorView: React.FC<TestGeneratorProps> = ({
  initialFilter = 'all',
  onTestComplete,
}) => {
  const [sets, setSets] = useState<WordSet[]>([]);
  const [selectedSetId, setSelectedSetId] = useState<string>('all');
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [direction, setDirection] = useState<'mixed' | 'ar-to-en' | 'en-to-ar'>('mixed');
  const [filter, setFilter] = useState<string>(initialFilter);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([
    'multiple-choice',
    'typing',
    'fill-in-blank',
  ]);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isGrading, setIsGrading] = useState<boolean>(false);
  const [testActive, setTestActive] = useState<boolean>(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentInput, setCurrentInput] = useState<string>('');
  const [showArabicKeyboard, setShowArabicKeyboard] = useState<boolean>(true);

  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSets();
  }, []);

  const fetchSets = async () => {
    try {
      const res = await fetch('/api/word-sets');
      const data = await res.json();
      setSets(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleStartTest = async (overrideFilter?: string) => {
    setIsGenerating(true);
    setError(null);
    setQuizResult(null);

    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate',
          setId: selectedSetId,
          questionCount,
          direction,
          filter: overrideFilter || filter,
          questionTypes: selectedTypes,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate quiz');
      }

      const data = await res.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('No words found to quiz. Please learn or add words to your word bank first!');
      }

      setQuestions(data.questions);
      setUserAnswers({});
      setCurrentInput('');
      setCurrentQIndex(0);
      setTestActive(true);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error generating quiz');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectOption = (option: string) => {
    const q = questions[currentQIndex];
    if (!q) return;

    setUserAnswers((prev) => ({
      ...prev,
      [q.id]: option,
    }));
  };

  const handleNextQuestion = () => {
    const q = questions[currentQIndex];
    if (q.type === 'typing' && currentInput.trim()) {
      setUserAnswers((prev) => ({
        ...prev,
        [q.id]: currentInput.trim(),
      }));
    }

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      const nextQ = questions[currentQIndex + 1];
      setCurrentInput(userAnswers[nextQ?.id] || '');
    } else {
      handleFinishTest();
    }
  };

  const handleFinishTest = async () => {
    setIsGrading(true);
    setError(null);

    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        wordId: q.wordId,
        userAnswer: (q.type === 'typing' && currentQIndex === questions.length - 1 ? currentInput : userAnswers[q.id]) || '',
        correctAnswer: q.correctAnswer,
        acceptableAnswers: q.acceptableAnswers || [],
      }));

      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grade',
          answers: answersPayload,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to grade quiz');
      }

      const result: QuizResult = await res.json();
      setQuizResult(result);
      setTestActive(false);

      if (result.accuracy >= 70) {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      if (onTestComplete) onTestComplete();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error grading quiz');
    } finally {
      setIsGrading(false);
    }
  };

  const currentQ = questions[currentQIndex];

  // 1. RESULTS VIEW
  if (quizResult) {
    return (
      <div className="max-w-3xl mx-auto space-y-10 animate-fadeIn">
        <div className="border-b border-[var(--border-subtle)] pb-6 space-y-3">
          <span className="text-xs uppercase tracking-wider font-semibold text-[var(--accent-ochre)]">
            Quiz Completed!
          </span>
          <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4">
            <div>
              <h2 className="editorial-title text-3xl font-semibold text-[var(--ink-primary)]">
                {quizResult.accuracy >= 80 ? 'Awesome job!' : 'Good effort! Keep practicing!'}
              </h2>
              <p className="font-arabic text-2xl text-[var(--accent-ochre)] mt-1 font-semibold">
                {quizResult.accuracy >= 80 ? 'نَتِيجَةٌ مُمْتَازَة !' : 'أَحْسَنْتَ، وَاصِل التَّدْرِيب !'}
              </p>
            </div>
            <div className="font-serif text-4xl text-[var(--ink-primary)]">
              {quizResult.score} <span className="text-xl text-[var(--ink-muted)]">/ {quizResult.total}</span>
              <span className="text-sm font-sans text-[var(--accent-ochre)] block text-right font-semibold">
                {quizResult.accuracy}% correct
              </span>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap gap-3">
            {quizResult.missedWordIds.length > 0 && (
              <button
                onClick={() => handleStartTest('struggling')}
                className="btn-quiet px-4 py-2.5 rounded-xl text-xs font-semibold text-[var(--accent-terracotta)] border-[var(--accent-terracotta)]/40 hover:bg-[var(--accent-terracotta)]/10 flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCw className="w-3.5 h-3.5" /> Retry Missed Words ({quizResult.missedWordIds.length})
              </button>
            )}

            <button
              onClick={() => {
                setQuizResult(null);
                setTestActive(false);
              }}
              className="btn-ochre px-5 py-2.5 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Take Another Quiz
            </button>
          </div>
        </div>

        {/* Answer Breakdown */}
        <div className="space-y-4">
          <div className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-muted)]">
            Review Your Answers ({quizResult.detailedResults.length})
          </div>

          <div className="divide-y divide-[var(--border-subtle)] border-t border-b border-[var(--border-subtle)]">
            {quizResult.detailedResults.map((r, i) => (
              <div key={i} className="py-4 space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-semibold">
                    Question {i + 1} • {r.isCorrect ? <span className="text-[var(--accent-cypress)]">✓ Correct</span> : <span className="text-[var(--accent-terracotta)]">✗ Missed</span>}
                  </span>
                  <span className="font-arabic text-2xl font-bold text-[var(--accent-ochre)] harakat-text">
                    {r.wordArabic}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--ink-muted)] block text-[11px]">Your Answer:</span>
                    <span className={r.isCorrect ? 'text-[var(--accent-cypress)] font-semibold' : 'text-[var(--accent-terracotta)] line-through'}>
                      {r.userAnswer || '(Left blank)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--ink-muted)] block text-[11px]">Correct Answer:</span>
                    <span className="text-[var(--ink-primary)] font-semibold">{r.correctAnswer}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE QUIZ RUNNER
  if (testActive && currentQ) {
    const isAnswered = currentQ.type === 'typing'
      ? !!currentInput.trim()
      : !!userAnswers[currentQ.id];

    return (
      <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
        <div className="flex justify-between items-baseline border-b border-[var(--border-subtle)] pb-3 text-xs">
          <span className="font-semibold text-[var(--ink-muted)]">
            Question {currentQIndex + 1} of {questions.length}
          </span>
          <span className="px-2 py-0.5 rounded-full bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] font-semibold text-[11px]">
            {currentQ.type === 'multiple-choice' ? 'Multiple Choice' : currentQ.type === 'typing' ? 'Type the Answer' : 'Fill in the Blank'}
          </span>
        </div>

        <div className="space-y-6">
          <h2 className="editorial-title text-2xl font-semibold text-[var(--ink-primary)] leading-relaxed">
            {currentQ.prompt}
          </h2>

          {currentQ.subPrompt && (
            <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-center space-y-2">
              <div className="font-arabic text-3xl font-bold text-[var(--accent-ochre)] harakat-text leading-loose">
                {currentQ.subPrompt}
              </div>
              {currentQ.direction === 'ar-to-en' && (
                <div className="flex justify-center pt-1">
                  <AudioPronounceButton arabicText={currentQ.wordContext.arabic} size="sm" />
                </div>
              )}
            </div>
          )}

          {/* Options */}
          {(currentQ.type === 'multiple-choice' || currentQ.type === 'fill-in-blank') && currentQ.options && (
            <div className="space-y-2.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = userAnswers[currentQ.id] === opt;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full p-4 rounded-xl text-left text-sm font-medium transition border cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? 'bg-[var(--accent-ochre-dim)] border-[var(--accent-ochre)] text-[var(--ink-primary)] ring-1 ring-[var(--accent-ochre)]'
                        : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <span className={opt.match(/[\u0600-\u06FF]/) ? 'font-arabic text-xl' : ''}>
                      {opt}
                    </span>
                    <span className="w-6 h-6 rounded-full border border-[var(--border-subtle)] flex items-center justify-center text-xs font-semibold">
                      {String.fromCharCode(65 + idx)}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Typing */}
          {currentQ.type === 'typing' && (
            <div className="space-y-3">
              <div className="relative">
                <input
                  type="text"
                  autoFocus
                  placeholder={currentQ.direction === 'en-to-ar' ? 'اكتب بالعربية هنا...' : 'Type the English meaning here...'}
                  value={currentInput}
                  onChange={(e) => setCurrentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentInput.trim()) {
                      handleNextQuestion();
                    }
                  }}
                  className={`w-full p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-base focus:outline-none focus:border-[var(--accent-ochre)] ${
                    currentQ.direction === 'en-to-ar' ? 'font-arabic text-right text-2xl pr-4' : ''
                  }`}
                />

                {currentQ.direction === 'en-to-ar' && (
                  <button
                    type="button"
                    onClick={() => setShowArabicKeyboard(!showArabicKeyboard)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-xs font-medium text-[var(--accent-ochre)] hover:bg-[var(--accent-ochre-dim)] flex items-center gap-1 cursor-pointer transition border border-[var(--border-subtle)]"
                    title="Toggle Arabic Virtual Keyboard"
                  >
                    <KeyboardIcon className="w-4 h-4" />
                    <span className="hidden sm:inline">
                      {showArabicKeyboard ? 'Hide Keyboard' : 'Show Keyboard'}
                    </span>
                  </button>
                )}
              </div>

              {/* Render Arabic Virtual Keyboard for English-to-Arabic typing */}
              {currentQ.direction === 'en-to-ar' && showArabicKeyboard && (
                <div className="pt-2 animate-fadeIn">
                  <ArabicVirtualKeyboard
                    input={currentInput}
                    onChange={(val) => setCurrentInput(val)}
                  />
                </div>
              )}

              <p className="text-xs text-[var(--ink-muted)]">
                Tip: You can click the on-screen Arabic keyboard buttons above or type directly with your physical keyboard.
              </p>
            </div>
          )}

          <div className="pt-4 border-t border-[var(--border-subtle)] flex justify-between items-center text-xs">
            <button
              onClick={() => {
                if (currentQIndex > 0) {
                  setCurrentQIndex((prev) => prev - 1);
                  const prevQ = questions[currentQIndex - 1];
                  setCurrentInput(userAnswers[prevQ?.id] || '');
                }
              }}
              disabled={currentQIndex === 0}
              className="text-[var(--ink-muted)] hover:text-[var(--ink-primary)] disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            >
              Previous
            </button>

            <button
              onClick={handleNextQuestion}
              disabled={!isAnswered || isGrading}
              className="btn-ochre py-2.5 px-6 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer disabled:opacity-40"
            >
              {isGrading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking answers...
                </>
              ) : currentQIndex + 1 === questions.length ? (
                <>Finish Quiz & See Results</>
              ) : (
                <>Next Question <ArrowRight className="w-3.5 h-3.5" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. QUIZ SETUP
  return (
    <div className="max-w-3xl mx-auto space-y-10 animate-fadeIn">
      <div className="space-y-2 border-b border-[var(--border-subtle)] pb-6">
        <div className="text-xs uppercase tracking-wider font-semibold text-[var(--accent-ochre)]">
          Quiz Time
        </div>
        <h1 className="editorial-title text-3xl sm:text-4xl font-semibold text-[var(--ink-primary)]">
          Test Your Arabic Vocabulary
        </h1>
        <p className="text-sm text-[var(--ink-secondary)] max-w-xl leading-relaxed">
          See how well you remember your saved words! Choose how many questions you want and what kinds of questions to include.
        </p>
      </div>

      <div className="space-y-8">
        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)] block mb-1.5">
            Which words would you like to test?
          </label>
          <select
            value={selectedSetId}
            onChange={(e) => setSelectedSetId(e.target.value)}
            className="w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm focus:outline-none focus:border-[var(--accent-ochre)]"
          >
            <option value="all">All words in my Word Bank (Recommended)</option>
            {sets.map((s) => (
              <option key={s.id} value={s.id}>
                Topic Set: {s.title} ({s.wordsCount} words)
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)] block mb-1.5">
              How many questions?
            </label>
            <select
              value={questionCount}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              className="w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm focus:outline-none focus:border-[var(--accent-ochre)]"
            >
              <option value={5}>5 Questions (Quick bite)</option>
              <option value={10}>10 Questions (Standard)</option>
              <option value={15}>15 Questions (Challenge)</option>
            </select>
          </div>

          <div>
            <label className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)] block mb-1.5">
              Word selection
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-sm focus:outline-none focus:border-[var(--accent-ochre)]"
            >
              <option value="all">All my studied words</option>
              <option value="revision">Words due for review only</option>
              <option value="struggling">Tricky words I missed before</option>
              <option value="new">Recently added words</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs uppercase tracking-wider font-semibold text-[var(--ink-secondary)] block mb-2">
            Quiz Direction
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'mixed', label: 'Mixed', sub: 'Arabic & English' },
              { id: 'ar-to-en', label: 'Arabic → English', sub: 'Read Arabic, choose English' },
              { id: 'en-to-ar', label: 'English → Arabic', sub: 'Write or pick Arabic word' },
            ].map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => setDirection(d.id as any)}
                className={`p-3.5 rounded-xl border text-center transition cursor-pointer ${
                  direction === d.id
                    ? 'bg-[var(--accent-ochre-dim)] border-[var(--accent-ochre)] text-[var(--ink-primary)] ring-1 ring-[var(--accent-ochre)]'
                    : 'bg-[var(--bg-surface)] border-[var(--border-subtle)] text-[var(--ink-muted)] hover:border-[var(--border-strong)]'
                }`}
              >
                <div className="text-xs font-bold">{d.label}</div>
                <div className="text-[11px] opacity-75 mt-0.5">{d.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="p-3.5 text-xs text-[var(--accent-terracotta)] bg-[var(--accent-terracotta)]/10 border border-[var(--accent-terracotta)]/20 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="button"
          onClick={() => handleStartTest()}
          disabled={isGenerating}
          className="w-full btn-ochre py-3.5 px-6 rounded-xl text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Preparing Your Quiz...
            </>
          ) : (
            <>
              <GraduationCap className="w-4 h-4" /> Start Quiz Now
            </>
          )}
        </button>
      </div>
    </div>
  );
};
