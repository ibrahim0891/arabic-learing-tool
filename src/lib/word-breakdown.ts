import { GoogleGenAI } from '@google/genai';
import { WordBreakdownItem } from './types';

export interface GenerateWordBreakdownOptions {
  arabic: string;
  english?: string;
  /**
   * Optional register hint for the AI (e.g. White Dialect vs. Modern Standard Arabic).
   * Defaults to a neutral instruction that analyses the sentence exactly as written.
   */
  register?: string;
}

function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

// Strip surrounding punctuation from an Arabic token so the fallback breakdown stays clean
function stripTokenPunctuation(token: string): string {
  return token
    .replace(/^[\s،؛:!?.,،؛؟«»"'\-–—()\[\]{}]+/, '')
    .replace(/[\s،؛:!?.,،؛؟«»"'\-–—()\[\]{}]+$/, '');
}

/**
 * Generate an on-demand word-by-word breakdown of a single Arabic sentence.
 *
 * Returns a naive whitespace split as a fallback when the AI is unavailable, so the
 * student always gets something usable.
 */
export async function generateWordBreakdown({
  arabic,
  english,
  register,
}: GenerateWordBreakdownOptions): Promise<WordBreakdownItem[]> {
  const sentence = (arabic || '').trim();
  if (!sentence) return [];

  const registerLine =
    register?.trim() ||
    'Analyze the sentence exactly as written — it may be Modern Standard Arabic or Educated Spoken Arabic (اللَّهْجَة الْبَيْضَاء).';

  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  let breakdown: WordBreakdownItem[] = [];

  if (apiKey && apiKey.trim() !== '') {
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are an expert native Arabic tutor and linguist.

LANGUAGE REGISTER: ${registerLine}

TASK: Break the following Arabic sentence into its individual words, in the exact left-to-right (reading) order as they appear, and explain each one in context.

SENTENCE (Arabic): "${sentence}"
${english ? `KNOWN FULL TRANSLATION: "${english}"` : ''}

CRITICAL RULES:
1. Split the sentence into meaningful, standalone words. Keep attached particles/pronouns together only when they function as one word (e.g. "وَهَلْ" = "and + is/does"). Do not split a single word into root letters.
2. "arabic" MUST be the word exactly as it appears in the sentence, INCLUDING full tashkeel/harakat, but WITHOUT trailing punctuation (، ؟ ! . etc.).
3. "transliteration" MUST be the accurate spoken phonetic transliteration of that individual word.
4. "english" MUST be the concise meaning of that word AS USED IN THIS SENTENCE (not a generic dictionary list).
5. "note" MUST be a very short (max ~6 words) grammar/usage hint, e.g. "question particle", "2nd person masc. suffix", "past tense verb", "verb + him".
6. Output valid JSON ONLY (no markdown fences, no comments) matching this exact schema:
{
  "words": [
    {
      "arabic": "الْكَلِمَةُ",
      "transliteration": "al-kalimah",
      "english": "the word",
      "note": "definite noun"
    }
  ]
}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.4,
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(cleanJsonOutput(rawText));
      const words = Array.isArray(parsed) ? parsed : parsed?.words;

      if (Array.isArray(words)) {
        breakdown = words
          .map((w: Partial<WordBreakdownItem>) => ({
            arabic: (w?.arabic || '').trim(),
            transliteration: (w?.transliteration || '').trim(),
            english: (w?.english || '').trim(),
            note: (w?.note || '').trim() || undefined,
          }))
          .filter((w) => w.arabic.length > 0);
      }
    } catch (err) {
      console.error('Error generating word breakdown:', err);
    }
  }

  // Smart fallback: naive whitespace split so the student always sees something
  if (breakdown.length === 0) {
    breakdown = sentence
      .split(/\s+/)
      .map((t) => stripTokenPunctuation(t))
      .filter((t) => t.length > 0)
      .map((t) => ({ arabic: t, transliteration: '', english: '' }));
  }

  return breakdown;
}
