'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { ThemeProvider as MuiThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createAppTheme } from '../theme/createAppTheme';
import { LocaleProvider } from '../i18n/LocaleProvider';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';

type ColorMode = 'light' | 'dark';

interface ColorModeContextValue {
  mode: ColorMode;
  toggleColorMode: () => void;
  setColorMode: (mode: ColorMode) => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: 'light',
  toggleColorMode: () => {},
  setColorMode: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}

const STORAGE_KEY = 'minikuro-color-mode';

/**
 * SSR とクライアント初回描画は常に同じ値（light）にする。
 * localStorage / data-color-mode はマウント後にだけ読む（ハイドレーション不一致防止）。
 */
function readStoredMode(): ColorMode {
  if (typeof window === 'undefined') return 'light';
  try {
    const attr = document.documentElement.getAttribute('data-color-mode');
    if (attr === 'light' || attr === 'dark') return attr;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch {
    // ignore
  }
  return 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<ColorMode>('light');
  const [ready, setReady] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setMode(readStoredMode());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.setAttribute('data-color-mode', mode);
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode, ready]);

  const setColorMode = useCallback((next: ColorMode) => {
    setMode(next);
  }, []);

  const toggleColorMode = useCallback(() => {
    setMode((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const theme = useMemo(() => createAppTheme(mode), [mode]);

  const contextValue = useMemo(
    () => ({ mode, toggleColorMode, setColorMode }),
    [mode, toggleColorMode, setColorMode]
  );

  return (
    <ColorModeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        <LocaleProvider>{children}</LocaleProvider>
      </MuiThemeProvider>
    </ColorModeContext.Provider>
  );
}
