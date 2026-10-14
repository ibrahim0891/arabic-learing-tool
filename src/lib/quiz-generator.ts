import { Word, QuizQuestion } from './types';
import { stripHarakat } from './srs';

export interface GenerateQuizOptions {
  words: Word[];
  questionCount: number;
  direction: 'ar-to-en' | 'en-to-ar' | 'mixed';
  questionTypes: ('multiple-choice' | 'typing' | 'fill-in-blank' | 'sentence-completion')[];
}

/**
 * Fisher-Yates shuffle array helper
 */
function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Generates an interactive, randomized test covering specified words and question types
 */
export function generateQuiz(options: GenerateQuizOptions): QuizQuestion[] {
  const { words, questionCount, direction, questionTypes } = options;

  if (!words || words.length === 0) return [];

  // Allowed question types
  const types = questionTypes && questionTypes.length > 0
    ? questionTypes
    : (['multiple-choice', 'typing', 'fill-in-blank'] as const);

  // Shuffle candidate words
  const shuffledWords = shuffle(words);
  const questions: QuizQuestion[] = [];

  // Cycle through candidate words until target question count reached
  let wordIdx = 0;
  for (let qNum = 0; qNum < questionCount; qNum++) {
    const word = shuffledWords[wordIdx % shuffledWords.length];
    wordIdx++;

    // Pick question direction
    let dir: 'ar-to-en' | 'en-to-ar' = 'ar-to-en';
    if (direction === 'mixed') {
      dir = Math.random() > 0.5 ? 'ar-to-en' : 'en-to-ar';
    } else {
      dir = direction;
    }

    // Pick question type
    const qType = types[Math.floor(Math.random() * types.length)];

    let question: QuizQuestion;

    if (qType === 'multiple-choice') {
      // Pick 3 distractor words from the rest of the pool
      const otherWords = words.filter(w => w.id !== word.id);
      const shuffledOthers = shuffle(otherWords);
      const distractors = shuffledOthers.slice(0, 3);

      let optionsList: string[];
      let prompt: string;
      let subPrompt: string | undefined;
      let correctAnswer: string;

      if (dir === 'ar-to-en') {
        prompt = `What does "${word.arabic}" (${word.transliteration}) mean?`;
        subPrompt = word.exampleArabic ? `Context: ${word.exampleArabic}` : undefined;
        correctAnswer = word.english;
        const distractorOptions = distractors.map(d => d.english);
        // Fallbacks if pool is too small
        const fallbackDistractors = ['to travel / journey', 'friend / companion', 'city / town', 'book / record'];
        while (distractorOptions.length < 3) {
          const fallback = fallbackDistractors.find(f => !distractorOptions.includes(f) && f !== correctAnswer) || 'other concept';
          distractorOptions.push(fallback);
        }
        optionsList = shuffle([correctAnswer, ...distractorOptions.slice(0, 3)]);
      } else {
        prompt = `Which Arabic word means "${word.english}"?`;
        correctAnswer = `${word.arabic} (${word.transliteration})`;
        const distractorOptions = distractors.map(d => `${d.arabic} (${d.transliteration})`);
        const fallbackDistractors = ['كِتَاب (kitāb)', 'مَدِينَة (madīnah)', 'صَدِيق (ṣadīq)', 'سَفَر (safar)'];
        while (distractorOptions.length < 3) {
          const fallback = fallbackDistractors.find(f => !distractorOptions.includes(f) && f !== correctAnswer) || 'كَلِمَة (kalimah)';
          distractorOptions.push(fallback);
        }
        optionsList = shuffle([correctAnswer, ...distractorOptions.slice(0, 3)]);
      }

      question = {
        id: `q_${Date.now()}_${qNum}`,
        wordId: word.id,
        type: 'multiple-choice',
        direction: dir,
        prompt,
        subPrompt,
        correctAnswer,
        options: optionsList,
        explanation: `${word.arabic} (${word.transliteration}) means "${word.english}". ${word.explanation}`,
        wordContext: {
          arabic: word.arabic,
          transliteration: word.transliteration,
          english: word.english,
          exampleArabic: word.exampleArabic,
          exampleEnglish: word.exampleEnglish,
        },
      };
    } else if (qType === 'fill-in-blank' || qType === 'sentence-completion') {
      // In sentence completion or fill-in-blank, blank out the word in the Arabic example sentence
      let maskedSentence = word.exampleArabic;
      const strippedWord = stripHarakat(word.arabic);

      // Attempt to replace the word (with or without harakat) with a blank "_____"
      // Split sentence into words and find the best match
      const sentenceTokens = word.exampleArabic.split(/\s+/);
      let replaced = false;

      const maskedTokens = sentenceTokens.map(token => {
        if (!replaced && (token.includes(word.arabic) || stripHarakat(token).includes(strippedWord))) {
          replaced = true;
          return '【 _________ 】';
        }
        return token;
      });

      if (replaced) {
        maskedSentence = maskedTokens.join(' ');
      } else {
        maskedSentence = `... 【 _________ 】 ... (${word.exampleEnglish})`;
      }

      // 4 choices for fill in blank
      const otherWords = words.filter(w => w.id !== word.id);
      const shuffledOthers = shuffle(otherWords);
      const distractorWords = shuffledOthers.slice(0, 3).map(w => w.arabic);
      const fallbackOptions = ['البَيْت', 'الكِتَاب', 'العَمَل', 'الشَّارِع'];
      while (distractorWords.length < 3) {
        const fb = fallbackOptions.find(f => !distractorWords.includes(f) && f !== word.arabic) || 'الشَّمْس';
        distractorWords.push(fb);
      }

      question = {
        id: `q_${Date.now()}_${qNum}`,
        wordId: word.id,
        type: 'fill-in-blank',
        direction: 'ar-to-en',
        prompt: 'Fill in the missing word in this sentence:',
        subPrompt: `${maskedSentence}\n\nTranslation: "${word.exampleEnglish}"`,
        correctAnswer: word.arabic,
        options: shuffle([word.arabic, ...distractorWords.slice(0, 3)]),
        explanation: `Full sentence: "${word.exampleArabic}" — "${word.exampleEnglish}". Missing word is ${word.arabic} (${word.english}).`,
        wordContext: {
          arabic: word.arabic,
          transliteration: word.transliteration,
          english: word.english,
          exampleArabic: word.exampleArabic,
          exampleEnglish: word.exampleEnglish,
        },
      };
    } else {
      // Typing Question
      let prompt: string;
      let subPrompt: string | undefined;
      let correctAnswer: string;
      const acceptableAnswers: string[] = [];

      if (dir === 'ar-to-en') {
        prompt = `Type the English meaning for:`;
        subPrompt = `${word.arabic} (${word.transliteration})`;
        correctAnswer = word.english;

        // Add synonyms from comma or slash separated items
        const parts = word.english.split(/[,;/]/).map(s => s.trim());
        acceptableAnswers.push(...parts);
      } else {
        prompt = `Write or type the Arabic word for:`;
        subPrompt = `"${word.english}" (Transliteration hint: ${word.transliteration})`;
        correctAnswer = word.arabic;
        acceptableAnswers.push(word.arabic, word.transliteration);
      }

      question = {
        id: `q_${Date.now()}_${qNum}`,
        wordId: word.id,
        type: 'typing',
        direction: dir,
        prompt,
        subPrompt,
        correctAnswer,
        acceptableAnswers,
        explanation: `${word.arabic} (${word.transliteration}) = "${word.english}". Context: ${word.exampleArabic} (${word.exampleEnglish})`,
        wordContext: {
          arabic: word.arabic,
          transliteration: word.transliteration,
          english: word.english,
          exampleArabic: word.exampleArabic,
          exampleEnglish: word.exampleEnglish,
        },
      };
    }

    questions.push(question);
  }

  return questions;
}
