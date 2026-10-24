'use client';

import React, { useEffect } from 'react';
import { QuizQuestion } from '@/lib/types';
import { Panel } from '@/components/ui/Panel';
import { Heading } from '@/components/ui/Heading';
import { Text } from '@/components/ui/Text';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ArabicText } from '@/components/ui/ArabicText';
import { AudioPronounceButton } from '@/components/AudioPronounceButton';
import { ArabicVirtualKeyboard } from '@/components/ArabicVirtualKeyboard';
import { QuestionOptionCard } from '../_components/QuestionOptionCard';
import { QuizProgressCard } from '../_components/QuizProgressCard';
import { QuizQuestionQueue } from '../_components/QuizQuestionQueue';
import { QuizShortcutsCard } from '../_components/QuizShortcutsCard';
import {
  ArrowLeft,
  ArrowRight,
  Keyboard as KeyboardIcon,
  CheckCircle2,
  X,
} from 'lucide-react';

interface QuizRunnerSectionProps {
  questions: QuizQuestion[];
  currentQIndex: number;
  userAnswers: Record<string, string>;
  currentInput: string;
  onSelectOption: (option: string) => void;
  onInputChange: (val: string) => void;
  onNextQuestion: () => void;
  onPrevQuestion: () => void;
  onJumpToIndex: (index: number) => void;
  onExitQuiz: () => void;
  showArabicKeyboard: boolean;
  onToggleArabicKeyboard: () => void;
  isGrading: boolean;
}

