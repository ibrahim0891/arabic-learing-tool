import { Word } from './types';

/**
 * SuperMemo SM-2 inspired Spaced Repetition calculation
 * 
 * Rating:
 * 1: Again (forgot completely)   -> counted as a FAILURE (resets the pass streak)
 * 2: Difficult (remembered with effort) -> counted as a PASS (SM-2 quality 3)
 * 3: Good (remembered correctly with little hesitation) -> PASS
 * 4: Easy (immediate, effortless recall) -> PASS
 *
 * `repetitionCount` tracks the current streak of consecutive successful
 * recalls: it resets to 0 on "Again" and increments on every pass. Memory
 * status is derived from that streak so it always reflects your CURRENT
 * recall of the word rather than a lifetime average.
 */
export function calculateNextReview(word: Word, rating: 1 | 2 | 3 | 4): {
  intervalDays: number;
  repetitionCount: number;
  easeFactor: number;
  nextReviewDate: string;
  memoryStatus: 'new' | 'learning' | 'struggling' | 'mastered';
} {
  let { easeFactor, intervalDays, repetitionCount } = word;

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

  // Determine memory status from the CURRENT recall streak (recency-based),
  // so old mistakes no longer permanently cap a word below "mastered".
  // - 'struggling': failed this review, or was struggling and has not yet
  //   earned 2 consecutive successful recalls (keeps the tag sticky).
  // - 'mastered': 5 consecutive successful recalls.
  // - 'learning': in progress.
  // NOTE: because "Again" resets the streak to 0, a word is never marked
  // mastered off a single lucky guess — it must be recalled repeatedly.
  let newStatus: 'new' | 'learning' | 'struggling' | 'mastered' = 'learning';

  const wasStruggling = word.memoryStatus === 'struggling';

  if (rating === 1) {
    newStatus = 'struggling';
  } else if (wasStruggling && repetitionCount < 2) {
    newStatus = 'struggling';
  } else if (repetitionCount >= 5) {
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
 * Intelligently sort words for spaced repetition study:
 * 1. Due / Overdue for review (nextReviewDate <= now): sorted by most overdue first.
 *    - Struggling words due for review get extra urgency boost.
 * 2. Struggling words (need reinforcement even if technically due today or tomorrow).
 * 3. Fresh / Untested words (timesTested === 0 or memoryStatus === 'new') to introduce new vocabulary.
 * 4. Words marked 'Good' or 'Easy' that are NOT due yet (nextReviewDate > now): deferred to the back of the queue, ordered by nearest due date.
 */
export function sortWordsBySmartPriority(words: Word[]): Word[] {
  const now = Date.now();

  return [...words].sort((a, b) => {
    const aDueTime = a.nextReviewDate ? new Date(a.nextReviewDate).getTime() : 0;
    const bDueTime = b.nextReviewDate ? new Date(b.nextReviewDate).getTime() : 0;

    const aIsOverdue = aDueTime <= now;
    const bIsOverdue = bDueTime <= now;

    const aIsNew = !a.timesTested || a.timesTested === 0 || a.memoryStatus === 'new';
    const bIsNew = !b.timesTested || b.timesTested === 0 || b.memoryStatus === 'new';

    const aIsStruggling = a.memoryStatus === 'struggling';
    const bIsStruggling = b.memoryStatus === 'struggling';

    // Tier 1: Overdue cards (most urgent)
    if (aIsOverdue && !bIsOverdue) return -1;
    if (!aIsOverdue && bIsOverdue) return 1;

    if (aIsOverdue && bIsOverdue) {
      if (aIsStruggling && !bIsStruggling) return -1;
      if (!aIsStruggling && bIsStruggling) return 1;
      return aDueTime - bDueTime;
    }

    // Tier 2: Struggling cards
    if (aIsStruggling && !bIsStruggling) return -1;
    if (!aIsStruggling && bIsStruggling) return 1;

    // Tier 3: New words (fresh learning)
    if (aIsNew && !bIsNew) return -1;
    if (!aIsNew && bIsNew) return 1;

    // Tier 4: Future scheduled words (not due yet). Order by nearest due date
    return aDueTime - bDueTime;
  });
}

/** The named study decks a queue can be composed from. */
export type DeckName = 'smart' | 'focus' | 'revision' | 'struggling' | 'learning' | 'all';

/** A word whose scheduled review time has arrived. */
export function isDue(word: Word, now: number = Date.now()): boolean {
  return !!word.nextReviewDate && new Date(word.nextReviewDate).getTime() <= now;
}

/**
 * Compose a study deck from the full word bank.
 *
 * Pure and shared by the `/api/words/queue` endpoint and any client that needs
 * the same deck rules, so filtering logic never diverges between the two.
 */
export function composeDeck(words: Word[], deck: DeckName = 'smart', now: number = Date.now()): Word[] {
  switch (deck) {
    case 'smart':
      // Smart queue: omit mastered words that are NOT yet due.
      // They automatically reappear when their SRS review schedule arrives.
      return sortWordsBySmartPriority(words.filter(w => w.memoryStatus !== 'mastered' || isDue(w, now)));
    case 'focus':
      // Focus mode: only struggling + learning + new (never mastered, even if due)
      return sortWordsBySmartPriority(words.filter(w => w.memoryStatus !== 'mastered'));
    case 'revision':
      // Due for review: everything whose scheduled date has arrived
      return sortWordsBySmartPriority(words.filter(w => isDue(w, now)));
    case 'struggling':
      return sortWordsBySmartPriority(words.filter(w => w.memoryStatus === 'struggling'));
    case 'learning':
      return sortWordsBySmartPriority(words.filter(w => w.memoryStatus === 'learning'));
    case 'all':
      // All words in the word bank including all mastered words
      return sortWordsBySmartPriority(words);
    default:
      return sortWordsBySmartPriority(words);
  }
}

/** Options for building a casual practice deck (no SRS impact). */
export interface PracticeDeckOptions {
  ids?: string[]; // Explicit selection from the Word Bank
  status?: string; // OR a status tab, e.g. 'all' | 'learning' | 'struggling'
}

/** Compose a casual practice queue from an explicit id list or a status tab. */
export function composePracticeDeck(words: Word[], options: PracticeDeckOptions = {}): Word[] {
  if (options.ids && options.ids.length > 0) {
    const idSet = new Set(options.ids);
    return words.filter(w => idSet.has(w.id));
  }
  if (options.status) {
    return options.status === 'all'
      ? words
      : words.filter(w => w.memoryStatus === options.status);
  }
  return words;
}

/** Aggregate per-deck counts used to decorate deck-switcher buttons. */
export interface DeckCounts {
  smart: number;
  due: number;
  struggling: number;
  masteredOmitted: number;
  total: number;
}

/** Compute deck badge counts over the full word bank (pure, testable). */
export function computeDeckCounts(words: Word[], now: number = Date.now()): DeckCounts {
  return {
    smart: words.filter(w => w.memoryStatus !== 'mastered' || isDue(w, now)).length,
    due: words.filter(w => isDue(w, now)).length,
    struggling: words.filter(w => w.memoryStatus === 'struggling').length,
    masteredOmitted: words.filter(w => w.memoryStatus === 'mastered' && !isDue(w, now)).length,
    total: words.length,
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
