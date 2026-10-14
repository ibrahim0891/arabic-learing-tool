export interface Word {
  id: string;
  arabic: string; // with full diacritics / harakat
  transliteration: string;
  english: string;
  wordType: 'noun' | 'verb' | 'adjective' | 'expression' | 'phrase' | string;
  presentTenseI?: string; // For verbs: 'I' form (e.g. أَدْرُسُ)
  presentTenseHe?: string; // For verbs: 'he' form (e.g. يَدْرُسُ)
  root?: string; // optional root (e.g. د-ر-س)
  exampleArabic: string;
  exampleTransliteration: string;
  exampleEnglish: string;
  explanation: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  setId?: string;
  setName?: string;
  dateAdded: string; // ISO string
  timesTested: number;
  timesCorrect: number;
  timesIncorrect: number;
  memoryStatus: 'new' | 'learning' | 'struggling' | 'mastered';
  easeFactor: number; // default 2.5
  intervalDays: number; // SRS interval
  repetitionCount: number;
  nextReviewDate: string; // ISO string
  lastReviewedDate?: string; // ISO string
}

export interface WordSet {
  id: string;
  title: string;
  themeContext: string; // realistic situation / storyline
  topic: string;
  difficulty: string;
  createdAt: string;
  wordsCount: number;
}

export interface StudySessionLog {
  id: string;
  date: string; // ISO
  type: 'flashcard' | 'test';
  cardsStudied: number;
  score?: number;
  totalQuestions?: number;
  accuracyPercentage?: number;
  notes?: string;
}

export interface QuizQuestion {
  id: string;
  wordId: string;
  type: 'multiple-choice' | 'typing' | 'fill-in-blank' | 'sentence-completion';
  direction: 'ar-to-en' | 'en-to-ar';
  prompt: string;
  subPrompt?: string;
  correctAnswer: string;
  acceptableAnswers?: string[];
  options?: string[]; // 4 options for multiple choice
  explanation: string;
  wordContext: {
    arabic: string;
    transliteration: string;
    english: string;
    exampleArabic: string;
    exampleEnglish: string;
  };
}

export interface QuizResult {
  score: number;
  total: number;
  accuracy: number;
  missedWordIds: string[];
  detailedResults: {
    questionId: string;
    wordId: string;
    wordArabic: string;
    wordEnglish: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[];
}

export interface DashboardStats {
  totalLearned: number;
  currentlyStudying: number;
  struggling: number;
  mastered: number;
  readyForRevision: number;
  totalWords: number;
  todayStudiedCount: number;
  dailyGoal: number;
  recentSessions: StudySessionLog[];
  accuracyRate: number;
}
