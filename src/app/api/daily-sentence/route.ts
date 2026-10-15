import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dataStore } from '@/lib/supabase-store';
import { DailySentence } from '@/lib/types';

function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

// Fallback curated inspiring sentences for Arabic learners
const FALLBACK_SENTENCES = [
  {
    arabic: 'الْعِلْمُ نُورٌ يُضِيءُ طَرِيقَ الْحَيَاةِ.',
    transliteration: 'Al-‘ilmu nūrun yuḍī’u ṭarīqa al-ḥayāh.',
    english: 'Knowledge is a light that illuminates the path of life.',
  },
  {
    arabic: 'خُطْوَةٌ صَغِيرَةٌ كُلَّ يَوْمٍ تَصْنَعُ فَرْقاً كَبِيراً.',
    transliteration: 'Khuṭwatun ṣaghīratun kulla yawmin taṣna‘u farqan kabīran.',
    english: 'A small step every day makes a huge difference.',
  },
  {
    arabic: 'الصَّبْرُ مِفْتَاحُ الْفَرَجِ وَالنَّجَاحِ.',
    transliteration: 'Aṣ-ṣabru miftāḥu al-faraji wan-najāḥ.',
    english: 'Patience is the key to relief and success.',
  },
  {
    arabic: 'تَعَلُّمُ اللُّغَةِ الْعَرَبِيَّةِ يَفْتَحُ أَبْوَابَ حِكْمَةٍ وَاسِعَةٍ.',
    transliteration: 'Ta‘allumu al-lughati al-‘arabiyyati yaftaḥu abwāba ḥikmatin wāsi‘ah.',
    english: 'Learning the Arabic language opens gates of vast wisdom.',
  },
  {
    arabic: 'كُلُّ يَوْمٍ فُرْصَةٌ جَدِيدَةٌ لِتَعَلُّمِ شَيْءٍ جَمِيلٍ.',
    transliteration: 'Kullu yawmin furṣatun jadīdatun lita‘allumi shay’in jamīl.',
    english: 'Every day is a fresh opportunity to learn something beautiful.',
  },
  {
    arabic: 'مَنْ جَدَّ وَجَدَ، وَمَنْ زَرَعَ حَصَدَ.',
    transliteration: 'Man jadda wajada, wa man zara‘a ḥaṣad.',
    english: 'Whoever strives diligently finds success, and whoever sows reaps.',
  },
];

// Helper to determine the current slot (2 slots per day: slot 0 for 00:00-11:59, slot 1 for 12:00-23:59)
function getCurrentSlotInfo(): { slotDate: string; slotIndex: number } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const slotDate = `${year}-${month}-${day}`;
  // 0 = 00:00 to 11:59 (Morning slot), 1 = 12:00 to 23:59 (Afternoon/Evening slot)
  const slotIndex = now.getHours() < 12 ? 0 : 1;
  return { slotDate, slotIndex };
}

// GET /api/daily-sentence - Fetches current sentence; generates replacement only if new slot has begun
export async function GET(req: NextRequest) {
  try {
    const { slotDate, slotIndex } = getCurrentSlotInfo();
    const existing = await dataStore.getDailySentence();

    // If we already have a generated sentence for this exact 12-hour slot, return it directly
    // This strictly guarantees the AI API only gets called 2 times a day!
    if (
      existing &&
      existing.slotDate === slotDate &&
      existing.slotIndex === slotIndex &&
      existing.arabic &&
      existing.arabic.trim() !== ''
    ) {
      return NextResponse.json({
        sentence: existing,
        isCached: true,
        slotDate,
        slotIndex,
      });
    }

    // New 12-hour slot reached! Call Gemini to generate a new inspiring Arabic learner sentence
    let newArabic = '';
    let newTransliteration = '';
    let newEnglish = '';

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    if (apiKey && apiKey.trim() !== '') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const timeOfDay = slotIndex === 0 ? 'morning motivation & fresh focus' : 'afternoon / evening reflection & progress';

        const prompt = `You are a friendly native Arabic speaker and tutor welcoming a student to their daily Arabic practice session.
Theme / Mood: ${timeOfDay}.
Dialect Focus: White Dialect / Educated Spoken Arabic (اللَّهْجَة الْبَيْضَاء) — the universally understood, contemporary spoken Arabic used across the Arab world in daily life, media, podcasts, and casual conversations.

Task: Generate a single beautiful, inspiring, natural spoken Arabic sentence suitable for welcoming an Arabic student on their dashboard.

Requirements:
1. Use natural White Dialect phrasing (avoid archaic textbook endings / complex i'rab; use warm, authentic conversational phrasing).
2. MANDATORY: Provide the Arabic sentence WITH FULL TASHKEEL / HARAKAT on every letter so the learner knows the exact spoken vowels and pronunciation.
3. Provide standard, easy-to-read English phonetic transliteration matching the spoken pronunciation.
4. Provide a natural English translation.
5. Keep it concise, warm, motivating, and encouraging.
6. Output valid JSON ONLY matching this schema:
{
  "arabic": "الْجُمْلَةُ بِاللَّهْجَةِ الْبَيْضَاءِ مَعَ التَّشْكِيلِ الْكَامِلِ",
  "transliteration": "Exact spoken phonetic transliteration.",
  "english": "Natural English translation."
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.8,
          },
        });

        const rawText = response.text || '{}';
        const parsed = JSON.parse(cleanJsonOutput(rawText));

        if (parsed.arabic && parsed.english) {
          newArabic = parsed.arabic.trim();
          newTransliteration = parsed.transliteration?.trim() || '';
          newEnglish = parsed.english.trim();
        }
      } catch (geminiErr) {
        console.warn('Gemini generation for daily sentence failed, falling back:', geminiErr);
      }
    }

    // Fallback if AI generation failed or API key was absent
    if (!newArabic) {
      const fallbackIdx = (new Date().getDate() + slotIndex) % FALLBACK_SENTENCES.length;
      const fallback = FALLBACK_SENTENCES[fallbackIdx];
      newArabic = fallback.arabic;
      newTransliteration = fallback.transliteration;
      newEnglish = fallback.english;
    }

    // Replace the single row in the database
    const newSentenceRecord: DailySentence = {
      id: 'current_daily_sentence',
      arabic: newArabic,
      transliteration: newTransliteration,
      english: newEnglish,
      slotDate,
      slotIndex,
      updatedAt: new Date().toISOString(),
    };

    const saved = await dataStore.setDailySentence(newSentenceRecord);

    return NextResponse.json({
      sentence: saved,
      isCached: false,
      slotDate,
      slotIndex,
    });
  } catch (err: any) {
    console.error('Error in daily-sentence API:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to fetch daily sentence' },
      { status: 500 }
    );
  }
}
