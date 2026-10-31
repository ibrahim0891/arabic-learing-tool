'use client';

import React, { useState } from 'react';
import { Volume2, Loader2 } from 'lucide-react';

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

  // Last-resort fallback: on-device Web Speech API (OS voices)
  const speakWithWebSpeechFallback = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(arabicText);
    utterance.lang = 'ar-EG';
    utterance.rate = 0.85;

    const voices = window.speechSynthesis.getVoices();
    // Prefer the regional voices the server normally uses before accepting any Arabic voice.
    const preferredLocales = ['ar-EG', 'ar-SA', 'ar-SY'];
    const arabicVoice =
      preferredLocales
        .map((locale) => voices.find((v) => v.lang.replace('_', '-').startsWith(locale)))
        .find(Boolean) ??
      voices.find((v) => v.lang.startsWith('ar') || v.name.toLowerCase().includes('arabic'));
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

    // Tier 1: Microsoft Edge neural voices via /api/tts (natural Arabic)
    setIsLoadingTTS(true);
    try {
      const audioUrl = `/api/tts?text=${encodeURIComponent(trimmedText)}`;
      const res = await fetch(audioUrl);

      if (!res.ok) {
        throw new Error(`TTS server responded with ${res.status}`);
      }

      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      // Cache for instant replays without network lag
      audioCache.set(trimmedText, objectUrl);

      playAudioBlobUrl(objectUrl);
    } catch (err) {
      console.warn('Neural TTS unavailable, using browser Web Speech API fallback:', err);
      // Tier 2: Automatic fallback to the device's own voices
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
          ? 'bg-[#9a5d16] text-white scale-105 shadow-md ring-2 ring-[#9a5d16]/40'
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
