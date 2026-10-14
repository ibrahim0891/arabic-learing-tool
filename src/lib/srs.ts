import { Word } from './types';

/**
 * SuperMemo SM-2 inspired Spaced Repetition calculation
 * 
 * Rating:
 * 1: Again (forgot completely)
 * 2: Difficult (remembered with effort)
 * 3: Good (remembered correctly with little hesitation)
 * 4: Easy (immediate, effortless recall)
 */
export function calculateNextReview(word: Word, rating: 1 | 2 | 3 | 4): {
  intervalDays: number;
  repetitionCount: number;
  easeFactor: number;
  nextReviewDate: string;
  memoryStatus: 'new' | 'learning' | 'struggling' | 'mastered';
} {
  let { easeFactor, intervalDays, repetitionCount, timesCorrect, timesIncorrect } = word;

  // Ensure reasonable defaults
  if (!easeFactor || easeFactor < 1.3) easeFactor = 2.5;
  if (intervalDays === undefined) intervalDays = 0;
  if (repetitionCount === undefined) repetitionCount = 0;

  // Map 1-4 to SM-2 quality grade (0 to 5)
  // 1 -> 1 (complete failure)
  // 2 -> 3 (difficult pass)
  // 3 -> 4 (good pass)
  // 4 -> 5 (perfect recall)
  const quality = rating === 1 ? 1 : rating === 2 ? 3 : rating === 3 ? 4 : 5;

  // SM-2 Ease Factor calculation
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  if (easeFactor < 1.3) easeFactor = 1.3;

  if (rating === 1) {
    // Forgot: reset repetition cycle
    repetitionCount = 0;
    intervalDays = 1;
  } else if (rating === 2) {
    // Difficult: advance cautiously
    if (repetitionCount === 0) {
      intervalDays = 1;
    } else if (repetitionCount === 1) {
      intervalDays = 2;
    } else {
      intervalDays = Math.max(2, Math.round(intervalDays * 1.2));
    }
    repetitionCount += 1;
  } else if (rating === 3) {
    // Good: standard SM-2 intervals
    if (repetitionCount === 0) {
      intervalDays = 1;
    } else if (repetitionCount === 1) {
      intervalDays = 4;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor);
    }
    repetitionCount += 1;
  } else {
    // Easy: accelerated interval
    if (repetitionCount === 0) {
      intervalDays = 3;
    } else if (repetitionCount === 1) {
      intervalDays = 7;
    } else {
      intervalDays = Math.round(intervalDays * easeFactor * 1.3);
    }
    repetitionCount += 1;
  }

  // Calculate Next Review Date
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);

  // Determine memory status
  // Criteria:
  // - 'struggling': recently marked 'Again' multiple times or low success rate
  // - 'mastered': repetitionCount >= 5 and tested multiple times with high accuracy (NEVER marked on first try)
  // - 'learning': in progress
  let newStatus: 'new' | 'learning' | 'struggling' | 'mastered' = 'learning';

  const totalTested = (timesCorrect || 0) + (timesIncorrect || 0) + 1;
  const newTimesCorrect = rating >= 3 ? (timesCorrect || 0) + 1 : (timesCorrect || 0);
  const correctRate = newTimesCorrect / totalTested;

  if (rating === 1 || correctRate < 0.5) {
    newStatus = 'struggling';
  } else if (repetitionCount >= 5 && totalTested >= 5 && correctRate >= 0.85) {
    newStatus = 'mastered';
  } else {
    newStatus = 'learning';
  }

  return {
    intervalDays,
    repetitionCount,
    easeFactor: Number(easeFactor.toFixed(2)),
    nextReviewDate: nextDate.toISOString(),
    memoryStatus: newStatus,
  };
}

/**
 * Remove Arabic diacritics (harakāt) for flexible fuzzy matching during typing tests
 */
export function stripHarakat(text: string): string {
  if (!text) return '';
  return text
    .normalize('NFKD')
    // Remove Arabic diacritical marks: fatḥah, kasrah, ḍammah, sukūn, shaddah, tanwīn, dagger alif
    .replace(/[\u064B-\u065F\u0670]/g, '')
    // Normalize alif with hamza / wasla: أ, إ, آ, ٱ -> ا
    .replace(/[أإآٱ]/g, 'ا')
    // Normalize taa marbuta ة -> ه (or vice versa for tolerant grading)
    .replace(/ة/g, 'ه')
    // Normalize alif maqsura ى -> ي
    .replace(/ى/g, 'ي')
    .trim()
    .toLowerCase();
}

/**
 * Check if user input matches correct answer with reasonable tolerance
 */
export function checkAnswerTolerance(userAns: string, correctAns: string, acceptable: string[] = []): boolean {
  if (!userAns || !correctAns) return false;

  const cleanUser = userAns.trim().toLowerCase();
  const cleanCorrect = correctAns.trim().toLowerCase();

  // 1. Direct case-insensitive match
  if (cleanUser === cleanCorrect) return true;

  // 2. Acceptable alternatives check
  for (const alt of acceptable) {
    if (cleanUser === alt.trim().toLowerCase()) return true;
  }

  // 3. Arabic stripped harakat & normalization check
  const strippedUser = stripHarakat(cleanUser);
  const strippedCorrect = stripHarakat(cleanCorrect);
  if (strippedUser.length > 0 && strippedUser === strippedCorrect) return true;

  for (const alt of acceptable) {
    if (strippedUser === stripHarakat(alt)) return true;
  }

  // 4. English meaning tolerance: e.g. "to read" vs "read", "a book" vs "book", "the school" vs "school"
  const removeArticlesAndInf = (str: string) => {
    return str
      .replace(/^(to\s+|a\s+|an\s+|the\s+)/i, '')
      .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, '')
      .trim();
  };

  const normUser = removeArticlesAndInf(cleanUser);
  const normCorrect = removeArticlesAndInf(cleanCorrect);

  if (normUser === normCorrect) return true;

  // Check if correct English meaning is a list of synonyms separated by comma or semicolon
  const synonyms = cleanCorrect.split(/[,;/]/).map(s => removeArticlesAndInf(s.trim()));
  if (synonyms.includes(normUser)) return true;

  return false;
}
