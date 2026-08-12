'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { detectBrowserLocale, translate } from './index';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';
import type { Locale, MessageParams } from './types';
import type { MessageKey } from './messages';

const STORAGE_KEY = 'minikuro-locale';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: MessageKey, params?: MessageParams) => string;
}

const LocaleContext = createContext<LocaleContextValue>({
  locale: 'ja',
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key) => key,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function useT() {
  return useLocale().t;
}

/**
 * SSR とクライアント初回描画は常に ja。
 * 保存ロケールはマウント後にだけ適用する。
 */
function readStoredLocale(): Locale {
  if (typeof window === 'undefined') return 'ja';
  try {
    const attr = document.documentElement.getAttribute('data-locale');
    if (attr === 'ja' || attr === 'en') return attr;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'ja' || stored === 'en') return stored;
    return detectBrowserLocale();
  } catch {
    return 'ja';
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ja');
  const [ready, setReady] = useState(false);

  useIsomorphicLayoutEffect(() => {
    setLocaleState(readStoredLocale());
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const resolved = locale === 'en' ? 'en' : 'ja';
    document.documentElement.lang = resolved;
    document.documentElement.setAttribute('data-locale', resolved);
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      // ignore
    }
  }, [locale, ready]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const toggleLocale = useCallback(() => {
    setLocaleState((prev) => (prev === 'ja' ? 'en' : 'ja'));
  }, []);

  const t = useCallback(
    (key: MessageKey, params?: MessageParams) => translate(locale, key, params),
    [locale]
  );

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale, t }),
    [locale, setLocale, toggleLocale, t]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export { LocaleContext };
