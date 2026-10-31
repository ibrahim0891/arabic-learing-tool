import { NextRequest, NextResponse } from 'next/server';
import {
  ARABIC_TTS_VOICES,
  cacheAudio,
  getCachedAudio,
  isSupportedVoice,
  synthesizeArabic,
  TTS_MIME_TYPE,
} from '@/lib/tts';

// Edge TTS needs Node's networking APIs, so this route must not run on the edge runtime.
export const runtime = 'nodejs';

const MAX_TEXT_LENGTH = 1200;

function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function normalize(text: string | null | undefined, voice: string | null | undefined) {
  if (!text || !text.trim()) {
    return { error: badRequest('Text query parameter is required') } as const;
  }

  const trimmed = text.trim();
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { error: badRequest(`Text must be ${MAX_TEXT_LENGTH} characters or fewer`) } as const;
  }

  if (voice && !isSupportedVoice(voice)) {
    return {
      error: badRequest(`Unsupported voice. Use one of: ${ARABIC_TTS_VOICES.join(', ')}`),
    } as const;
  }

  return { trimmed, voices: voice ? [voice] : ARABIC_TTS_VOICES } as const;
}

function audioResponse(audio: Buffer) {
  return new NextResponse(new Uint8Array(audio), {
    status: 200,
    headers: {
      'Content-Type': TTS_MIME_TYPE,
      'Content-Length': String(audio.length),
      // Audio for a given phrase never changes, so browsers/CDNs can keep it forever.
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const result = normalize(searchParams.get('text'), searchParams.get('voice'));

  if ('error' in result) return result.error;
  const { trimmed, voices } = result;

  const cacheKey = `${voices[0]}::${trimmed}`;
  const cached = getCachedAudio(cacheKey);
  if (cached) return audioResponse(cached);

  try {
    const audio = await synthesizeArabic(trimmed, { voices });
    cacheAudio(cacheKey, audio);
    return audioResponse(audio);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[api/tts] synthesis failed:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

export async function POST(req: NextRequest) {
  let body: { text?: unknown; voice?: unknown };

  try {
    body = await req.json();
  } catch {
    return badRequest('Request body must be valid JSON');
  }

  const text = typeof body.text === 'string' ? body.text : null;
  const voice = typeof body.voice === 'string' ? body.voice : null;
  const result = normalize(text, voice);

  if ('error' in result) return result.error;
  const { trimmed, voices } = result;

  const cacheKey = `${voices[0]}::${trimmed}`;
  const cached = getCachedAudio(cacheKey);
  if (cached) {
    return NextResponse.json({
      audioContent: cached.toString('base64'),
      mimeType: TTS_MIME_TYPE,
    });
  }

  try {
    const audio = await synthesizeArabic(trimmed, { voices });
    cacheAudio(cacheKey, audio);

    return NextResponse.json({
      audioContent: audio.toString('base64'),
      mimeType: TTS_MIME_TYPE,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[api/tts] synthesis failed:', message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
