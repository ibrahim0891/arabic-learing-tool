import { stripHarakat } from './srs';

export interface WordIdentifier {
  id?: string;
  arabic: string;
  english: string;
  transliteration?: string;
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  reason?: 'arabic' | 'english' | 'both';
  matchingWord?: WordIdentifier;
  detail?: string;
}

/**
 * Normalizes Arabic text by removing harakat, unifying alif forms,
 * taa marbuta, alif maqsura, and tatweel for robust spelling comparison.
 */
export function normalizeArabic(text: string): string {
  if (!text) return '';
  return stripHarakat(text)
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/ـ/g, '') // tatweel
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Normalize an individual English sense token:
 * - Lowercase and trim
 * - Remove parenthetical text e.g. "computer (PC)" -> "computer"
 * - Strip leading articles / infinitives: "to read" -> "read", "a computer" -> "computer", "the car" -> "car"
 * - Strip extraneous punctuation
 */
export function normalizeSingleEnglishSense(sense: string): string {
  if (!sense) return '';
  return sense
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // remove (parenthesized text)
    .replace(/[.,/#!$%^&*;:{}=\-_`~"']/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(to\s+|a\s+|an\s+|the\s+)+/i, '') // strip leading to/a/an/the
    .trim();
}

/**
 * Extracts distinct normalized semantic senses from an English definition string.
 * Examples:
 * - "computer / laptop" -> ["computer", "laptop"]
 * - "to go out / leave" -> ["go out", "leave"]
 * - "hasub and hasib both means computer" -> ["computer"]
 */
export function extractEnglishSenses(english: string): string[] {
  if (!english || typeof english !== 'string') return [];

  // Split on typical definition delimiters: slash, semicolon, comma, pipe, or "or"
  const rawSegments = english.split(/[/;,|]|\bor\b/i);
  const sensesSet = new Set<string>();

  for (const raw of rawSegments) {
    const cleaned = normalizeSingleEnglishSense(raw);
    // Ignore single characters or common stop words that could cause false positives
    if (cleaned.length >= 2 && !['it', 'is', 'in', 'on', 'at', 'of', 'for'].includes(cleaned)) {
      sensesSet.add(cleaned);
    }
  }

  // Also include the full definition normalized as a whole (without parentheses)
  const fullNormalized = normalizeSingleEnglishSense(english);
  if (fullNormalized.length >= 2) {
    sensesSet.add(fullNormalized);
  }

  return Array.from(sensesSet);
}

/**
 * Check whether two English definitions share a semantic concept.
 */
export function areEnglishMeaningsDuplicate(
  englishA: string,
  englishB: string
): { isDuplicate: boolean; matchedSense?: string } {
  const sensesA = extractEnglishSenses(englishA);
  const sensesB = extractEnglishSenses(englishB);

  for (const sA of sensesA) {
    for (const sB of sensesB) {
      if (sA === sB) {
        return { isDuplicate: true, matchedSense: sA };
      }
    }
  }

  return { isDuplicate: false };
}

/**
 * Cross-checks a candidate word against a list of existing words for both:
 * 1. Arabic spelling equality (with harakat normalization)
 * 2. English meaning duplicate (shared core senses, e.g. "ḥāsūb" and "ḥāsib" both meaning "computer")
 */
export function checkWordDuplicate(
  candidate: { arabic: string; english: string },
  existingList: WordIdentifier[],
  ignoreWordId?: string
): DuplicateCheckResult {
  if (!candidate || !candidate.arabic) {
    return { isDuplicate: false };
  }

  const normCandidateArabic = normalizeArabic(candidate.arabic);
  const candidateSenses = extractEnglishSenses(candidate.english || '');

  for (const existing of existingList) {
    if (ignoreWordId && existing.id === ignoreWordId) {
      continue;
    }

    const normExistingArabic = normalizeArabic(existing.arabic);
    const isArabicMatch = normCandidateArabic.length > 0 && normCandidateArabic === normExistingArabic;

    const existingSenses = extractEnglishSenses(existing.english || '');
    let matchedSense: string | undefined;

    for (const sA of candidateSenses) {
      for (const sB of existingSenses) {
        if (sA === sB) {
          matchedSense = sA;
          break;
        }
      }
      if (matchedSense) break;
    }

    const isEnglishMatch = !!matchedSense;

    if (isArabicMatch && isEnglishMatch) {
      return {
        isDuplicate: true,
        reason: 'both',
        matchingWord: existing,
        detail: `The word "${existing.arabic}" with meaning "${existing.english}" already exists in your Word Bank.`,
      };
    }

    if (isArabicMatch) {
      return {
        isDuplicate: true,
        reason: 'arabic',
        matchingWord: existing,
        detail: `The Arabic spelling "${existing.arabic}" is already in your Word Bank ("${existing.english}").`,
      };
    }

    if (isEnglishMatch) {
      const translitHint = existing.transliteration ? ` (${existing.transliteration})` : '';
      return {
        isDuplicate: true,
        reason: 'english',
        matchingWord: existing,
        detail: `The English concept "${matchedSense}" already exists in your Word Bank for word "${existing.arabic}"${translitHint}.`,
      };
    }
  }

  return { isDuplicate: false };
}
