/**
 * Server-side Arabic text-to-speech built on the Microsoft Edge "Read Aloud"
 * neural voices (the same models behind Azure Neural TTS, without an API key).
 *
 * This replaces the old `translate.google.com/translate_tts` endpoint, which
 * used a pre-neural concatenative voice and sounded heavily robotic.
 */

import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

/**
 * Arabic voices tried in order. The first one that synthesises successfully
 * wins; the rest act as failover if a single voice is rejected.
 */
export const ARABIC_TTS_VOICES = [
  'ar-EG-SalmaNeural', // Female, Egyptian — clear MSA delivery, warm tone
  'ar-SA-ZariyahNeural', // Female, Saudi
  'ar-SY-AmanyNeural', // Female, Syrian — very crisp articulation
  'ar-EG-ShakirNeural', // Male, Egyptian
] as const;

export type ArabicTtsVoice = (typeof ARABIC_TTS_VOICES)[number];

export const TTS_MIME_TYPE = 'audio/mpeg';

/** Slightly slower than natural speech so learners can follow the harakat. */
const DEFAULT_RATE = '-10%';
const DEFAULT_PITCH = '+0Hz';

/** Edge TTS is happiest with short requests, so long text is chunked. */
const MAX_CHUNK_LENGTH = 500;

/** Keeps the in-process cache from growing without bound. */
const MAX_CACHE_ENTRIES = 500;
const MAX_CACHE_BYTES = 32 * 1024 * 1024;

const audioCache = new Map<string, Buffer>();
let cachedBytes = 0;

export interface SynthesizeOptions {
  voices?: readonly string[];
  rate?: string;
  pitch?: string;
  /** Per-voice timeout in milliseconds. */
  timeoutMs?: number;
}

export function isSupportedVoice(voice: string | null | undefined): voice is ArabicTtsVoice {
  return !!voice && (ARABIC_TTS_VOICES as readonly string[]).includes(voice);
}

export function getCachedAudio(text: string): Buffer | undefined {
  const cached = audioCache.get(text);
  if (cached) {
    // Refresh recency for the simple LRU behaviour.
    audioCache.delete(text);
    audioCache.set(text, cached);
  }
  return cached;
}

export function cacheAudio(text: string, audio: Buffer): void {
  const existing = audioCache.get(text);
  if (existing) {
    cachedBytes -= existing.length;
    audioCache.delete(text);
  }

  audioCache.set(text, audio);
  cachedBytes += audio.length;

  while (audioCache.size > MAX_CACHE_ENTRIES || cachedBytes > MAX_CACHE_BYTES) {
    const oldest = audioCache.keys().next();
    if (oldest.done) break;
    const evicted = audioCache.get(oldest.value);
    audioCache.delete(oldest.value);
    cachedBytes -= evicted?.length ?? 0;
  }
}

/**
 * Synthesises Arabic speech and returns MP3 bytes.
 *
 * Tries every voice in `options.voices` (or the defaults) until one succeeds,
 * so a transient rejection from a single voice does not break playback.
 */
export async function synthesizeArabic(text: string, options: SynthesizeOptions = {}): Promise<Buffer> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error('Text is required for speech synthesis');
  }

  const voices = options.voices?.length ? options.voices : ARABIC_TTS_VOICES;
  const chunks = splitIntoChunks(trimmed, MAX_CHUNK_LENGTH);

  let lastError: unknown;
  for (const voice of voices) {
    try {
      const parts: Buffer[] = [];
      for (const chunk of chunks) {
        parts.push(await synthesizeChunk(chunk, voice, options));
      }
      return Buffer.concat(parts);
    } catch (error) {
      lastError = error;
      console.warn(`[tts] voice ${voice} failed:`, error instanceof Error ? error.message : error);
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Speech synthesis failed');
}

function synthesizeChunk(text: string, voice: string, options: SynthesizeOptions): Promise<Buffer> {
  const timeoutMs = options.timeoutMs ?? 15000;

  return new Promise<Buffer>((resolve, reject) => {
    const tts = new MsEdgeTTS({
      connectionTimeoutMs: timeoutMs,
      synthesisTimeoutMs: timeoutMs,
    });

    let settled = false;
    const audioChunks: Buffer[] = [];

    const settle = (error: unknown, audio?: Buffer) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      try {
        tts.close();
      } catch {
        // Socket already gone — nothing to clean up.
      }
      if (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      } else {
        resolve(audio ?? Buffer.alloc(0));
      }
    };

    const timer = setTimeout(() => settle(new Error('Speech synthesis timed out')), timeoutMs);

    void (async () => {
      try {
        await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);

        const { audioStream } = tts.toStream(escapeSsml(text), {
          rate: options.rate ?? DEFAULT_RATE,
          pitch: options.pitch ?? DEFAULT_PITCH,
        });

        audioStream.on('data', (chunk: Buffer | string) => {
          audioChunks.push(typeof chunk === 'string' ? Buffer.from(chunk, 'utf8') : Buffer.from(chunk));
        });
        audioStream.on('end', () => {
          const audio = Buffer.concat(audioChunks);
          if (audio.length === 0) {
            settle(new Error(`No audio returned by voice ${voice}`));
            return;
          }
          settle(null, audio);
        });
        audioStream.on('error', (error: Error) => settle(error));
      } catch (error) {
        settle(error);
      }
    })();
  });
}

/**
 * Splits text on sentence boundaries (then on whitespace) so each Edge TTS
 * request stays within the service's reliable limits.
 */
function splitIntoChunks(text: string, maxLength: number): string[] {
  if (text.length <= maxLength) return [text];

  const sentences = text
    .split(/(?<=[.!?؟؛،:\n])\s+/u)
    .map((part) => part.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (current.trim()) chunks.push(current.trim());
    current = '';
  };

  for (const sentence of sentences) {
    if (sentence.length > maxLength) {
      pushCurrent();
      // Hard-wrap any single oversized sentence on word boundaries.
      let buffer = '';
      for (const word of sentence.split(/\s+/)) {
        if (`${buffer} ${word}`.trim().length > maxLength) {
          if (buffer) chunks.push(buffer.trim());
          buffer = word;
        } else {
          buffer = `${buffer} ${word}`.trim();
        }
      }
      if (buffer.trim()) chunks.push(buffer.trim());
      continue;
    }

    if (`${current} ${sentence}`.trim().length > maxLength) {
      pushCurrent();
      current = sentence;
    } else {
      current = `${current} ${sentence}`.trim();
    }
  }

  pushCurrent();
  return chunks.length ? chunks : [text];
}

/** The Edge TTS client inserts the text verbatim into SSML, so escape it. */
function escapeSsml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
