'use client';

import React, { useState, useEffect } from 'react';
import { WordSet, QuizQuestion, QuizResult } from '@/lib/types';
import { QuizSetupSection } from './QuizSetupSection';
import { QuizRunnerSection } from './QuizRunnerSection';
import { QuizResultsSection } from './QuizResultsSection';
import confetti from 'canvas-confetti';

interface QuizWorkspaceProps {
  initialFilter?: string;
  onTestComplete?: () => void;
}

export const QuizWorkspace: React.FC<QuizWorkspaceProps> = ({
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
      if (res.ok) {
        const data = await res.json();
        setSets(data || []);
      }
    } catch (err) {
      console.error('Error fetching sets:', err);
    }
  };

  const handleToggleType = (type: string) => {
    setSelectedTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Keep at least one type
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
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
    let updatedAnswers = userAnswers;

    if (q.type === 'typing') {
      const trimmed = currentInput.trim();
      updatedAnswers = {
        ...userAnswers,
        [q.id]: trimmed,
      };
      setUserAnswers(updatedAnswers);
    }

    if (currentQIndex + 1 < questions.length) {
      setCurrentQIndex((prev) => prev + 1);
      const nextQ = questions[currentQIndex + 1];
      setCurrentInput(updatedAnswers[nextQ?.id] || '');
    } else {
      handleFinishTest(updatedAnswers);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQIndex > 0) {
      const q = questions[currentQIndex];
      let updated = userAnswers;
      if (q.type === 'typing') {
        updated = { ...userAnswers, [q.id]: currentInput.trim() };
        setUserAnswers(updated);
      }
      setCurrentQIndex((prev) => prev - 1);
      const prevQ = questions[currentQIndex - 1];
      setCurrentInput(updated[prevQ?.id] || '');
    }
  };

  const handleFinishTest = async (finalAnswers?: Record<string, string>) => {
    setIsGrading(true);
    setError(null);

    const answersToUse = finalAnswers || userAnswers;

    try {
      const answersPayload = questions.map((q) => ({
        questionId: q.id,
        wordId: q.wordId,
        userAnswer: answersToUse[q.id] || '',
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

  const handleJumpToIndex = (index: number) => {
    if (index >= 0 && index < questions.length) {
      const q = questions[currentQIndex];
      let updated = userAnswers;
      if (q && q.type === 'typing') {
        updated = { ...userAnswers, [q.id]: currentInput.trim() };
        setUserAnswers(updated);
      }
      setCurrentQIndex(index);
      const targetQ = questions[index];
      setCurrentInput(updated[targetQ?.id] || '');
    }
  };

  const handleExitQuiz = () => {
    setTestActive(false);
    setQuestions([]);
    setUserAnswers({});
    setCurrentInput('');
    setCurrentQIndex(0);
  };

  // Phase 1: Results View
  if (quizResult) {
    return (
      <QuizResultsSection
        quizResult={quizResult}
        onRetryMissed={() => handleStartTest('struggling')}
        onTakeAnother={() => {
          setQuizResult(null);
          setTestActive(false);
        }}
      />
    );
  }

  // Phase 2: Active Runner
  if (testActive && questions.length > 0) {
    return (
      <QuizRunnerSection
        questions={questions}
        currentQIndex={currentQIndex}
        userAnswers={userAnswers}
        currentInput={currentInput}
        onSelectOption={handleSelectOption}
        onInputChange={setCurrentInput}
        onNextQuestion={handleNextQuestion}
        onPrevQuestion={handlePrevQuestion}
        onJumpToIndex={handleJumpToIndex}
        onExitQuiz={handleExitQuiz}
        showArabicKeyboard={showArabicKeyboard}
        onToggleArabicKeyboard={() => setShowArabicKeyboard((prev) => !prev)}
        isGrading={isGrading}
      />
    );
  }

  // Phase 3: Setup View
  return (
    <QuizSetupSection
      sets={sets}
      selectedSetId={selectedSetId}
      onSetIdChange={setSelectedSetId}
      questionCount={questionCount}
      onQuestionCountChange={setQuestionCount}
      filter={filter}
      onFilterChange={setFilter}
      direction={direction}
      onDirectionChange={setDirection}
      selectedTypes={selectedTypes}
      onToggleType={handleToggleType}
      isGenerating={isGenerating}
      error={error}
      onStartQuiz={() => handleStartTest()}
    />
  );
};
