import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dataStore } from '@/lib/supabase-store';
import db from '@/lib/db';

function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

export interface LinguisticFormsResponse {
  plural: {
    arabic: string;
    transliteration: string;
    english: string;
  } | null;
  opposite: {
    arabic: string;
    transliteration: string;
    english: string;
  } | null;
}

// GET /api/words/[id]/forms - Get cached or existing plural/opposite forms
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const allWords = await dataStore.getWords();
    const word = allWords.find(w => w.id === id);

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    const hasPlural = Boolean(word.pluralArabic);
    const hasOpposite = Boolean(word.oppositeArabic);

    return NextResponse.json({
      success: true,
      wordId: id,
      wordArabic: word.arabic,
      wordType: word.wordType,
      plural: hasPlural
        ? {
            arabic: word.pluralArabic!,
            transliteration: word.pluralTransliteration || '',
            english: word.pluralEnglish || '',
          }
        : null,
      opposite: hasOpposite
        ? {
            arabic: word.oppositeArabic!,
            transliteration: word.oppositeTransliteration || '',
            english: word.oppositeEnglish || '',
          }
        : null,
      cached: hasPlural || hasOpposite,
    });
  } catch (error: any) {
    console.error('Error fetching word linguistic forms:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch linguistic forms' }, { status: 500 });
  }
}

// POST /api/words/[id]/forms - Instruct AI to generate plural and/or opposite for this word
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { forceRegenerate = false } = body;

    const allWords = await dataStore.getWords();
    const word = allWords.find(w => w.id === id);

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    // Return cached if available and not forced
    if (!forceRegenerate && (word.pluralArabic || word.oppositeArabic)) {
      return NextResponse.json({
        success: true,
        wordId: id,
        plural: word.pluralArabic
          ? {
              arabic: word.pluralArabic,
              transliteration: word.pluralTransliteration || '',
              english: word.pluralEnglish || '',
            }
          : null,
        opposite: word.oppositeArabic
          ? {
              arabic: word.oppositeArabic,
              transliteration: word.oppositeTransliteration || '',
              english: word.oppositeEnglish || '',
            }
          : null,
        cached: true,
      });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
You are an expert native Arabic lexicographer and linguist.
Given the following Arabic word, its grammatical type, and English meaning:

- Arabic: "${word.arabic}"
- English meaning: "${word.english}"
- Part of speech: "${word.wordType}"
- Context sentence: "${word.exampleArabic || ''}"

TASK:
Determine and provide the authentic Arabic PLURAL form (الْجَمْع) and/or OPPOSITE / ANTONYM form (الضِّدّ / الْعَكْس) appropriate for its part of speech:

1. PLURAL (الْجَمْع):
   - Appropriate for: NOUNS and certain descriptive ADJECTIVES.
   - For verbs, expressions, or uncountables with no nominal plural, return null.
   - Provide the most common spoken / Modern Standard broken plural (جَمْع تَكْسِير) or sound plural (جَمْع مُذَكَّر/مُؤَنَّث سَالِم).
   - MANDATORY: Arabic plural MUST have full diacritics (harakāt).
   - Provide clear Latin transliteration and English translation.

2. OPPOSITE / ANTONYM (الضِّدّ / الْعَكْس):
   - Appropriate for: ADJECTIVES (e.g. كَبِير <-> صَغِير), VERBS (e.g. فَتَحَ <-> أَغْلَقَ), and conceptually contrasting NOUNS (e.g. نُور <-> ظَلَام, نَهَار <-> لَيْل).
   - For concrete nouns without natural direct opposites (e.g. table, bag, apple), return null.
   - Match the tense and grammatical form of the original word (e.g., past verb -> past verb; active participle -> active participle).
   - MANDATORY: Arabic opposite MUST have full diacritics (harakāt).
   - Provide clear Latin transliteration and English translation.

Respond ONLY with a valid JSON object matching this schema:
{
  "plural": {
    "arabic": "Arabic plural with full harakāt",
    "transliteration": "Latin transliteration",
    "english": "English plural meaning"
  } | null,
  "opposite": {
    "arabic": "Arabic opposite with full harakāt",
    "transliteration": "Latin transliteration",
    "english": "English opposite meaning"
  } | null
}
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash-lite',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(cleanJsonOutput(responseText)) as LinguisticFormsResponse;

    const pluralArabic = parsed.plural?.arabic?.trim() || null;
    const pluralTransliteration = parsed.plural?.transliteration?.trim() || null;
    const pluralEnglish = parsed.plural?.english?.trim() || null;

    const oppositeArabic = parsed.opposite?.arabic?.trim() || null;
    const oppositeTransliteration = parsed.opposite?.transliteration?.trim() || null;
    const oppositeEnglish = parsed.opposite?.english?.trim() || null;

    // Update in dataStore (Supabase & SQLite)
    const updatedWord = await dataStore.updateWord(id, {
      pluralArabic: pluralArabic || undefined,
      pluralTransliteration: pluralTransliteration || undefined,
      pluralEnglish: pluralEnglish || undefined,
      oppositeArabic: oppositeArabic || undefined,
      oppositeTransliteration: oppositeTransliteration || undefined,
      oppositeEnglish: oppositeEnglish || undefined,
    });

    // Also persist directly into dedicated word_linguistic_forms table
    try {
      const cleanArabic = word.arabic.replace(/[\u064B-\u065F\u0670]/g, '').trim();
      db.prepare(`
        INSERT OR REPLACE INTO word_linguistic_forms (
          word_id, arabic, plural_arabic, plural_transliteration, plural_english,
          opposite_arabic, opposite_transliteration, opposite_english, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        cleanArabic,
        pluralArabic,
        pluralTransliteration,
        pluralEnglish,
        oppositeArabic,
        oppositeTransliteration,
        oppositeEnglish,
        new Date().toISOString()
      );
    } catch (dbErr) {
      console.error('Failed to save to word_linguistic_forms in route:', dbErr);
    }

    return NextResponse.json({
      success: true,
      wordId: id,
      word: updatedWord,
      plural: pluralArabic
        ? {
            arabic: pluralArabic,
            transliteration: pluralTransliteration || '',
            english: pluralEnglish || '',
          }
        : null,
      opposite: oppositeArabic
        ? {
            arabic: oppositeArabic,
            transliteration: oppositeTransliteration || '',
            english: oppositeEnglish || '',
          }
        : null,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error generating word linguistic forms:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate linguistic forms' }, { status: 500 });
  }
}
