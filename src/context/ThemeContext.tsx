'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemePalette = 'classic' | 'grass' | 'crimson';

interface ThemeContextType {
  themeMode: ThemeMode;
  palette: ThemePalette;
  resolvedTheme: 'light' | 'dark';
  setThemeMode: (mode: ThemeMode) => void;
  setPalette: (palette: ThemePalette) => void;
  toggleTheme: () => void;
  togglePalette: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'system',
  palette: 'classic',
  resolvedTheme: 'light',
  setThemeMode: () => {},
  setPalette: () => {},
  toggleTheme: () => {},
  togglePalette: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('system');
  const [palette, setPaletteState] = useState<ThemePalette>('classic');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');

  const getSystemTheme = useCallback((): 'light' | 'dark' => {
    if (typeof window === 'undefined') return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }, []);

  const applyTheme = useCallback(
    (mode: ThemeMode, pal: ThemePalette) => {
      const active = mode === 'system' ? getSystemTheme() : mode;
      setResolvedTheme(active);
      document.documentElement.setAttribute('data-theme', active);
      document.documentElement.setAttribute('data-palette', pal);
    },
    [getSystemTheme]
  );

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      setThemeModeState(mode);
      applyTheme(mode, palette);
      try {
        localStorage.setItem('fasih_theme', mode);
      } catch (_) {}
    },
    [applyTheme, palette]
  );

  const setPalette = useCallback(
    (newPalette: ThemePalette) => {
      setPaletteState(newPalette);
      applyTheme(themeMode, newPalette);
      try {
        localStorage.setItem('fasih_palette', newPalette);
      } catch (_) {}
    },
    [applyTheme, themeMode]
  );

  const toggleTheme = useCallback(() => {
    const nextMode: ThemeMode =
      themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    setThemeMode(nextMode);
  }, [themeMode, setThemeMode]);

  const togglePalette = useCallback(() => {
    const nextPalette: ThemePalette =
      palette === 'classic' ? 'grass' : palette === 'grass' ? 'crimson' : 'classic';
    setPalette(nextPalette);
  }, [palette, setPalette]);

  // Initial load from localStorage or fallback to defaults
  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('fasih_theme') as ThemeMode | null;
      const initialMode =
        savedMode === 'light' || savedMode === 'dark' || savedMode === 'system'
          ? savedMode
          : 'system';

      const savedPalette = localStorage.getItem('fasih_palette') as ThemePalette | null;
      const initialPalette =
        savedPalette === 'grass' || savedPalette === 'crimson' ? savedPalette : 'classic';

      setThemeModeState(initialMode);
      setPaletteState(initialPalette);
      applyTheme(initialMode, initialPalette);
    } catch (_) {
      applyTheme('system', 'classic');
    }
  }, [applyTheme]);

  // Realtime listener for OS color-scheme changes when in 'system' mode
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const currentMode = localStorage.getItem('fasih_theme');
      const currentPalette = (localStorage.getItem('fasih_palette') as ThemePalette) || 'classic';
      if (currentMode === 'system' || !currentMode) {
        const nextTheme = e.matches ? 'dark' : 'light';
        setResolvedTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
        document.documentElement.setAttribute('data-palette', currentPalette);
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        palette,
        resolvedTheme,
        setThemeMode,
        setPalette,
        toggleTheme,
        togglePalette,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
