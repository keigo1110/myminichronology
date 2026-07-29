import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseExcel } from '../lib/parseExcel';

function createWorkbookFile(
  sheets: Record<string, unknown[][]>,
  fileName = 'test.xlsx'
): File {
  const workbook = XLSX.utils.book_new();

  Object.entries(sheets).forEach(([name, rows]) => {
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  const buffer = XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
  return new File([buffer], fileName, {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

describe('parseExcel', () => {
  it('should parse valid Excel file with point events', async () => {
    const file = createWorkbookFile({
      政治: [
        ['年', 'いつまで', '出来事'],
        [2020, null, 'オリンピック延期'],
        [2011, null, '東日本大震災'],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes).toHaveLength(1);
    expect(result.lanes[0].name).toBe('政治');
    expect(result.lanes[0].events).toHaveLength(2);
    expect(result.lanes[0].events[0]).toMatchObject({
      start: 2020,
      label: 'オリンピック延期',
    });
    expect(result.lanes[0].events[0].end).toBeUndefined();
  });

  it('should parse valid Excel file with range events', async () => {
    const file = createWorkbookFile({
      経済: [
        ['年', 'いつまで', '出来事'],
        [2008, 2009, 'リーマンショック'],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes[0].events[0]).toEqual({
      start: 2008,
      end: 2009,
      label: 'リーマンショック',
    });
  });

  it('should warn and skip rows with missing required columns', async () => {
    const file = createWorkbookFile({
      政治: [
        ['年', 'いつまで', '出来事'],
        [2020, null, '有効'],
        [null, null, 'ラベルのみ'],
        [2021, null, null],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes[0].events).toHaveLength(1);
    expect(result.warnings.some((w) => w.type === 'missing-columns')).toBe(true);
  });

  it('should warn and skip invalid year values', async () => {
    const file = createWorkbookFile({
      政治: [
        ['年', 'いつまで', '出来事'],
        ['abc', null, '無効な年'],
        [0, null, 'ゼロ年'],
        [10000, null, '範囲外'],
        [2020, null, '有効'],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes[0].events).toHaveLength(1);
    expect(result.lanes[0].events[0].label).toBe('有効');
    expect(result.warnings.some((w) => w.type === 'invalid-year')).toBe(true);
  });

  it('should truncate sheets beyond 5 and warn', async () => {
    const sheets: Record<string, unknown[][]> = {};
    for (let i = 1; i <= 7; i++) {
      sheets[`Sheet${i}`] = [
        ['年', 'いつまで', '出来事'],
        [2000 + i, null, `イベント${i}`],
      ];
    }

    const result = await parseExcel(createWorkbookFile(sheets));
    expect(result.lanes).toHaveLength(5);
    expect(result.truncatedSheets).toBe(2);
    expect(result.warnings.some((w) => w.type === 'too-many-lanes')).toBe(true);
  });

  it('should reject files with no valid data', async () => {
    const file = createWorkbookFile({
      空: [['年', 'いつまで', '出来事']],
    });

    await expect(parseExcel(file)).rejects.toThrow(/有効なデータ/);
  });
});
