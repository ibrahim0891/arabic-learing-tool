import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { Word } from '@/lib/types';

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
    const existingCount = db.prepare('SELECT COUNT(*) as count FROM words').get() as { count: number };
    if (existingCount.count > 0) {
      return NextResponse.json({ message: 'Database already has vocabulary', count: existingCount.count });
    }

    const setId = 'set_starter_foundations';
    const nowIso = new Date().toISOString();

    db.prepare(`
      INSERT INTO word_sets (id, title, themeContext, topic, difficulty, createdAt, wordsCount)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      setId,
      'Everyday Study & Friendship (الدراسة والصداقة)',
      'Meeting a friend at the university library, sharing books, writing notes, and enjoying tea.',
      'daily life',
      'beginner',
      nowIso,
      defaultSeedWords.length
    );

    const insertWord = db.prepare(`
      INSERT INTO words (
        id, arabic, transliteration, english, wordType, presentTenseI, presentTenseHe, root,
        exampleArabic, exampleTransliteration, exampleEnglish, explanation, topic, difficulty,
        setId, setName, dateAdded, timesTested, timesCorrect, timesIncorrect, memoryStatus,
        easeFactor, intervalDays, repetitionCount, nextReviewDate
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, 0, 0, 0, 'new',
        2.5, 0, 0, ?
      )
    `);

    for (let i = 0; i < defaultSeedWords.length; i++) {
      const w = defaultSeedWords[i];
      insertWord.run(
        `starter_word_${i + 1}`,
        w.arabic,
        w.transliteration,
        w.english,
        w.wordType,
        w.presentTenseI || null,
        w.presentTenseHe || null,
        w.root || null,
        w.exampleArabic,
        w.exampleTransliteration,
        w.exampleEnglish,
        w.explanation,
        w.topic,
        w.difficulty,
        setId,
        'Everyday Study & Friendship',
        nowIso,
        nowIso
      );
    }

    return NextResponse.json({ message: 'Seeded initial vocabulary successfully', count: defaultSeedWords.length });
  } catch (error) {
    console.error('Error seeding vocabulary:', error);
    return NextResponse.json({ error: 'Failed to seed vocabulary' }, { status: 500 });
  }
}
