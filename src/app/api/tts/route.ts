import { NextRequest, NextResponse } from 'next/server';

// Server-side in-memory cache to instantly replay audio without any external requests
const serverAudioCache = new Map<string, { audioBase64: string; mimeType: string }>();

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get('text');

  if (!text || !text.trim()) {
    return NextResponse.json({ error: 'Text query parameter is required' }, { status: 400 });
  }

  const trimmed = text.trim();

  // 1. Check in-memory cache
  const cached = serverAudioCache.get(trimmed);
  if (cached) {
    const buffer = Buffer.from(cached.audioBase64, 'base64');
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': cached.mimeType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  }

  try {
    // 2. Fetch native Arabic speech from Google Translate TTS endpoint
    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(trimmed)}`;
    const googleRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!googleRes.ok) {
      throw new Error(`Google Translate TTS responded with status ${googleRes.status}`);
    }

    const arrayBuffer = await googleRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save to memory cache as base64 for fast subsequent lookups
    serverAudioCache.set(trimmed, {
      audioBase64: buffer.toString('base64'),
      mimeType: 'audio/mpeg',
    });

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'audio/mpeg',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error: any) {
    console.warn('Google Translate TTS fetch error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'Google Translate TTS failed' },
      { status: 502 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = body.text;

    if (!text || typeof text !== 'string' || !text.trim()) {
      return NextResponse.json({ error: 'Text prompt is required' }, { status: 400 });
    }

    const trimmed = text.trim();

    // Check in-memory cache
    const cached = serverAudioCache.get(trimmed);
    if (cached) {
      return NextResponse.json({
        audioContent: cached.audioBase64,
        mimeType: cached.mimeType,
      });
    }

    const url = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ar&client=tw-ob&q=${encodeURIComponent(trimmed)}`;
    const googleRes = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Referer: 'https://translate.google.com/',
      },
    });

    if (!googleRes.ok) {
      throw new Error(`Google Translate TTS responded with ${googleRes.status}`);
    }

    const arrayBuffer = await googleRes.arrayBuffer();
    const base64Audio = Buffer.from(arrayBuffer).toString('base64');

    const payload = {
      audioContent: base64Audio,
      mimeType: 'audio/mpeg',
    };

    serverAudioCache.set(trimmed, {
      audioBase64: base64Audio,
      mimeType: 'audio/mpeg',
    });

    return NextResponse.json(payload);
  } catch (error: any) {
    console.warn('TTS POST handler error:', error?.message || error);
    return NextResponse.json(
      { error: error?.message || 'TTS generation failed' },
      { status: 502 }
    );
  }
}
