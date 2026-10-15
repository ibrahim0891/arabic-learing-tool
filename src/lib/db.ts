import path from 'path';
import fs from 'fs';

// Database file stored locally in data/ or /tmp (for read-only filesystems like Vercel serverless)
function getDatabaseInstance() {
  try {
    const Database = require('better-sqlite3');
    const isVercel = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined;
    const dbDir = isVercel ? '/tmp/data' : path.join(process.cwd(), 'data');

    if (!fs.existsSync(dbDir)) {
      try {
        fs.mkdirSync(dbDir, { recursive: true });
      } catch (_) {}
    }

    const dbPath = path.join(dbDir, 'arabic_learning.db');
    const db = new Database(dbPath);

    // Enable WAL mode
    try {
      db.pragma('journal_mode = WAL');
    } catch (_) {}

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
        memoryStatus TEXT NOT NULL DEFAULT 'new',
        easeFactor REAL NOT NULL DEFAULT 2.5,
        intervalDays INTEGER NOT NULL DEFAULT 0,
        repetitionCount INTEGER NOT NULL DEFAULT 0,
        nextReviewDate TEXT NOT NULL,
        lastReviewedDate TEXT,
        additionalExamples TEXT,
        FOREIGN KEY(setId) REFERENCES word_sets(id) ON DELETE SET NULL
      );

      CREATE INDEX IF NOT EXISTS idx_words_arabic ON words(arabic);
      CREATE INDEX IF NOT EXISTS idx_words_memoryStatus ON words(memoryStatus);
      CREATE INDEX IF NOT EXISTS idx_words_nextReviewDate ON words(nextReviewDate);
      CREATE INDEX IF NOT EXISTS idx_words_setId ON words(setId);

      CREATE TABLE IF NOT EXISTS draft_words (
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
        createdAt TEXT NOT NULL,
        sourceTopic TEXT
      );

      CREATE INDEX IF NOT EXISTS idx_draft_words_arabic ON draft_words(arabic);

      CREATE TABLE IF NOT EXISTS study_sessions (
        id TEXT PRIMARY KEY,
        date TEXT NOT NULL,
        type TEXT NOT NULL,
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

    // Safe migration for existing SQLite files
    try {
      db.exec("ALTER TABLE words ADD COLUMN additionalExamples TEXT;");
    } catch (_) {}

    return db;
  } catch (err) {
    console.warn('SQLite database unavailable in current environment:', err);
    // Return dummy no-op object so serverless does not crash on module load
    return {
      prepare: () => ({
        get: () => ({ count: 0 }),
        all: () => [],
        run: () => ({ changes: 0, lastInsertRowid: 0 }),
      }),
      exec: () => {},
      pragma: () => {},
    };
  }
}

// Cached singleton
const db: any = getDatabaseInstance();
export default db;
