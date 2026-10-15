import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { dataStore } from '@/lib/supabase-store';
import { ConversationSession, ChatMessage } from '@/lib/types';

function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

// GET /api/conversations - List all saved conversations
export async function GET() {
  try {
    const list = await dataStore.getConversations();
    return NextResponse.json({ conversations: list });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json({ error: error?.message || 'Failed to fetch conversations' }, { status: 500 });
  }
}

// POST /api/conversations - Generate a new conversation using Gemini 3.5 Flash Lite in White Dialect
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      topic = 'Meeting at a cafe',
      difficulty = 'beginner',
      speakerCount = 2,
      turns = 6, // number of messages
      includeKnownWords = true,
    } = body;

    // Only fetch and include existing words if user opted in
    let knownWordsSummary = '';
    if (includeKnownWords) {
      const knownWords = await dataStore.getWords();
      if (knownWords && knownWords.length > 0) {
        knownWordsSummary = knownWords.slice(0, 40).map((w) => `${w.arabic} (${w.english})`).join(', ');
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

    let title = `${topic} (${difficulty})`;
    let speakers = speakerCount === 3 ? ['تَارِقْ', 'سَارَة', 'عُمَرْ'] : ['تَارِقْ', 'سَارَة'];
    let messages: ChatMessage[] = [];

    if (apiKey && apiKey.trim() !== '') {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `You are an expert native Arabic language teacher crafting an engaging, natural dialogue for reading comprehension.

LANGUAGE & REGISTER:
- Language: White Dialect / Educated Spoken Arabic (اللَّهْجَة الْبَيْضَاء) — the natural, contemporary spoken Arabic used across the Middle East.
- Avoid archaic classical grammatical case endings (i'rab). Use realistic conversational phrases that real native speakers say.

CONFIGURATION:
- Topic: "${topic}"
- Difficulty Level: "${difficulty}" (beginner, intermediate, or advanced)
- Number of Speakers: ${speakerCount}
- Conversation Length: Approximately ${turns} dialogue turns.
${includeKnownWords && knownWordsSummary ? `
INTELLIGENT VOCABULARY INTEGRATION:
- Student's known vocabulary bank: [${knownWordsSummary}].
- CRITICAL INSTRUCTION: Use known words INTELLIGENTLY and SPARINGLY. ONLY weave in words that are naturally and meaningfully RELEVANT to the conversation topic ("${topic}").
- NEVER force-feed or cram words if they are irrelevant or disrupt conversational realism. Authentic, meaningful dialogue flow is paramount. Integrating 2-4 contextually appropriate words seamlessly is far superior to forcing unrelated vocabulary.` : `
VOCABULARY FOCUS:
- Do not reference or restrict yourself to any prior word bank. Generate a completely fresh, spontaneous dialogue tailored strictly to the scenario.`}

CRITICAL RULES:
1. Every line of Arabic dialogue MUST HAVE FULL TASHKEEL / HARAKAT (fatḥah, kasrah, ḍammah, sukūn, shaddah) so the learner knows the exact spoken pronunciation.
2. Provide precise English phonetic transliteration matching the natural spoken pronunciation for each message.
3. Provide a clear natural English translation for each message.
4. Characters must alternate speaking naturally back and forth like a real messaging / spoken exchange.
5. Output valid JSON ONLY matching the following schema without any markdown formatting:

{
  "title": "Evocative English Title (Arabic title in parentheses)",
  "speakers": ["Speaker 1 Name", "Speaker 2 Name"],
  "messages": [
    {
      "speakerName": "Speaker 1 Name",
      "speakerRole": "e.g. Customer / Friend / Colleague",
      "arabic": "الْجُمْلَةُ بِاللَّهْجَةِ الْبَيْضَاءِ مَعَ التَّشْكِيلِ الْكَامِلِ",
      "transliteration": "Exact spoken phonetic transliteration.",
      "english": "Natural English translation."
    }
  ]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash-lite',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.75,
        },
      });

      const rawText = response.text || '{}';
      const parsed = JSON.parse(cleanJsonOutput(rawText));

      if (parsed.title) title = parsed.title;
      if (Array.isArray(parsed.speakers) && parsed.speakers.length > 0) speakers = parsed.speakers;
      if (Array.isArray(parsed.messages) && parsed.messages.length > 0) {
        messages = parsed.messages.map((m: any, idx: number) => ({
          id: `msg_${Date.now()}_${idx}`,
          speakerName: m.speakerName || speakers[idx % speakers.length],
          speakerRole: m.speakerRole || '',
          arabic: m.arabic || '',
          transliteration: m.transliteration || '',
          english: m.english || '',
        }));
      }
    }

    // High quality fallback if AI is unavailable
    if (messages.length === 0) {
      messages = [
        {
          id: `msg_${Date.now()}_0`,
          speakerName: 'تَارِقْ',
          speakerRole: 'صَدِيق',
          arabic: 'مَرْحَبَا يَا سَارَة، كِيفْ حَالِكِ الْيَوْم؟',
          transliteration: 'Marḥaba yā Sāra, kīf ḥālik al-yawm?',
          english: 'Hello Sara, how are you doing today?',
        },
        {
          id: `msg_${Date.now()}_1`,
          speakerName: 'سَارَة',
          speakerRole: 'صَدِيقَة',
          arabic: 'أَهْلَيْن تَارِقْ! أَنَا مَبْسُوطَة كْتِير، شُو عَمْ تَعْمَلْ هَلَّأْ؟',
          transliteration: 'Ahlayn Tāriq! Anā mabsūṭah ktīr, shū ‘am ta‘mal halla’?',
          english: 'Hey Tariq! I am doing very well, what are you doing right now?',
        },
        {
          id: `msg_${Date.now()}_2`,
          speakerName: 'تَارِقْ',
          speakerRole: 'صَدِيق',
          arabic: 'قَاعِدْ بِالْقَهْوَة عَمْ أَشْرَب شَاي، تِحِبِّي تِيجِي؟',
          transliteration: 'Qā‘id bil-qahwah ‘am ashrab shāy, tiḥibbī tījī?',
          english: 'Sitting at the cafe drinking tea, would you like to come over?',
        },
        {
          id: `msg_${Date.now()}_3`,
          speakerName: 'سَارَة',
          speakerRole: 'صَدِيقَة',
          arabic: 'فِكْرَة حِلْوَة كْتِير! عَشْر دَقَايِقْ وَبَكُونْ عِنْدَكْ.',
          transliteration: 'Fikrah ḥilwah ktīr! ‘Ashr daqāyiq wa-bakūn ‘indak.',
          english: 'That is a wonderful idea! Ten minutes and I will be there.',
        },
      ];
    }

    const conversation: ConversationSession = {
      id: `conv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      title,
      topic,
      difficulty,
      speakerCount: Number(speakerCount || 2),
      speakers,
      messages,
      createdAt: new Date().toISOString(),
    };

    // Save to database
    const saved = await dataStore.saveConversation(conversation);

    return NextResponse.json({
      success: true,
      conversation: saved,
    });
  } catch (error: any) {
    console.error('Error generating conversation:', error);
    return NextResponse.json({ error: error?.message || 'Failed to generate conversation' }, { status: 500 });
  }
}

// DELETE /api/conversations?id=... - Delete a conversation
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing conversation id parameter' }, { status: 400 });
    }

    await dataStore.deleteConversation(id);
    return NextResponse.json({ success: true, deletedId: id });
  } catch (error: any) {
    console.error('Error deleting conversation:', error);
    return NextResponse.json({ error: error?.message || 'Failed to delete conversation' }, { status: 500 });
  }
}
