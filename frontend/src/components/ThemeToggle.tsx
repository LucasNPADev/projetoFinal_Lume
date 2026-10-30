import React, { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

function getStoredTheme(): Theme {
  try {
    return window.localStorage.getItem('lume-theme') === 'dark' ? 'dark' : 'light';
  } catch (error) {
    console.error('Não foi possível ler a preferência de tema salva.', error);
    return 'light';
  }
}

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      window.localStorage.setItem('lume-theme', theme);
    } catch (error) {
      console.error('Não foi possível salvar a preferência de tema.', error);
    }
  }, [theme]);

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-label={isDark ? 'Ativar modo claro' : 'Ativar modo escuro'}
      aria-pressed={isDark}
      onClick={() => setTheme(current => current === 'dark' ? 'light' : 'dark')}
    >
      <span aria-hidden="true">{isDark ? '☀️' : '🌙'}</span>
      <span className="theme-toggle__label">{isDark ? 'Modo claro' : 'Modo escuro'}</span>
    </button>
  );
};
