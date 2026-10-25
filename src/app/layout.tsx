import type { Metadata } from 'next';
import './globals.css';
import { StatsProvider } from '@/context/StatsContext';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'Al-Muʿallim (المُعَلِّم) - AI-Powered Arabic Language Tutor',
  description: 'Master Arabic vocabulary and conversation with Al-Muʿallim: AI-generated situational word sets, SM-2 spaced repetition flashcards, and interactive dialogues.',
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
