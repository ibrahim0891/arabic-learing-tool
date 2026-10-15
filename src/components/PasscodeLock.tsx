'use client';

import React, { useState } from 'react';
import { Lock, KeyRound, ArrowRight, ShieldCheck, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/Button';

interface PasscodeLockProps {
  onUnlocked: () => void;
}

export const PasscodeLock: React.FC<PasscodeLockProps> = ({ onUnlocked }) => {
  const [passcode, setPasscode] = useState('');
  const [showPasscode, setShowPasscode] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode: passcode.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Save in localStorage so user never has to re-type on this device
        try {
          localStorage.setItem('fasih_passcode', passcode.trim());
        } catch (_) {}
        onUnlocked();
      } else {
        setError(data.error || 'Incorrect passcode. Access denied.');
      }
    } catch (err: any) {
      // Local client check fallback
      if (passcode.trim() === 'kazimuhammadibrahim5033') {
        try {
          localStorage.setItem('fasih_passcode', passcode.trim());
        } catch (_) {}
        onUnlocked();
      } else {
        setError('Incorrect passcode. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-(--bg-primary) animate-fadeIn">
      <div className="w-full max-w-md p-8 sm:p-10 rounded-3xl bg-(--bg-surface) border border-(--border-subtle) shadow-2xl space-y-6 text-center">
        {/* Brand Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-(--accent-ochre) text-[#121316] font-bold flex items-center justify-center text-3xl font-arabic shadow-md">
          ف
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-(--accent-ochre)">
            <Lock className="w-3.5 h-3.5" /> Private App
          </div>
          <h1 className="editorial-title text-2xl sm:text-3xl font-semibold text-(--ink-primary)">
            Fasīh • <span className="font-arabic font-normal text-2xl text-(--accent-ochre)">فَصِيح</span>
          </h1>
          <p className="text-xs sm:text-sm text-(--ink-secondary) leading-relaxed max-w-xs mx-auto">
            This Arabic learning workspace is private. Enter your passcode to unlock your accountless dashboard.
          </p>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-(--accent-terracotta)/10 border border-(--accent-terracotta)/30 text-(--accent-terracotta) text-xs flex items-center gap-2 text-left animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-(--ink-muted)">
              <KeyRound className="w-4 h-4" />
            </div>
            <input
              type={showPasscode ? 'text' : 'password'}
              autoFocus
              required
              placeholder="Enter your private passcode"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              className="w-full pl-10 pr-11 py-3 rounded-xl bg-(--bg-surface-elevated) border border-(--border-subtle) text-(--ink-primary) text-sm focus:outline-none focus:ring-1 focus:ring-(--accent-ochre)"
            />
            <button
              type="button"
              onClick={() => setShowPasscode(!showPasscode)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-(--ink-muted) hover:text-(--ink-primary) transition cursor-pointer"
              title={showPasscode ? 'Hide passcode' : 'Show passcode'}
              aria-label={showPasscode ? 'Hide passcode' : 'Show passcode'}
            >
              {showPasscode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isSubmitting}
            disabled={!passcode.trim()}
            rightIcon={<ArrowRight className="w-4 h-4" />}
            className="w-full uppercase tracking-wider text-xs font-semibold py-3.5"
          >
            Unlock Fasīh
          </Button>
        </form>

        <div className="pt-2 text-[11px] text-(--ink-muted) flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-(--accent-cypress)" />
          <span>Protected personal Arabic learning tool</span>
        </div>
      </div>
    </div>
  );
};
