export interface RootFamilyWord {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
  wordType: string;
  pattern?: string;
  exampleArabic: string;
  exampleTransliteration: string;
  exampleEnglish: string;
}

export interface ExampleSentence {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
  scenario?: string; // e.g. "Formal/Business", "Casual Conversation", "Grammar Variation", etc.
  createdAt?: string;
  breakdown?: WordBreakdownItem[]; // Cached AI word-by-word analysis
}

export interface DailySentence {
  id: string; // 'current_daily_sentence'
  arabic: string;
  transliteration: string;
  english: string;
  slotDate: string; // YYYY-MM-DD
  slotIndex: number; // 0 (morning/first) or 1 (afternoon/second)
  updatedAt: string; // ISO string
}

export interface WordBreakdownItem {
  arabic: string; // The individual word exactly as it appears (with tashkeel)
  transliteration: string; // Phonetic transliteration of the isolated/in-context word
  english: string; // Contextual meaning of the word in this sentence
  note?: string; // Optional short grammatical / usage note
}

export interface ChatMessage {
  id: string;
  speakerName: string;
  speakerRole?: string; // e.g. "Customer", "Friend", "Taxi Driver"
  arabic: string; // Full tashkeel in White Dialect
  transliteration: string;
  english: string;
  breakdown?: WordBreakdownItem[]; // Lazily generated word-by-word analysis
}

export interface ConversationSession {
  id: string;
  title: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  speakerCount: number;
  speakers: string[]; // ['Tariq', 'Layla']
  messages: ChatMessage[];
  createdAt: string;
}

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
  exampleBreakdown?: WordBreakdownItem[]; // Cached AI word-by-word analysis of the primary sentence
  explanation: string;
  additionalExamples?: ExampleSentence[]; // Additional AI-generated sentences
  rootFamily?: RootFamilyWord[]; // 6-10 AI-derived words from the same root
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  setId?: string;
  setName?: string;
  // Plural and Opposite linguistic forms
  pluralArabic?: string;
  pluralTransliteration?: string;
  pluralEnglish?: string;
  oppositeArabic?: string;
  oppositeTransliteration?: string;
  oppositeEnglish?: string;
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
  isRequeued?: boolean; // In-session repetition for cards marked "Again"
}

export interface DraftWord {
  id: string;
  arabic: string;
  transliteration: string;
  english: string;
  wordType: string;
  presentTenseI?: string;
  presentTenseHe?: string;
  root?: string;
  exampleArabic: string;
  exampleTransliteration: string;
  exampleEnglish: string;
  explanation: string;
  pluralArabic?: string;
  pluralTransliteration?: string;
  pluralEnglish?: string;
  oppositeArabic?: string;
  oppositeTransliteration?: string;
  oppositeEnglish?: string;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  sourceTopic?: string;
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
