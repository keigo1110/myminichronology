import { describe, it, expect } from 'vitest';
import { getYearTickInterval, getYearTicks } from '../lib/yearTicks';
import { validateExcelFile, isXlsxFileName } from '../lib/fileValidation';

describe('yearTicks', () => {
  it('uses 10-year intervals for short spans', () => {
    expect(getYearTickInterval(2000, 2050)).toBe(10);
  });

  it('uses larger intervals for wide spans', () => {
    expect(getYearTickInterval(1, 2000)).toBe(100);
    expect(getYearTickInterval(1, 9000)).toBeGreaterThanOrEqual(250);
  });

  it('returns empty ticks for invalid ranges', () => {
    expect(getYearTicks(2100, 2000)).toEqual([]);
  });

  it('generates ticks within range', () => {
    const ticks = getYearTicks(2000, 2050);
    expect(ticks[0]).toBeGreaterThanOrEqual(2000);
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(2050);
  });
});

describe('fileValidation', () => {
  it('detects xlsx case-insensitively', () => {
    expect(isXlsxFileName('a.xlsx')).toBe(true);
    expect(isXlsxFileName('a.XLSX')).toBe(true);
    expect(isXlsxFileName('a.xls')).toBe(false);
  });

  it('rejects oversized files', () => {
    const file = new File(['x'], 'a.xlsx');
    Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    expect(validateExcelFile(file)).toMatch(/10MB/);
  });
});
