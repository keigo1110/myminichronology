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
        ['年', '出来事', '(いつまで)'],
        [2020, 'オリンピック延期', null],
        [2011, '東日本大震災', null],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes).toHaveLength(1);
    expect(result.lanes[0].name).toBe('政治');
    expect(result.lanes[0].events).toHaveLength(2);
    expect(result.lanes[0].events[0]).toMatchObject({
      start: 2020,
      label: 'オリンピック延期',
      color: '#000000',
    });
    expect(result.lanes[0].events[0].end).toBeUndefined();
    expect(result.lanes[0].events[0].fontSize).toBeUndefined();
  });

  it('should parse valid Excel file with range events', async () => {
    const file = createWorkbookFile({
      経済: [
        ['年', '出来事', '(いつまで)'],
        [2008, 'リーマンショック', 2009],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes[0].events[0]).toEqual({
      start: 2008,
      end: 2009,
      label: 'リーマンショック',
      color: '#000000',
    });
  });

  it('should parse display style label column', async () => {
    const file = createWorkbookFile({
      政治: [
        ['年', '出来事', '(いつまで)', 'フォントサイズ', '色', '表示スタイル'],
        [1950, 'ラベル期間', 1980, 13, '#C45C26', 'label'],
        [1960, '日本語指定', null, null, '#1565C0', 'ラベル'],
        [1970, '通常', null, null, null, null],
        [1980, '無効', null, null, null, 'box'],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes[0].events[0]).toMatchObject({
      label: 'ラベル期間',
      displayStyle: 'label',
      fontSize: 13,
      color: '#C45C26',
    });
    expect(result.lanes[0].events[1]).toMatchObject({
      label: '日本語指定',
      displayStyle: 'label',
    });
    expect(result.lanes[0].events[2].displayStyle).toBeUndefined();
    expect(result.lanes[0].events[3].displayStyle).toBeUndefined();
    expect(result.warnings.some((w) => w.code === 'parse.invalidStyle')).toBe(true);
  });

  it('should parse font size and color columns', async () => {
    const file = createWorkbookFile({
      政治: [
        ['年', '出来事', '(いつまで)', 'フォントサイズ', '色'],
        [2020, '指定あり', null, 14, '#C45C26'],
        [2021, '色のみ', null, null, '1565C0'],
        [2022, 'サイズのみ', null, 12, null],
        [2023, '無効スタイル', null, 99, 'not-a-color'],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes[0].events[0]).toMatchObject({
      label: '指定あり',
      fontSize: 14,
      color: '#C45C26',
    });
    expect(result.lanes[0].events[1]).toMatchObject({
      label: '色のみ',
      color: '#1565C0',
    });
    expect(result.lanes[0].events[1].fontSize).toBeUndefined();
    expect(result.lanes[0].events[2]).toMatchObject({
      label: 'サイズのみ',
      fontSize: 12,
      color: '#000000',
    });
    expect(result.lanes[0].events[3]).toMatchObject({
      label: '無効スタイル',
      color: '#000000',
    });
    expect(result.lanes[0].events[3].fontSize).toBeUndefined();
    expect(result.warnings.filter((w) => w.type === 'invalid-style')).toHaveLength(2);
  });

  it('should warn and skip rows with missing required columns', async () => {
    const file = createWorkbookFile({
      政治: [
        ['年', '出来事', '(いつまで)'],
        [2020, '有効', null],
        [null, 'ラベルのみ', null],
        [2021, null, null],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes[0].events).toHaveLength(1);
    expect(result.warnings.some((w) => w.type === 'missing-columns')).toBe(true);
  });

  it('should silently ignore rows with no input in columns A through G', async () => {
    const file = createWorkbookFile({
      政治: [
        ['年', '出来事', '(いつまで)', 'フォントサイズ', '色', '表示スタイル', '画像リンク', 'メモ'],
        [2020, '有効', null, null, null, null, null, null],
        [null, null, null, null, null, null, null, '年表入力ではない補助情報'],
        [null, null, null, null, null, null, null, null],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes[0].events).toHaveLength(1);
    expect(result.warnings.filter((warning) => warning.type === 'missing-columns')).toHaveLength(0);
  });

  it('should warn and skip invalid year values', async () => {
    const file = createWorkbookFile({
      政治: [
        ['年', '出来事', '(いつまで)'],
        ['abc', '無効な年', null],
        [0, 'ゼロ年', null],
        [10000, '範囲外', null],
        [2020, '有効', null],
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
        ['年', '出来事', '(いつまで)'],
        [2000 + i, `イベント${i}`, null],
      ];
    }

    const result = await parseExcel(createWorkbookFile(sheets));
    expect(result.lanes).toHaveLength(5);
    expect(result.truncatedSheets).toBe(2);
    expect(result.warnings.some((w) => w.type === 'too-many-lanes')).toBe(true);
  });

  it('should reject files with no valid data', async () => {
    const file = createWorkbookFile({
      空: [['年', '出来事', '(いつまで)']],
    });

    await expect(parseExcel(file)).rejects.toThrow(/parse\.noValidData/);
  });

  it('should parse image URL column (G)', async () => {
    const file = createWorkbookFile({
      文化: [
        ['年', '出来事', '(いつまで)', 'フォントサイズ', '色', '表示スタイル', '画像リンク'],
        [1964, '五輪', null, null, '#1565C0', null, 'https://placehold.co/96x72/png'],
        [1970, '万博', null, null, null, null, null],
        [1980, '無効', null, null, null, null, 'javascript:alert(1)'],
        [1990, 'data拒否', null, null, null, null, 'data:image/png;base64,AAAA'],
        [1995, 'http格上げ', null, null, null, null, 'http://placehold.co/96x72/png'],
      ],
    });

    const result = await parseExcel(file);
    expect(result.lanes[0].events[0].imageUrl).toBe('https://placehold.co/96x72/png');
    expect(result.lanes[0].events[1].imageUrl).toBeUndefined();
    expect(result.lanes[0].events[2].imageUrl).toBeUndefined();
    expect(result.lanes[0].events[3].imageUrl).toBeUndefined();
    // http は混在コンテンツを避けるため https に格上げして受け入れる
    expect(result.lanes[0].events[4].imageUrl).toBe('https://placehold.co/96x72/png');
    expect(
      result.warnings.filter((w) => w.code === 'parse.invalidImageUrl').length
    ).toBeGreaterThanOrEqual(2);
  });
});