export const QuizRunnerSection: React.FC<QuizRunnerSectionProps> = ({
  questions,
  currentQIndex,
  userAnswers,
  currentInput,
  onSelectOption,
  onInputChange,
  onNextQuestion,
  onPrevQuestion,
  onJumpToIndex,
  onExitQuiz,
  showArabicKeyboard,
  onToggleArabicKeyboard,
  isGrading,
}) => {
  const currentQ = questions[currentQIndex];
  if (!currentQ) return null;

  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;

  const isCurrentAnswered =
    currentQ.type === 'typing'
      ? !!currentInput.trim()
      : !!userAnswers[currentQ.id];

  const typeLabels: Record<string, string> = {
    'multiple-choice': 'Multiple Choice',
    typing: 'Typing Practice',
    'fill-in-blank': 'Fill in the Blank',
    'sentence-completion': 'Sentence Completion',
  };

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is typing in a text field
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.key === 'ArrowLeft' && currentQIndex > 0) {
        e.preventDefault();
        onPrevQuestion();
        return;
      }

      if (e.key === 'Enter' && isCurrentAnswered && !isGrading) {
        e.preventDefault();
        onNextQuestion();
        return;
      }

      // 1-4 or A-D option selection for multiple-choice / fill-in-blank
      if (
        (currentQ.type === 'multiple-choice' || currentQ.type === 'fill-in-blank') &&
        currentQ.options
      ) {
        const key = e.key.toLowerCase();
        let selectedIdx = -1;
        if (key === '1' || key === 'a') selectedIdx = 0;
        else if (key === '2' || key === 'b') selectedIdx = 1;
        else if (key === '3' || key === 'c') selectedIdx = 2;
        else if (key === '4' || key === 'd') selectedIdx = 3;

        if (selectedIdx >= 0 && selectedIdx < currentQ.options.length) {
          e.preventDefault();
          onSelectOption(currentQ.options[selectedIdx]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentQIndex, currentQ, isCurrentAnswered, isGrading, onPrevQuestion, onNextQuestion, onSelectOption]);

  return (
    <div className="p-6 sm:p-10 max-w-[1216px] mx-auto flex flex-col gap-6 animate-fadeIn pb-16">
      {/* 1. Page Heading & End Session Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[26px] sm:text-[28px] leading-[38px] sm:leading-[42px] font-semibold text-[var(--ink-primary)] tracking-tight">
            Active Quiz Session
          </h1>
          <p className="text-[13px] sm:text-[14px] leading-[21px] text-[var(--ink-secondary)]">
            Test recall with diacritics and contextual reinforcement.
          </p>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={onExitQuiz}
          leftIcon={<X className="w-3.5 h-3.5" />}
        >
          Exit quiz
        </Button>
      </div>

      {/* 2. Controls & Metadata Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="ochre">
            {typeLabels[currentQ.type] || currentQ.type}
          </Badge>
          <Badge variant="neutral">
            {currentQ.direction === 'ar-to-en' ? 'Arabic → English' : 'English → Arabic'}
          </Badge>
          <span className="text-[12px] text-[var(--ink-secondary)] hidden md:inline">
            Answers are saved live as you advance
          </span>
        </div>

        <span className="font-mono text-[12px] text-[var(--ink-muted)]">
          Question {currentQIndex + 1} of {totalQuestions}
        </span>
      </div>

      {/* 3. Main Two-Column Arena Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Question Prompt & Interactive Form (8 of 12 columns) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          <Panel padding="lg" className="space-y-6 bg-[var(--bg-surface)] shadow-xs">
            {/* Question Prompt */}
            <div className="space-y-1">
              <Text color="muted" variant="meta" weight="bold" className="uppercase tracking-wider">
                Question Prompt
              </Text>
              <Heading level={2} className="text-[20px] sm:text-[22px] font-bold text-[var(--ink-primary)] leading-snug">
                {currentQ.prompt}
              </Heading>
            </div>

            {/* SubPrompt Word Showcase Card */}
            {currentQ.subPrompt && (
              <div className="p-6 rounded-[12px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-center space-y-3">
                <ArabicText
                  as="div"
                  size="2xl"
                  weight="bold"
                  color="accent"
                  className="text-[34px] sm:text-[42px] leading-[66px]"
                >
                  {currentQ.subPrompt}
                </ArabicText>

                {currentQ.direction === 'ar-to-en' && currentQ.wordContext?.arabic && (
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <AudioPronounceButton arabicText={currentQ.wordContext.arabic} size="md" />
                    <span className="text-[11px] text-[var(--ink-muted)]">Listen pronunciation</span>
                  </div>
                )}
              </div>
            )}

            {/* Multiple Choice / Fill in the blank Options */}
            {(currentQ.type === 'multiple-choice' || currentQ.type === 'fill-in-blank') &&
              currentQ.options && (
                <div className="space-y-2.5 pt-1">
                  <Text color="secondary" variant="meta" weight="bold" className="uppercase tracking-wider">
                    Select the correct answer:
                  </Text>
                  <div className="grid grid-cols-1 gap-2.5">
                    {currentQ.options.map((opt, idx) => {
                      const isSelected = userAnswers[currentQ.id] === opt;
                      return (
                        <QuestionOptionCard
                          key={idx}
                          option={opt}
                          index={idx}
                          isSelected={isSelected}
                          onSelect={() => onSelectOption(opt)}
                          disabled={isGrading}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

            {/* Typing Input Mode */}
            {currentQ.type === 'typing' && (
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <Text color="secondary" variant="meta" weight="bold" className="uppercase tracking-wider">
                    {currentQ.direction === 'en-to-ar'
                      ? 'Type Arabic translation:'
                      : 'Type English translation:'}
                  </Text>

                  {currentQ.direction === 'en-to-ar' && (
                    <button
                      type="button"
                      onClick={onToggleArabicKeyboard}
                      className="px-2.5 py-1 rounded-[6px] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] hover:border-[var(--accent-ochre)] text-[var(--accent-ochre)] text-[11px] font-semibold flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <KeyboardIcon className="w-3.5 h-3.5" />
                      <span>{showArabicKeyboard ? 'Hide Virtual Keyboard' : 'Show Virtual Keyboard'}</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  autoFocus
                  placeholder={
                    currentQ.direction === 'en-to-ar'
                      ? 'اكتب باللغة العربية هنا...'
                      : 'Type English meaning here...'
                  }
                  value={currentInput}
                  onChange={(e) => onInputChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && currentInput.trim()) {
                      onNextQuestion();
                    }
                  }}
                  className={`w-full p-4 rounded-[10px] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--ink-primary)] text-[15px] focus:outline-none focus:border-[var(--accent-ochre)] focus:ring-1 focus:ring-[var(--accent-ochre)] transition ${
                    currentQ.direction === 'en-to-ar'
                      ? 'font-arabic text-right text-[22px] leading-[36px]'
                      : ''
                  }`}
                />

                {/* Arabic Virtual Keyboard */}
                {currentQ.direction === 'en-to-ar' && showArabicKeyboard && (
                  <div className="pt-2 animate-fadeIn">
                    <ArabicVirtualKeyboard
                      input={currentInput}
                      onChange={(val) => onInputChange(val)}
                    />
                  </div>
                )}

                <p className="text-[11px] text-[var(--ink-muted)]">
                  Tip: Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--bg-canvas)] border border-[var(--border-subtle)] font-mono text-[10px]">Enter ↵</kbd> to submit immediately.
                </p>
              </div>
            )}

            {/* Navigation Footer */}
            <div className="pt-5 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="md"
                onClick={onPrevQuestion}
                disabled={currentQIndex === 0 || isGrading}
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>

              <Button
                variant="primary"
                size="md"
                onClick={onNextQuestion}
                disabled={!isCurrentAnswered || isGrading}
                isLoading={isGrading}
                rightIcon={
                  currentQIndex + 1 === totalQuestions ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )
                }
              >
                {isGrading
                  ? 'Grading Quiz...'
                  : currentQIndex + 1 === totalQuestions
                  ? 'Finish & Grade Quiz'
                  : 'Next Question'}
              </Button>
            </div>
          </Panel>
        </div>

        {/* Right Column: Widgets Stack (4 of 12 columns) */}
        <div className="lg:col-span-4 flex flex-col gap-5">
          {/* Widget 1: Session Progress */}
          <QuizProgressCard
            currentIndex={currentQIndex}
            totalQuestions={totalQuestions}
            answeredCount={answeredCount}
          />

          {/* Widget 2: Question Queue */}
          <QuizQuestionQueue
            questions={questions}
            currentIndex={currentQIndex}
            userAnswers={userAnswers}
            onSelectIndex={onJumpToIndex}
          />

          {/* Widget 3: Keyboard Shortcuts Guide */}
          <QuizShortcutsCard />
        </div>
      </div>
    </div>
  );
};
