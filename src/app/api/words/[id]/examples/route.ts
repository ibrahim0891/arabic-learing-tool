import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dataStore } from '@/lib/supabase-store';
import { ExampleSentence } from '@/lib/types';

function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

// POST /api/words/[id]/examples - Generate new contextual AI examples for a specific word
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      scenario = 'generic',
      customInstruction = '',
      count = 3,
      variationType = 'balanced',
    } = body;

    const words = await dataStore.getWords();
    const word = words.find((w) => w.id === id);

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const requestedCount = Math.max(1, Math.min(Number(count) || 3, 6));

    let generatedExamples: ExampleSentence[] = [];

    if (apiKey && apiKey.trim() !== '') {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are a native Arabic tutor and linguist.
Language Register: White Dialect / Educated Spoken Arabic (اللَّهْجَة الْبَيْضَاء) — the natural, widely understood conversational Arabic used across the Middle East in daily life, media, podcasts, and realistic dialogues.

Target Arabic Word: "${word.arabic}" (Transliteration: "${word.transliteration}", Meaning: "${word.english}", Type: "${word.wordType || 'noun'}").
Root: "${word.root || 'N/A'}".

Generate exactly ${requestedCount} diverse, natural spoken Arabic example sentences featuring this word.

Context / Scenario: ${scenario} (${
        scenario === 'generic'
          ? 'Everyday realistic situations, varied contexts'
          : scenario === 'dialogue'
          ? 'Natural conversational dialogue/spoken exchanges'
          : scenario === 'business'
          ? 'Work, professional, email or office setting'
          : scenario === 'story'
          ? 'Descriptive storytelling or emotional narrative'
          : scenario === 'travel'
          ? 'Travel, hotel, airport, asking directions, restaurants'
          : scenario === 'academic'
          ? 'Academic, scientific, or formal discussion'
          : scenario
      })

Variation focus: ${
        variationType === 'grammatical'
          ? 'Vary grammatical tenses, subjects (I, you, he, she, we, they), question forms, and conversational negation.'
          : variationType === 'difficulty'
          ? 'Progress from easy simple sentences to slightly richer, more expressive phrases.'
          : variationType === 'idiomatic'
          ? 'Include common spoken idioms, collocations, or natural cultural expressions.'
          : 'A well-rounded mix of simple everyday speech and descriptive practical usage.'
      }

${customInstruction ? `Additional Custom User Instruction: "${customInstruction}"` : ''}

CRITICAL RULES:
1. Use authentic White Dialect / conversational Arabic phrasing (avoid archaic textbook case endings like i'rab).
2. MANDATORY: Every Arabic sentence MUST include full diacritics / tashkeel (fatḥah, kasrah, ḍammah, sukūn, shaddah) on every letter so the learner knows the exact spoken vowels.
3. Provide natural, accurate English translations.
4. Provide accurate phonetic transliteration matching the natural spoken pronunciation.
5. Output valid JSON ONLY matching the following schema. Do NOT include markdown comments or wrapping other than standard JSON:

[
  {
    "arabic": "الْجُمْلَةُ مَعَ التَّشْكِيلِ الْكَامِلِ",
    "transliteration": "Al-jumlatu ma‘a al-tashkīl al-kāmil.",
    "english": "Precise natural English translation.",
    "scenario": "${scenario}"
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.7,
        },
      });

      const rawText = response.text || '[]';
      const parsed = JSON.parse(cleanJsonOutput(rawText));

      if (Array.isArray(parsed) && parsed.length > 0) {
        generatedExamples = parsed.map((item: any, idx: number) => ({
          id: `ex_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          arabic: item.arabic || '',
          transliteration: item.transliteration || '',
          english: item.english || '',
          scenario: item.scenario || scenario,
          createdAt: new Date().toISOString(),
        }));
      }
    }

    // Smart Fallback if API key is absent or failed
    if (generatedExamples.length === 0) {
      const templates = [
        {
          arabic: `سَمِعْتُ كَلِمَةَ "${word.arabic}" فِي حِوَارٍ أَمْسِ.`,
          transliteration: `Sami‘tu kalimata "${word.transliteration || word.arabic}" fī ḥiwārin ams.`,
          english: `I heard the word "${word.english}" in a conversation yesterday.`,
          scenario: 'Conversation',
        },
        {
          arabic: `مِنَ الْمُهِمِّ أَنْ نَفْهَمَ مَعْنَى "${word.arabic}" جَيِّداً.`,
          transliteration: `Mina al-muhimmi an naf-hama ma‘nā "${word.transliteration || word.arabic}" jayyidan.`,
          english: `It is important that we understand the meaning of "${word.english}" well.`,
          scenario: 'Study & Learning',
        },
        {
          arabic: `هَلْ يُمْكِنُكَ اسْتِخْدَامُ "${word.arabic}" فِي جُمْلَةٍ مُفِيدَةٍ؟`,
          transliteration: `Hal yumkinuka istikhdāmu "${word.transliteration || word.arabic}" fī jumLatin mufīdah?`,
          english: `Can you use "${word.english}" in a useful sentence?`,
          scenario: 'Practice Question',
        },
      ];

      generatedExamples = templates.slice(0, requestedCount).map((item, idx) => ({
        id: `ex_fb_${Date.now()}_${idx}`,
        ...item,
        createdAt: new Date().toISOString(),
      }));
    }

    // Append to existing additional examples
    const currentAdditional = word.additionalExamples || [];
    const updatedAdditional = [...currentAdditional, ...generatedExamples];

    const updatedWord = await dataStore.updateWord(id, {
      additionalExamples: updatedAdditional,
    });

    const safeWord = {
      ...word,
      ...(updatedWord || {}),
      exampleArabic: updatedWord?.exampleArabic || word.exampleArabic,
      exampleTransliteration: updatedWord?.exampleTransliteration || word.exampleTransliteration,
      exampleEnglish: updatedWord?.exampleEnglish || word.exampleEnglish,
      additionalExamples: updatedAdditional,
    };

    return NextResponse.json({
      success: true,
      newExamples: generatedExamples,
      allExamples: updatedAdditional,
      word: safeWord,
    });
  } catch (error: any) {
    console.error('Error generating examples for word:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to generate examples' },
      { status: 500 }
    );
  }
}

// DELETE /api/words/[id]/examples?exampleId=... - Delete an example sentence from a word
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const exampleId = searchParams.get('exampleId');

    if (!exampleId) {
      return NextResponse.json(
        { error: 'Missing exampleId query parameter' },
        { status: 400 }
      );
    }

    const words = await dataStore.getWords();
    const word = words.find((w) => w.id === id);

    if (!word) {
      return NextResponse.json({ error: 'Word not found' }, { status: 404 });
    }

    const currentAdditional = Array.isArray(word.additionalExamples)
      ? word.additionalExamples
      : typeof word.additionalExamples === 'string'
      ? (() => { try { return JSON.parse(word.additionalExamples); } catch (_) { return []; } })()
      : [];

    // Filter out the requested example sentence
    const filteredAdditional = currentAdditional.filter(
      (ex: ExampleSentence, index: number) => {
        const idMatches = ex.id === exampleId;
        const indexMatches = `idx_${index}` === exampleId;
        return !idMatches && !indexMatches;
      }
    );

    const updatedWord = await dataStore.updateWord(id, {
      additionalExamples: filteredAdditional,
    });

    const safeWord = {
      ...word,
      ...(updatedWord || {}),
      exampleArabic: updatedWord?.exampleArabic || word.exampleArabic,
      exampleTransliteration: updatedWord?.exampleTransliteration || word.exampleTransliteration,
      exampleEnglish: updatedWord?.exampleEnglish || word.exampleEnglish,
      additionalExamples: filteredAdditional,
    };

    return NextResponse.json({
      success: true,
      deletedId: exampleId,
      word: safeWord,
    });
  } catch (error: any) {
    console.error('Error deleting example sentence:', error);
    return NextResponse.json(
      { error: error?.message || 'Failed to delete example sentence' },
      { status: 500 }
    );
  }
}
