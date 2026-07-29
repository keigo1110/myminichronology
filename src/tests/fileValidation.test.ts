import { describe, it, expect } from 'vitest';
import { getYearTickInterval, getYearTicks, formatYearLabel } from '../lib/yearTicks';
import { validateExcelFile, isXlsxFileName } from '../lib/fileValidation';

describe('yearTicks', () => {
  it('uses 1-year intervals for short spans', () => {
    expect(getYearTickInterval(2000, 2020)).toBe(1);
  });

  it('uses larger intervals for wide spans', () => {
    expect(getYearTickInterval(1, 2000)).toBe(50);
    expect(getYearTickInterval(1, 9000)).toBeGreaterThanOrEqual(100);
  });

  it('returns empty ticks for invalid ranges', () => {
    expect(getYearTicks(2100, 2000)).toEqual([]);
  });

  it('generates ticks within range', () => {
    const ticks = getYearTicks(2000, 2050);
    expect(ticks[0]).toBeGreaterThanOrEqual(2000);
    expect(ticks[ticks.length - 1]).toBeLessThanOrEqual(2050);
  });

  it('formats dense year labels as two digits', () => {
    expect(formatYearLabel(1985, 1)).toBe('85');
    expect(formatYearLabel(1990, 1)).toBe('1990');
    expect(formatYearLabel(2000, 10)).toBe('2000');
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
