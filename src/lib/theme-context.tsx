'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  backgroundGradient: string;
  text: string;
  secondaryText: string;
  panelBackground: string;
  panelBorder: string;
  cardBackground: string;
  cardBorder: string;
  brandText: string;
  navLinkText: string;
  navLinkBackground: string;
  navLinkBorder: string;
  accentPrimary: string;
  accentPrimaryLight: string;
  accentSecondary: string;
  accentSecondaryLight: string;
  glowColor1: string;
  glowColor2: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  useEffect(() => {
    const stored = localStorage.getItem('blog-theme') as Theme | null;
    const preferred = stored || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(preferred);
    document.documentElement.setAttribute('data-theme', preferred);
  }, []);

  useEffect(() => {
    localStorage.setItem('blog-theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme deve ser usado dentro de ThemeProvider');
  }
  return context;
}

export const lightTheme: ThemeColors = {
  background: '#ffffff',
  backgroundGradient: 'linear-gradient(180deg, #f8f1e8 0%, #fdfaf6 46%, #f4eadf 100%)',
  text: '#201A16',
  secondaryText: '#5F564E',
  panelBackground: 'rgba(255, 251, 245, 0.8)',
  panelBorder: 'rgba(79, 55, 38, 0.12)',
  cardBackground: 'rgba(255, 251, 245, 0.82)',
  cardBorder: 'rgba(79, 55, 38, 0.12)',
  brandText: '#201A16',
  navLinkText: '#5F564E',
  navLinkBackground: 'rgba(255,255,255,0.56)',
  navLinkBorder: 'rgba(79, 55, 38, 0.12)',
  accentPrimary: '#A14D26',
  accentPrimaryLight: 'rgba(161, 77, 38, 0.08)',
  accentSecondary: '#155E63',
  accentSecondaryLight: 'rgba(21, 94, 99, 0.08)',
  glowColor1: 'rgba(212,108,54,0.18)',
  glowColor2: 'rgba(32,125,127,0.16)',
};

export const darkTheme: ThemeColors = {
  background: '#0f0a07',
  backgroundGradient: 'linear-gradient(180deg, #1a1410 0%, #0f0a07 46%, #1a1410 100%)',
  text: '#f5f0ea',
  secondaryText: '#c4b8b0',
  panelBackground: 'rgba(30, 25, 20, 0.6)',
  panelBorder: 'rgba(200, 180, 160, 0.12)',
  cardBackground: 'rgba(30, 25, 20, 0.5)',
  cardBorder: 'rgba(200, 180, 160, 0.12)',
  brandText: '#f5f0ea',
  navLinkText: '#c4b8b0',
  navLinkBackground: 'rgba(50, 40, 30, 0.6)',
  navLinkBorder: 'rgba(200, 180, 160, 0.12)',
  accentPrimary: '#e8a566',
  accentPrimaryLight: 'rgba(232, 165, 102, 0.12)',
  accentSecondary: '#4fb8c0',
  accentSecondaryLight: 'rgba(79, 184, 192, 0.12)',
  glowColor1: 'rgba(232, 165, 102, 0.12)',
  glowColor2: 'rgba(79, 184, 192, 0.12)',
};

export function getThemeColors(theme: Theme): ThemeColors {
  return theme === 'light' ? lightTheme : darkTheme;
}
