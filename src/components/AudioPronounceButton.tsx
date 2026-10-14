'use client';

import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';
import { base64ToUint8Array, pcmToWav } from '@/lib/audio-utils';

interface AudioPronounceButtonProps {
  arabicText: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  title?: string;
  ariaLabel?: string;
}

// In-memory audio blob cache for instant replays without network lag
const audioCache = new Map<string, string>();

export const AudioPronounceButton: React.FC<AudioPronounceButtonProps> = ({
  arabicText,
  className = '',
  size = 'md',
  label,
  title,
  ariaLabel,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingTTS, setIsLoadingTTS] = useState(false);

  // Fallback to Web Speech API (window.speechSynthesis)
  const speakWithWebSpeechFallback = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(arabicText);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(
      (v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic')
    );
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);

    window.speechSynthesis.speak(utterance);
  };

  const handleSpeak = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isPlaying) {
      return;
    }

    const trimmedText = arabicText.trim();
    if (!trimmedText) return;

    // Check memory cache first
    const cachedUrl = audioCache.get(trimmedText);
    if (cachedUrl) {
      playAudioBlobUrl(cachedUrl);
      return;
    }

    // Tier 1: Try Gemini 2.5 Flash TTS (gemini-2.5-flash-preview-tts with "Orus" voice)
    setIsLoadingTTS(true);
    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmedText }),
      });

      if (!res.ok) {
        throw new Error('TTS API responded with error');
      }

      const data = await res.json();
      if (!data.audioContent) {
        throw new Error('No audio content returned');
      }

      // Convert raw 16-bit PCM bytes to playable WAV blob
      const pcmBytes = base64ToUint8Array(data.audioContent);
      const wavBlob = pcmToWav(pcmBytes, data.sampleRate || 24000);
      const objectUrl = URL.createObjectURL(wavBlob);

      // Cache for instant replays
      audioCache.set(trimmedText, objectUrl);

      playAudioBlobUrl(objectUrl);
    } catch (err) {
      console.warn('Gemini TTS unavailable, using Web Speech API fallback:', err);
      // Tier 2: Automatic fallback to Web Speech API
      speakWithWebSpeechFallback();
    } finally {
      setIsLoadingTTS(false);
    }
  };

  const playAudioBlobUrl = (url: string) => {
    const audio = new Audio(url);
    setIsPlaying(true);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      speakWithWebSpeechFallback();
    };
    audio.play().catch(() => {
      setIsPlaying(false);
      speakWithWebSpeechFallback();
    });
  };

  const sizeClasses = {
    sm: 'p-1.5 text-xs',
    md: 'p-2.5 text-sm',
    lg: 'p-3.5 text-base',
  }[size];

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  }[size];

  const buttonTitle = title || (label ? `Listen: ${label}` : 'Listen to native Arabic pronunciation');
  const buttonAriaLabel = ariaLabel || title || 'Listen to pronunciation';

  return (
    <button
      type="button"
      onClick={handleSpeak}
      disabled={isLoadingTTS}
      className={`inline-flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer ${
        label ? 'rounded-full px-3 py-1 font-medium' : 'rounded-full'
      } ${
        isPlaying
          ? 'bg-[var(--accent-ochre)] text-[#121316] scale-105 shadow-md ring-2 ring-[var(--accent-ochre)]/40'
          : 'bg-[var(--bg-surface-elevated)] hover:bg-[var(--accent-ochre-dim)] text-[var(--accent-ochre)] border border-[var(--border-subtle)] hover:border-[var(--accent-ochre)]'
      } ${sizeClasses} ${className}`}
      title={buttonTitle}
      aria-label={buttonAriaLabel}
    >
      {isLoadingTTS ? (
        <Loader2 className={`${iconSizes} animate-spin`} />
      ) : (
        <Volume2 className={`${iconSizes} ${isPlaying ? 'animate-pulse' : ''}`} />
      )}
      {label && <span className="text-xs font-sans tracking-wide">{label}</span>}
    </button>
  );
};
