import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dataStore } from '@/lib/supabase-store';
import { WordBreakdownItem } from '@/lib/types';

function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

// Strip surrounding punctuation from an Arabic token so the breakdown stays clean
function stripTokenPunctuation(token: string): string {
  return token.replace(/^[\s،؛:!?.,،؛؟«»"'\-–—()\[\]{}]+/, '').replace(/[\s،؛:!?.,،؛؟«»"'\-–—()\[\]{}]+$/, '');
}

/**
 * POST /api/conversations/breakdown
 *
 * Generates an on-demand word-by-word breakdown of a single Arabic dialogue line.
 * Optionally persists the result onto the stored conversation message so it is
 * not regenerated on every expand.
 *
 * Body: { arabic: string, english?: string, conversationId?: string, messageId?: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const arabic: string = (body?.arabic || '').trim();
    const english: string = (body?.english || '').trim();
    const conversationId: string | undefined = body?.conversationId;
    const messageId: string | undefined = body?.messageId;

    if (!arabic) {
      return NextResponse.json({ error: 'Missing Arabic sentence to break down' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    let breakdown: WordBreakdownItem[] = [];

    if (apiKey && apiKey.trim() !== '') {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert native Arabic tutor and linguist.

LANGUAGE REGISTER: White Dialect / Educated Spoken Arabic (اللَّهْجَة الْبَيْضَاء) — the natural, contemporary conversational Arabic used across the Middle East.

TASK: Break the following Arabic sentence into its individual words, in the exact left-to-right (reading) order as they appear, and explain each one in context.

SENTENCE (Arabic): "${arabic}"
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
      breakdown = arabic
        .split(/\s+/)
        .map((t) => stripTokenPunctuation(t))
        .filter((t) => t.length > 0)
        .map((t) => ({ arabic: t, transliteration: '', english: '' }));
    }

    // Best-effort persistence onto the stored conversation / message
    if (conversationId && messageId && breakdown.length > 0) {
      try {
        const conversations = await dataStore.getConversations();
        const conversation = conversations.find((c) => c.id === conversationId);
        if (conversation) {
          conversation.messages = conversation.messages.map((m) =>
            m.id === messageId ? { ...m, breakdown } : m
          );
          await dataStore.saveConversation(conversation);
        }
      } catch (err) {
        console.error('Error persisting word breakdown:', err);
      }
    }

    return NextResponse.json({ success: true, breakdown });
  } catch (error: any) {
    console.error('Error in breakdown route:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate word breakdown' },
      { status: 500 }
    );
  }
}
