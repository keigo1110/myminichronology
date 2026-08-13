import type { EventLabelOrientation } from './types';

export const LABEL_ORIENTATION_STORAGE_KEY =
  'minikuro-event-label-orientation:v1';

export function parseEventLabelOrientation(
  value: string | null
): EventLabelOrientation | null {
  return value === 'vertical' || value === 'horizontal' ? value : null;
}

export function readEventLabelOrientationPreference(): EventLabelOrientation {
  if (typeof window === 'undefined') return 'vertical';

  try {
    return (
      parseEventLabelOrientation(
        window.localStorage.getItem(LABEL_ORIENTATION_STORAGE_KEY)
      ) ?? 'vertical'
    );
  } catch {
    return 'vertical';
  }
}

export function writeEventLabelOrientationPreference(
  orientation: EventLabelOrientation
): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(LABEL_ORIENTATION_STORAGE_KEY, orientation);
  } catch {
    // プライベートブラウズや保存領域無効時も表示切替自体は継続する。
  }
}
