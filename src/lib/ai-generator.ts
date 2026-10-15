import { GoogleGenAI } from '@google/genai';
import { Word } from './types';

export interface GenerateWordsOptions {
  count: number;
  topic: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  wordType: string;
  excludeWords?: string[]; // Arabic words already known/learned to prevent duplicates
  revisionWords?: Word[]; // Words to reuse and weave into new context sentences
}

export interface GeneratedWordSetResult {
  title: string;
  themeContext: string;
  words: Omit<Word, 'id' | 'setId' | 'dateAdded' | 'timesTested' | 'timesCorrect' | 'timesIncorrect' | 'memoryStatus' | 'easeFactor' | 'intervalDays' | 'repetitionCount' | 'nextReviewDate'>[];
}

// Built-in intelligent curated seed generator used as fallback or default if API key is not yet configured
const curatedSeedTopics: Record<string, GeneratedWordSetResult> = {
  'daily life': {
    title: 'Morning Routine & Preparing for the Day (روتين الصباح)',
    themeContext: 'Waking up early, making breakfast in the kitchen, enjoying coffee, and heading out the door.',
    words: [
      {
        arabic: 'صَبَاح',
        transliteration: 'ṣabāḥ',
        english: 'morning',
        wordType: 'noun',
        exampleArabic: 'أَسْتَيْقِظُ كُلَّ صَبَاحٍ فِي السَّاعَةِ السَّادِسَةِ.',
        exampleTransliteration: 'Astayqiẓu kulla ṣabāḥin fī al-sā‘ati al-sādisah.',
        exampleEnglish: 'I wake up every morning at six o\'clock.',
        explanation: 'Commonly used in greeting "ṣabāḥ al-khayr" (Good morning).',
        topic: 'daily life',
        difficulty: 'beginner',
      },
      {
        arabic: 'فُطُور',
        transliteration: 'fuṭūr',
        english: 'breakfast',
        wordType: 'noun',
        exampleArabic: 'تَنَاوَلْتُ فُطُوراً لَذِيذاً مَعَ أُسْرَتِي.',
        exampleTransliteration: 'Tanāwaltu fuṭūran ladhīdhan ma‘a usratī.',
        exampleEnglish: 'I ate a delicious breakfast with my family.',
        explanation: 'Comes from root f-t-r (breaking the fast).',
        topic: 'daily life',
        difficulty: 'beginner',
      },
      {
        arabic: 'قَهْوَة',
        transliteration: 'qahwah',
        english: 'coffee',
        wordType: 'noun',
        exampleArabic: 'أَشْرَبُ فِنْجَانَ قَهْوَةٍ سَاخِنَةٍ فِي الصَّبَاحِ.',
        exampleTransliteration: 'Ashrabu finjāna qahwatin sākhinatin fī al-ṣabāḥ.',
        exampleEnglish: 'I drink a cup of hot coffee in the morning.',
        explanation: 'Feminine noun (ends with tāʾ marbūṭah). Origin of the English word coffee.',
        topic: 'daily life',
        difficulty: 'beginner',
      },
      {
        arabic: 'شَرِبَ',
        transliteration: 'shariba',
        english: 'to drink',
        wordType: 'verb',
        presentTenseI: 'أَشْرَبُ',
        presentTenseHe: 'يَشْرَبُ',
        root: 'ش-ر-ب',
        exampleArabic: 'أَشْرَبُ كُوبَ مَاءٍ بَارِدٍ بَعْدَ الجَرْيِ.',
        exampleTransliteration: 'Ashrabu kūba māʾin bāridin ba‘da al-jary.',
        exampleEnglish: 'I drink a glass of cold water after running.',
        explanation: 'Basic Form I verb. Notice the kasrah on the middle letter in the past tense.',
        topic: 'daily life',
        difficulty: 'beginner',
      },
      {
        arabic: 'مَطْبَخ',
        transliteration: 'maṭbakh',
        english: 'kitchen',
        wordType: 'noun',
        root: 'ط-ب-خ',
        exampleArabic: 'أُمِّي تُعِدُّ الطَّعَامَ فِي المَطْبَخِ.',
        exampleTransliteration: 'Ummī tu‘iddu al-ṭa‘āma fī al-maṭbakh.',
        exampleEnglish: 'My mother prepares food in the kitchen.',
        explanation: 'Noun of place (maf‘al pattern) derived from the verb ṭabakha (to cook).',
        topic: 'daily life',
        difficulty: 'beginner',
      },
      {
        arabic: 'اسْتَيْقَظَ',
        transliteration: 'istayqaẓa',
        english: 'to wake up',
        wordType: 'verb',
        presentTenseI: 'أَسْتَيْقِظُ',
        presentTenseHe: 'يَسْتَيْقِظُ',
        root: 'ي-ق-ظ',
        exampleArabic: 'اسْتَيْقَظْتُ مُبَكِّراً لِأَنَّ لَدَيَّ مَوْعِداً مُهِمّاً.',
        exampleTransliteration: 'Istayqaẓtu mubakkiran li-anna ladayya maw‘idan muhimman.',
        exampleEnglish: 'I woke up early because I have an important appointment.',
        explanation: 'Form X verb denoting entering into an active state of awakeness.',
        topic: 'daily life',
        difficulty: 'intermediate',
      },
      {
        arabic: 'نَشِيط',
        transliteration: 'nashīṭ',
        english: 'energetic / active',
        wordType: 'adjective',
        exampleArabic: 'أَشْعُرُ أَنِّي نَشِيطٌ بَعْدَ شُرْبِ القَهْوَةِ.',
        exampleTransliteration: 'Ash‘uru annī nashīṭun ba‘da shurbi al-qahwah.',
        exampleEnglish: 'I feel energetic after drinking coffee.',
        explanation: 'Fa‘īl adjective pattern, feminine form is nashīṭah (نَشِيطَة).',
        topic: 'daily life',
        difficulty: 'intermediate',
      },
      {
        arabic: 'بَاب',
        transliteration: 'bāb',
        english: 'door',
        wordType: 'noun',
        exampleArabic: 'أَغْلَقْتُ بَابَ المَنْزِلِ قَبْلَ الذَّهَابِ إِلَى العَمَلِ.',
        exampleTransliteration: 'Aghlaqtu bāba al-manzili qabla al-dhahābi ilā al-‘amal.',
        exampleEnglish: 'I closed the door of the house before going to work.',
        explanation: 'Plural is abwāb (أَبْوَاب).',
        topic: 'daily life',
        difficulty: 'beginner',
      },
      {
        arabic: 'حَقِيبَة',
        transliteration: 'ḥaqībah',
        english: 'bag / backpack',
        wordType: 'noun',
        exampleArabic: 'وَضَعْتُ حَاسُوبِي فِي الحَقِيبَةِ.',
        exampleTransliteration: 'Waḍa‘tu ḥāsūbī fī al-ḥaqībah.',
        exampleEnglish: 'I put my laptop in the bag.',
        explanation: 'Plural is ḥaqāʾib (حَقَائِب).',
        topic: 'daily life',
        difficulty: 'beginner',
      },
      {
        arabic: 'خَرَجَ',
        transliteration: 'kharaja',
        english: 'to go out / leave',
        wordType: 'verb',
        presentTenseI: 'أَخْرُجُ',
        presentTenseHe: 'يَخْرُجُ',
        root: 'خ-ر-ج',
        exampleArabic: 'خَرَجْتُ مِنَ البَيْتِ سَرِيعاً لِأَلْحَقَ الحَافِلَةَ.',
        exampleTransliteration: 'Kharajtu mina al-bayti sarī‘an li-alḥaqa al-ḥāfilah.',
        exampleEnglish: 'I left the house quickly to catch the bus.',
        explanation: 'Common verb paired with the preposition min (مِنْ - from).',
        topic: 'daily life',
        difficulty: 'beginner',
      }
    ]
  },
  'technology': {
    title: 'Modern Digital Workspace & Programming (بيئة العمل الرقمية)',
    themeContext: 'Working remotely from a laptop, browsing code, solving software bugs, and internet communication.',
    words: [
      {
        arabic: 'حَاسُوب',
        transliteration: 'ḥāsūb',
        english: 'computer / laptop',
        wordType: 'noun',
        root: 'ح-س-ب',
        exampleArabic: 'أَسْتَخْدِمُ حَاسُوبِي المَحْمُولَ لِكِتَابَةِ الكُودِ كُلَّ يَوْمٍ.',
        exampleTransliteration: 'Astakhdimu ḥāsūbī al-maḥmūla li-kitābati al-kūd kulla yawm.',
        exampleEnglish: 'I use my laptop to write code every day.',
        explanation: 'Derived from root ḥ-s-b (computation / calculation).',
        topic: 'technology',
        difficulty: 'beginner',
      },
      {
        arabic: 'بَرْمَجَة',
        transliteration: 'barmajah',
        english: 'programming / coding',
        wordType: 'noun',
        exampleArabic: 'تَعَلُّمُ البَرْمَجَةِ يَفْتَحُ آفَاقاً وَاسِعَةً لِلعَمَلِ.',
        exampleTransliteration: 'Ta‘allumu al-barmajati yaftaḥu āfāqan wāsi‘atan li-l-‘amal.',
        exampleEnglish: 'Learning programming opens wide horizons for work.',
        explanation: 'Modern Arabic quadriliteral noun from verb barmaja (to program).',
        topic: 'technology',
        difficulty: 'intermediate',
      },
      {
        arabic: 'شَبَكَة',
        transliteration: 'shabakah',
        english: 'network / web',
        wordType: 'noun',
        exampleArabic: 'انْقَطَعَ الاتِّصَالُ بِشَبَكَةِ الإِنْتَرْنِت فَجْأَةً.',
        exampleTransliteration: 'Inqaṭa‘a al-ittiṣālu bi-shabakati al-intarnit faj’atan.',
        exampleEnglish: 'The internet network connection suddenly disconnected.',
        explanation: 'Literally means "net" or "mesh", used for computer networks.',
        topic: 'technology',
        difficulty: 'beginner',
      },
      {
        arabic: 'طَوَّرَ',
        transliteration: 'ṭawwara',
        english: 'to develop / build',
        wordType: 'verb',
        presentTenseI: 'أُطَوِّرُ',
        presentTenseHe: 'يُطَوِّرُ',
        root: 'ط-و-ر',
        exampleArabic: 'أُطَوِّرُ تَطْبِيقاً جَدِيداً لِتَعَلُّمِ اللُّغَاتِ.',
        exampleTransliteration: 'Uṭawwiru taṭbīqan jadīdan li-ta‘allumi al-lughāt.',
        exampleEnglish: 'I am developing a new application for learning languages.',
        explanation: 'Form II verb with shaddah on the middle root letter denoting causative development.',
        topic: 'technology',
        difficulty: 'intermediate',
      },
      {
        arabic: 'تَطْبِيق',
        transliteration: 'taṭbīq',
        english: 'application / app',
        wordType: 'noun',
        root: 'ط-ب-ق',
        exampleArabic: 'هَذَا التَّطْبِيقُ سَهْلُ الاسْتِخْدَامِ وَسَرِيعٌ جِدّاً.',
        exampleTransliteration: 'Hādhā al-taṭbīqu sahlu al-istikhdāmi wa-sarī‘un jiddan.',
        exampleEnglish: 'This application is user-friendly and very fast.',
        explanation: 'Masdar form of Form II ṭabbaqa (to apply/implement).',
        topic: 'technology',
        difficulty: 'beginner',
      },
      {
        arabic: 'مَلَفّ',
        transliteration: 'malaff',
        english: 'file / folder',
        wordType: 'noun',
        root: 'ل-ف-ف',
        exampleArabic: 'حَفِظْتُ المَلَفَّ فِي مُجَلَّدِ المَشْرُوعِ.',
        exampleTransliteration: 'Ḥafiẓtu al-malaffa fī mujalladi al-mashrū‘.',
        exampleEnglish: 'I saved the file in the project directory.',
        explanation: 'Plural is malaffāt (مَلَفَّات).',
        topic: 'technology',
        difficulty: 'beginner',
      },
      {
        arabic: 'حَفِظَ',
        transliteration: 'ḥafiẓa',
        english: 'to save / memorize / preserve',
        wordType: 'verb',
        presentTenseI: 'أَحْفَظُ',
        presentTenseHe: 'يَحْفَظُ',
        root: 'ح-ف-ظ',
        exampleArabic: 'لَا تَنْسَ أَنْ تَحْفَظَ تَعْدِيلَاتِكَ قَبْلَ إِغْلَاقِ البَرْنَامَجِ.',
        exampleTransliteration: 'Lā tansa an taḥfaẓa ta‘dīlātika qabla ighlāqi al-barnāmaj.',
        exampleEnglish: 'Do not forget to save your edits before closing the program.',
        explanation: 'Essential verb in Arabic culture used both for digital saving and Quranic memorization.',
        topic: 'technology',
        difficulty: 'intermediate',
      },
      {
        arabic: 'شَاشَة',
        transliteration: 'shāshah',
        english: 'screen / monitor',
        wordType: 'noun',
        exampleArabic: 'أَجْلِسُ أَمَامَ شَاشَةِ الحَاسُوبِ لِسَاعَاتٍ طَوِيلَةٍ.',
        exampleTransliteration: 'Ajlisu amāma shāshati al-ḥāsūbi li-sā‘ātin ṭawīlah.',
        exampleEnglish: 'I sit in front of the computer monitor for long hours.',
        explanation: 'Plural is shāshāt (شَاشَات).',
        topic: 'technology',
        difficulty: 'beginner',
      },
      {
        arabic: 'خَطَأ',
        transliteration: 'khaṭaʾ',
        english: 'error / bug / mistake',
        wordType: 'noun',
        root: 'خ-ط-أ',
        exampleArabic: 'وَجَدْتُ خَطَأً بَرْمَجِيّاً فِي الكُودِ وَأَصْلَحْتُهُ.',
        exampleTransliteration: 'Wajadtu khaṭa’an barmajiyyan fī al-kūd wa-aṣlaḥtuhu.',
        exampleEnglish: 'I found a software bug in the code and fixed it.',
        explanation: 'Plural is akhṭāʾ (أَخْطَاء).',
        topic: 'technology',
        difficulty: 'intermediate',
      },
      {
        arabic: 'أَصْلَحَ',
        transliteration: 'aṣlaḥa',
        english: 'to fix / repair / resolve',
        wordType: 'verb',
        presentTenseI: 'أُصْلِحُ',
        presentTenseHe: 'يُصْلِحُ',
        root: 'ص-ل-ح',
        exampleArabic: 'أُصْلِحُ المَشَاكِلَ التِّقْنِيَّةَ سَرِيعاً كَيْ يَعْمَلَ التَّطْبِيقُ.',
        exampleTransliteration: 'Uṣliḥu al-mashākila al-tiqniyyata sarī‘an kay ya‘mala al-taṭbīq.',
        exampleEnglish: 'I fix technical issues quickly so that the app works.',
        explanation: 'Form IV verb meaning to repair or reform.',
        topic: 'technology',
        difficulty: 'advanced',
      }
    ]
  }
};

