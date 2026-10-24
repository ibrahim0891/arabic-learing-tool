import type { Metadata } from 'next';
import './globals.css';
import { StatsProvider } from '@/context/StatsContext';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Fasīh (فَصِيح) - AI-Powered Arabic Vocabulary Tutor',
  description: 'Master Arabic vocabulary with AI-generated situational word sets, SM-2 spaced repetition flashcards, and interactive tests.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning>
        <StatsProvider>
          <AppShell>{children}</AppShell>
        </StatsProvider>
      </body>
    </html>
  );
}
