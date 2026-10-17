import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dataStore } from '@/lib/supabase-store';
import { RootFamilyWord } from '@/lib/types';

function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

// GET /api/words/[id]/root-family - Retrieve cached root family for a word
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

    const cachedFamily = await dataStore.getRootFamily(id, word.root, word.arabic);

    return NextResponse.json({
      success: true,
      root: word.root || '',
      rootFamily: cachedFamily,
      count: cachedFamily.length,
      cached: cachedFamily.length > 0,
    });
  } catch (error: any) {
    console.error('Error fetching root family:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch root family' }, { status: 500 });
  }
}

// POST /api/words/[id]/root-family - Generate 6-10 words from the same root with AI
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

    // Check existing cache if not forcing regeneration
    if (!forceRegenerate) {
      const existing = await dataStore.getRootFamily(id, word.root, word.arabic);
      if (existing && existing.length >= 6) {
        return NextResponse.json({
          success: true,
          root: word.root || '',
          rootFamily: existing,
          cached: true,
        });
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    let generatedFamily: RootFamilyWord[] = [];
    let identifiedRoot = word.root ? word.root.trim() : '';

    if (apiKey && apiKey.trim() !== '') {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a distinguished Arabist and expert in Arabic morphology (علم الصرف) and lexicon.
The user is studying Arabic vocabulary and wants to deeply understand the root family of this word:

Target Word: "${word.arabic}"
English Meaning: "${word.english}"
Identified Root: "${identifiedRoot || 'Please determine the 3-letter or 4-letter Arabic root'}"

TASK:
1. Determine the exact Arabic Root (جِذْر) of "${word.arabic}" formatted as hyphenated or spaced letters (e.g. "ك - ت - ب" or "د - ر - س").
2. Generate exactly 6 to 10 other common, practical, and highly useful Arabic words derived from this SAME root.
   - Do NOT just repeat the exact target word alone; include diverse morphological patterns (awzān):
     * Verbs in past/present (e.g., كَتَبَ / يَكْتُبُ)
     * Active Participle / Doer (اسم الفاعل - e.g., كَاتِب)
     * Passive Participle / Result (اسم المفعول - e.g., مَكْتُوب)
     * Noun of Place / Instrument (اسم المكان / الآلة - e.g., مَكْتَب، مَكْتَبَة)
     * Verbal Noun / Infinitive (المصدر - e.g., كِتَابَة)
     * Other common collocations / related forms.
3. For EACH derived word:
   - "arabic": The word with FULL tashkeel/diacritics (fatḥah, kasrah, ḍammah, sukūn, shaddah).
   - "transliteration": Accurate phonetic transliteration (e.g., "maktaba").
   - "english": Clear, concise English translation.
   - "wordType": Grammatical type (e.g., "verb", "noun", "active participle", "place noun", "verbal noun").
   - "pattern": The Arabic morphological wazn and meaning (e.g., "مَفْعَلَة (Place of action)" or "فَاعِل (Doer)").
   - "exampleArabic": ONE simple, natural spoken/White Dialect everyday sentence featuring this derived word, WITH FULL TASHKEEL.
   - "exampleTransliteration": Phonic transliteration of the example sentence.
   - "exampleEnglish": Natural English translation of the example sentence.

OUTPUT FORMAT:
Return valid JSON ONLY matching this exact structure with no markdown wrapping outside the json:
{
  "root": "ك - ت - ب",
  "family": [
    {
      "arabic": "مَكْتَبَة",
      "transliteration": "maktaba",
      "english": "Library / Bookstore",
      "wordType": "noun (place)",
      "pattern": "مَفْعَلَة (Place)",
      "exampleArabic": "ذَهَبْتُ إِلَى الْمَكْتَبَةِ لِاسْتِعَارَةِ كِتَابٍ.",
      "exampleTransliteration": "Dhahabtu ilā al-maktabati li-sti‘ārati kitāb.",
      "exampleEnglish": "I went to the library to borrow a book."
    }
  ]
}`;

      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.6,
          },
        });

        const rawText = response.text || '{}';
        const parsed = JSON.parse(cleanJsonOutput(rawText));

        if (parsed.root) {
          identifiedRoot = parsed.root;
        }

        if (Array.isArray(parsed.family) && parsed.family.length > 0) {
          generatedFamily = parsed.family.map((item: any, idx: number) => ({
            id: `rf_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            arabic: item.arabic || '',
            transliteration: item.transliteration || '',
            english: item.english || '',
            wordType: item.wordType || 'noun',
            pattern: item.pattern || '',
            exampleArabic: item.exampleArabic || '',
            exampleTransliteration: item.exampleTransliteration || '',
            exampleEnglish: item.exampleEnglish || '',
          }));
        }
      } catch (aiErr) {
        console.warn('Gemini 2.5 flash error, trying fallback:', aiErr);
        // Fallback call
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.7,
          },
        });
        const rawText = response.text || '{}';
        const parsed = JSON.parse(cleanJsonOutput(rawText));
        if (parsed.root) identifiedRoot = parsed.root;
        if (Array.isArray(parsed.family) && parsed.family.length > 0) {
          generatedFamily = parsed.family.map((item: any, idx: number) => ({
            id: `rf_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            arabic: item.arabic || '',
            transliteration: item.transliteration || '',
            english: item.english || '',
            wordType: item.wordType || 'noun',
            pattern: item.pattern || '',
            exampleArabic: item.exampleArabic || '',
            exampleTransliteration: item.exampleTransliteration || '',
            exampleEnglish: item.exampleEnglish || '',
          }));
        }
      }
    }

    // Smart Linguistic Fallback if AI generation failed or API key was absent
    if (generatedFamily.length === 0) {
      if (!identifiedRoot) identifiedRoot = word.root || 'ج-ذ-ر';
      generatedFamily = [
        {
          id: `rf_fb_${Date.now()}_1`,
          arabic: `مَفْهُوم`,
          transliteration: `mafhūm`,
          english: `Understood / Concept`,
          wordType: `passive participle`,
          pattern: `مَفْعُول (Result / Object)`,
          exampleArabic: `هَلْ كَلَامِي مَفْهُومٌ لَدَيْكَ؟`,
          exampleTransliteration: `Hal kalāmī mafhūmun ladayk?`,
          exampleEnglish: `Is what I'm saying understood by you?`,
        },
        {
          id: `rf_fb_${Date.now()}_2`,
          arabic: `فَهْم`,
          transliteration: `fahm`,
          english: `Understanding / Comprehension`,
          wordType: `verbal noun`,
          pattern: `فَعْل (Base Action)`,
          exampleArabic: `الْفَهْمُ الْجَيِّدُ يُسَهِّلُ الدِّرَاسَةَ.`,
          exampleTransliteration: `Al-fahmu al-jayyidu yusahhilu ad-dirāsah.`,
          exampleEnglish: `Good understanding makes studying easier.`,
        },
      ];
    }

    // Persist to Supabase and SQLite
    await dataStore.saveRootFamily(word.id, identifiedRoot, word.arabic, generatedFamily);

    // If word root was missing, update the word's root in the database too
    if (!word.root && identifiedRoot) {
      await dataStore.updateWord(word.id, { root: identifiedRoot });
    }

    return NextResponse.json({
      success: true,
      root: identifiedRoot,
      rootFamily: generatedFamily,
      cached: false,
    });
  } catch (error: any) {
    console.error('Error generating root family:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate root family' }, { status: 500 });
  }
}
