import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = 'light' | 'dark';

const palettes = {
  light: {
    background: '#F1F0F7',
    surface: '#FFFFFF',
    text: '#1C1C2E',
    subtle: '#7B7B96',
    border: '#E0DFF0',
    primary: '#EDEB80',
    primaryDark: '#E0DC5A',
    accent: '#6D4AFF',
    danger: '#B91C1C',
    dangerBackground: '#FEE2E2',
    success: '#15803D',
    muted: '#F3F1F8',
    softAccent: '#EEEAFE',
    softDanger: '#FCEBF0',
    softSuccess: '#E8F8EF',
    softWarning: '#FFFDE6',
    warning: '#936100',
    softInfo: '#EAE8F5',
    white: '#FFFFFF',
    onAccent: '#FFFFFF',
    onPrimary: '#1C1C2E',
  },
  dark: {
    background: '#14141F',
    surface: '#1D1D2B',
    text: '#F3F2FA',
    subtle: '#B5B4CA',
    border: '#39394D',
    primary: '#EDEB80',
    primaryDark: '#D5D05B',
    accent: '#A795FF',
    danger: '#FF8A91',
    dangerBackground: '#42252D',
    success: '#63D69A',
    muted: '#292938',
    softAccent: '#302B49',
    softDanger: '#432833',
    softSuccess: '#203A32',
    softWarning: '#3D361F',
    warning: '#F2D37D',
    softInfo: '#2A293A',
    white: '#FFFFFF',
    onAccent: '#FFFFFF',
    onPrimary: '#1C1C2E',
  },
} as const;

type ThemeColors = { -readonly [Key in keyof typeof palettes.light]: string };

export const colors: ThemeColors = { ...palettes.light };

const THEME_STORAGE_KEY = 'lume.theme';

interface ThemeContextValue {
  mode: ThemeMode;
  loading: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyPalette(mode: ThemeMode) {
  Object.assign(colors, palettes[mode]);
}

export function ThemeProvider({ children }: React.PropsWithChildren) {
  const [mode, setMode] = useState<ThemeMode>('light');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    SecureStore.getItemAsync(THEME_STORAGE_KEY)
      .then((storedMode) => {
        if (!active) return;
        const nextMode = storedMode === 'dark' ? 'dark' : 'light';
        applyPalette(nextMode);
        setMode(nextMode);
      })
      .catch((error: unknown) => {
        console.error('Não foi possível carregar a preferência de tema.', error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setMode((currentMode) => {
      const nextMode = currentMode === 'dark' ? 'light' : 'dark';
      applyPalette(nextMode);
      SecureStore.setItemAsync(THEME_STORAGE_KEY, nextMode)
        .catch((error: unknown) => {
          console.error('Não foi possível salvar a preferência de tema.', error);
        });
      return nextMode;
    });
  }, []);

  const value = useMemo(() => ({ mode, loading, toggleTheme }), [mode, loading, toggleTheme]);

  return React.createElement(ThemeContext.Provider, { value }, children);
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme deve ser usado dentro de ThemeProvider.');
  return context;
}
