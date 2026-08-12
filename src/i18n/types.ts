export type Locale = 'ja' | 'en';

export type MessageParams = Record<string, string | number>;

/** `{name}` プレースホルダを置換 */
export function formatMessage(template: string, params?: MessageParams): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    params[key] !== undefined && params[key] !== null ? String(params[key]) : `{${key}}`
  );
}
