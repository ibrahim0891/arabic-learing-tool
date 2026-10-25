import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('fasih_theme');
                  var p = localStorage.getItem('fasih_palette') || 'classic';
                  var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches) || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
                  document.documentElement.setAttribute('data-palette', p);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <StatsProvider>
            <AppShell>{children}</AppShell>
          </StatsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
