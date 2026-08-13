import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  LABEL_ORIENTATION_STORAGE_KEY,
  parseEventLabelOrientation,
  readEventLabelOrientationPreference,
  writeEventLabelOrientationPreference,
} from '../lib/labelOrientationPreference';

describe('event label orientation preference', () => {
  afterEach(() => {
    window.localStorage.removeItem(LABEL_ORIENTATION_STORAGE_KEY);
    vi.restoreAllMocks();
  });

  it('accepts only supported values', () => {
    expect(parseEventLabelOrientation('vertical')).toBe('vertical');
    expect(parseEventLabelOrientation('horizontal')).toBe('horizontal');
    expect(parseEventLabelOrientation('sideways')).toBeNull();
    expect(parseEventLabelOrientation(null)).toBeNull();
  });

  it('persists and restores the selected orientation', () => {
    writeEventLabelOrientationPreference('horizontal');
    expect(readEventLabelOrientationPreference()).toBe('horizontal');
  });

  it('falls back safely when storage access fails', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('blocked');
    });
    expect(readEventLabelOrientationPreference()).toBe('vertical');
  });
});
