import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file stored locally in data/arabic_learning.db
const dbDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'arabic_learning.db');
const db = new Database(dbPath);

// Enable WAL mode for high performance & safe concurrent reads
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS word_sets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    themeContext TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    wordsCount INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS words (
    id TEXT PRIMARY KEY,
    arabic TEXT NOT NULL,
    transliteration TEXT NOT NULL,
    english TEXT NOT NULL,
    wordType TEXT NOT NULL,
    presentTenseI TEXT,
    presentTenseHe TEXT,
    root TEXT,
    exampleArabic TEXT NOT NULL,
    exampleTransliteration TEXT NOT NULL,
    exampleEnglish TEXT NOT NULL,
    explanation TEXT NOT NULL,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    setId TEXT,
    setName TEXT,
    dateAdded TEXT NOT NULL,
    timesTested INTEGER NOT NULL DEFAULT 0,
    timesCorrect INTEGER NOT NULL DEFAULT 0,
    timesIncorrect INTEGER NOT NULL DEFAULT 0,
    memoryStatus TEXT NOT NULL DEFAULT 'new', -- 'new', 'learning', 'struggling', 'mastered'
    easeFactor REAL NOT NULL DEFAULT 2.5,
    intervalDays INTEGER NOT NULL DEFAULT 0,
    repetitionCount INTEGER NOT NULL DEFAULT 0,
    nextReviewDate TEXT NOT NULL,
    lastReviewedDate TEXT,
    FOREIGN KEY(setId) REFERENCES word_sets(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_words_arabic ON words(arabic);
  CREATE INDEX IF NOT EXISTS idx_words_memoryStatus ON words(memoryStatus);
  CREATE INDEX IF NOT EXISTS idx_words_nextReviewDate ON words(nextReviewDate);
  CREATE INDEX IF NOT EXISTS idx_words_setId ON words(setId);

  CREATE TABLE IF NOT EXISTS study_sessions (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    type TEXT NOT NULL, -- 'flashcard' or 'test'
    cardsStudied INTEGER NOT NULL,
    score INTEGER,
    totalQuestions INTEGER,
    accuracyPercentage REAL,
    notes TEXT
  );

  CREATE TABLE IF NOT EXISTS test_history (
    id TEXT PRIMARY KEY,
    sessionId TEXT NOT NULL,
    wordId TEXT NOT NULL,
    isCorrect INTEGER NOT NULL,
    testedAt TEXT NOT NULL,
    FOREIGN KEY(sessionId) REFERENCES study_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY(wordId) REFERENCES words(id) ON DELETE CASCADE
  );
`);

export default db;