/**
 * Clean and parse JSON response from Gemini
 */
function cleanJsonOutput(text: string): string {
  let cleaned = text.trim();
  // Strip markdown code fences ```json ... ``` if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

/**
 * Generate a cohesive Arabic vocabulary set using Gemini API or fallback
 */
export async function generateVocabularySet(options: GenerateWordsOptions): Promise<GeneratedWordSetResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  // If no API key configured, use intelligent curated fallback for instant usability
  if (!apiKey || apiKey.trim() === '') {
    const key = (options.topic || 'daily life').toLowerCase();
    const fallback = curatedSeedTopics[key] || curatedSeedTopics['daily life'];
    
    // Filter out words that might already be in excludeWords
    const excludedSet = new Set((options.excludeWords || []).map(w => w.trim()));
    const filteredWords = fallback.words.filter(w => !excludedSet.has(w.arabic));
    
    const count = Math.min(options.count || 10, filteredWords.length > 0 ? filteredWords.length : fallback.words.length);
    const chosenWords = (filteredWords.length >= count ? filteredWords : fallback.words).slice(0, count);

    return {
      title: `${fallback.title} (${options.difficulty})`,
      themeContext: fallback.themeContext,
      words: chosenWords.map(w => ({
        ...w,
        difficulty: options.difficulty,
        topic: options.topic,
      })),
    };
  }

  // Use Gemini 2.5 Flash via @google/genai
  const ai = new GoogleGenAI({ apiKey });

  const excludeSection = options.excludeWords && options.excludeWords.length > 0
    ? `IMPORTANT: The student ALREADY knows these words. DO NOT generate these words again as new entries:\n${options.excludeWords.slice(0, 50).join(', ')}`
    : '';

  const revisionSection = options.revisionWords && options.revisionWords.length > 0
    ? `The student is currently revising these words: ${options.revisionWords.map(w => `${w.arabic} (${w.english})`).join(', ')}. Please naturally REUSE these familiar words inside the example sentences of the new words so the student builds contextual connections.`
    : '';

  const prompt = `
You are an expert Arabic language tutor designing a vocabulary study set for a student.

CONFIGURATION:
- Number of words: ${options.count || 10}
- Topic: "${options.topic}"
- Difficulty level: "${options.difficulty}" (beginner, intermediate, or advanced)
- Target word types: "${options.wordType}"

CRITICAL LEARNING RULES:
1. Words MUST NOT feel random. Group all words around one realistic situation or short storyline (e.g. commuting to work, ordering at a bustling cafe, solving a coding problem on a laptop, visiting a doctor).
2. Every Arabic word and example sentence MUST have full diacritics (Harakat: fatḥah, kasrah, ḍammah, sukūn, shaddah, tanwīn) for correct pronunciation.
3. For every verb, you MUST provide presentTenseI (e.g. أَكْتُبُ) and presentTenseHe (e.g. يَكْتُبُ) and optionally the 3-letter root.
4. Reuse words across example sentences so the learner sees how they connect in a story.
5. Provide accurate English translations, realistic transliterations for BOTH the individual word (transliteration) AND the full example sentence (exampleTransliteration), and insightful usage explanations.
6. MANDATORY: "exampleTransliteration" MUST NOT be empty or omitted. It must provide the complete Romanized pronunciation of the example sentence (e.g. "Qara'tu kitāban mufīdan fī al-maktabah.").

${excludeSection}
${revisionSection}

Respond ONLY with a valid JSON object matching this exact schema:
{
  "title": "A short evocative title for the word set (in English with Arabic in parentheses)",
  "themeContext": "1-2 sentences describing the realistic situation or story tying all words together",
  "words": [
    {
      "arabic": "Arabic word with full diacritics",
      "transliteration": "Latin transliteration (e.g. kitāb, kataba)",
      "english": "Concise English translation",
      "wordType": "noun" | "verb" | "adjective" | "expression" | "phrase",
      "presentTenseI": "Present tense I form if verb, or null",
      "presentTenseHe": "Present tense he form if verb, or null",
      "root": "3-letter root or null",
      "exampleArabic": "A natural Arabic sentence with full diacritics using the word",
      "exampleTransliteration": "Transliteration of the example sentence",
      "exampleEnglish": "English translation of the example sentence",
      "explanation": "Short helpful note on grammar, nuance, or typical usage context"
    }
  ]
}
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        thinkingConfig: {
          thinkingBudget: 0,
        },
      },
    });

    const responseText = response.text || '';
    const parsed = JSON.parse(cleanJsonOutput(responseText)) as GeneratedWordSetResult;

    // Attach chosen topic and difficulty to each word
    const cleanedWords = (parsed.words || []).map(w => ({
      ...w,
      topic: options.topic,
      difficulty: options.difficulty,
      wordType: w.wordType || 'noun',
    }));

    return {
      title: parsed.title || `${options.topic} Word Set`,
      themeContext: parsed.themeContext || `Vocabulary set for ${options.topic}`,
      words: cleanedWords,
    };
  } catch (error) {
    console.error('Error in Gemini vocabulary generation:', error);
    // Fallback gracefully so student is never blocked
    const fallback = curatedSeedTopics['daily life'];
    return {
      title: `${options.topic} (Fallback Set)`,
      themeContext: `Study words for ${options.topic}. Connect these words through daily communication.`,
      words: fallback.words.slice(0, options.count || 10).map(w => ({
        ...w,
        topic: options.topic,
        difficulty: options.difficulty,
      })),
    };
  }
}
