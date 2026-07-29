import { catalogs, type MessageKey } from './messages';
import { formatMessage, type Locale, type MessageParams } from './types';

export function translate(
  locale: Locale,
  key: MessageKey,
  params?: MessageParams
): string {
  const template = catalogs[locale][key] ?? catalogs.ja[key] ?? key;
  return formatMessage(template, params);
}

export function detectBrowserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'ja';
  try {
    const lang = (navigator.language || '').toLowerCase();
    if (lang.startsWith('en')) return 'en';
  } catch {
    // ignore
  }
  return 'ja';
}

export type { MessageKey, Locale, MessageParams };
export { formatMessage } from './types';
export { catalogs, jaMessages, enMessages } from './messages';
