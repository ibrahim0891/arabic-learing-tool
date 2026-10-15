import { NextResponse } from 'next/server';
import { dataStore, supabase } from '@/lib/supabase-store';
import { Word, WordSet } from '@/lib/types';

const defaultSeedWords = [
  {
    arabic: 'كِتَاب',
    transliteration: 'kitāb',
    english: 'book',
    wordType: 'noun',
    root: 'ك-ت-ب',
    exampleArabic: 'قَرَأْتُ كِتَاباً مُفِيداً فِي المَكْتَبَةِ.',
    exampleTransliteration: 'Qara’tu kitāban mufīdan fī al-maktabah.',
    exampleEnglish: 'I read a useful book in the library.',
    explanation: 'Basic masculine noun. Plural is kutub (كُتُب).',
    topic: 'daily life',
    difficulty: 'beginner',
  },
  {
    arabic: 'قَرَأَ',
    transliteration: 'qaraʾa',
    english: 'to read',
    wordType: 'verb',
    presentTenseI: 'أَقْرَأُ',
    presentTenseHe: 'يَقْرَأُ',
    root: 'ق-ر-أ',
    exampleArabic: 'أَقْرَأُ كُلَّ مَسَاءٍ قَبْلَ النَّوْمِ.',
    exampleTransliteration: 'Aqra’u kulla masā’in qabla al-nawm.',
    exampleEnglish: 'I read every evening before sleeping.',
    explanation: 'The first word revealed in the Quran (Iqra’ / Read!).',
    topic: 'daily life',
    difficulty: 'beginner',
  },
  {
    arabic: 'مَكْتَبَة',
    transliteration: 'maktabah',
    english: 'library / bookstore',
    wordType: 'noun',
    root: 'ك-ت-ب',
    exampleArabic: 'ذَهَبْتُ إِلَى مَكْتَبَةِ الجَامِعَةِ لِلدِّرَاسَةِ.',
    exampleTransliteration: 'Dhahabtu ilā maktabati al-jāmi‘ati li-al-dirāsah.',
    exampleEnglish: 'I went to the university library to study.',
    explanation: 'Place-noun derived from root k-t-b with feminine marker tāʾ marbūṭah.',
    topic: 'daily life',
    difficulty: 'beginner',
  },
  {
    arabic: 'قَلَم',
    transliteration: 'qalam',
    english: 'pen / pencil',
    wordType: 'noun',
    exampleArabic: 'كَتَبْتُ مُلَاحَظَاتِي بِقَلَمٍ حِبْرٍ أَزْرَقَ.',
    exampleTransliteration: 'Katabtu mulāḥaẓātī bi-qalami ḥibrin azraq.',
    exampleEnglish: 'I wrote my notes with a blue ink pen.',
    explanation: 'Plural is aqlām (أَقْلَام). Mentioned prominently in Surah Al-Qalam.',
    topic: 'daily life',
    difficulty: 'beginner',
  },
  {
    arabic: 'كَتَبَ',
    transliteration: 'kataba',
    english: 'to write',
    wordType: 'verb',
    presentTenseI: 'أَكْتُبُ',
    presentTenseHe: 'يَكْتُبُ',
    root: 'ك-ت-ب',
    exampleArabic: 'أَكْتُبُ رِسَالَةً لِصَدِيقِي القَدِيمِ.',
    exampleTransliteration: 'Aktubu risālatan li-ṣadīqī al-qadīm.',
    exampleEnglish: 'I am writing a letter to my old friend.',
    explanation: 'One of the foundational root verbs studied by all Arabic learners.',
    topic: 'daily life',
    difficulty: 'beginner',
  },
  {
    arabic: 'صَدِيق',
    transliteration: 'ṣadīq',
    english: 'friend',
    wordType: 'noun',
    root: 'ص-د-ق',
    exampleArabic: 'الْتَقَيْتُ بِصَدِيقِي فِي المَقْهَى.',
    exampleTransliteration: 'Iltaqaytu bi-ṣadīqī fī al-maqhā.',
    exampleEnglish: 'I met my friend at the cafe.',
    explanation: 'Comes from root ṣ-d-q (truthfulness/sincerity). Plural is aṣdiqāʾ (أَصْدِقَاء).',
    topic: 'daily life',
    difficulty: 'beginner',
  },
  {
    arabic: 'شَاي',
    transliteration: 'shāy',
    english: 'tea',
    wordType: 'noun',
    exampleArabic: 'أُفَضِّلُ شُرْبَ الشَّايِ بِالنَّعْنَاعِ بَعْدَ الغَدَاءِ.',
    exampleTransliteration: 'Ufaḍḍilu shurba al-shāyi bi-al-na‘nā‘ ba‘da al-ghadā’.',
    exampleEnglish: 'I prefer drinking mint tea after lunch.',
    explanation: 'Everyday beverage across the Arab world.',
    topic: 'food',
    difficulty: 'beginner',
  },
  {
    arabic: 'جَمِيل',
    transliteration: 'jamīl',
    english: 'beautiful / wonderful',
    wordType: 'adjective',
    root: 'ج-م-ل',
    exampleArabic: 'اليَوْمَ طَقْسٌ جَمِيلٌ وَمُشْمِسٌ.',
    exampleTransliteration: 'Al-yawma ṭaqsun jamīlun wa-mushmis.',
    exampleEnglish: 'Today the weather is beautiful and sunny.',
    explanation: 'Feminine form is jamīlah (جَمِيلَة).',
    topic: 'daily life',
    difficulty: 'beginner',
  }
];

export async function POST() {
  try {
    const existingWords = await dataStore.getWords();
    if (existingWords.length > 0) {
      return NextResponse.json({ message: 'Database already has vocabulary', count: existingWords.length });
    }

    const setId = 'set_starter_foundations';
    const nowIso = new Date().toISOString();

    const starterSet: WordSet = {
      id: setId,
      title: 'Everyday Study & Friendship (الدراسة والصداقة)',
      themeContext: 'Meeting a friend at the university library, sharing books, writing notes, and enjoying tea.',
      topic: 'daily life',
      difficulty: 'beginner',
      createdAt: nowIso,
      wordsCount: defaultSeedWords.length,
    };

    const wordsToInsert: Partial<Word>[] = defaultSeedWords.map((w, i) => ({
      id: `starter_word_${i + 1}`,
      arabic: w.arabic,
      transliteration: w.transliteration,
      english: w.english,
      wordType: w.wordType,
      presentTenseI: w.presentTenseI || undefined,
      presentTenseHe: w.presentTenseHe || undefined,
      root: w.root || undefined,
      exampleArabic: w.exampleArabic,
      exampleTransliteration: w.exampleTransliteration,
      exampleEnglish: w.exampleEnglish,
      explanation: w.explanation,
      topic: w.topic,
      difficulty: w.difficulty as 'beginner',
      setId: setId,
      setName: 'Everyday Study & Friendship',
      dateAdded: nowIso,
      timesTested: 0,
      timesCorrect: 0,
      timesIncorrect: 0,
      memoryStatus: 'new',
      easeFactor: 2.5,
      intervalDays: 0,
      repetitionCount: 0,
      nextReviewDate: nowIso,
    }));

    await dataStore.saveWordSet(starterSet, wordsToInsert);

    return NextResponse.json({ message: 'Seeded initial vocabulary successfully', count: defaultSeedWords.length });
  } catch (error: any) {
    console.error('Error seeding vocabulary:', error);
    return NextResponse.json({ error: error?.message || 'Failed to seed vocabulary' }, { status: 500 });
  }
}
