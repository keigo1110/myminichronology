import type {
  Event,
  Lane,
  ParseResult,
  ParseWarning,
  EventDisplayStyle,
} from './types';
import {
  MAX_SHEETS,
  MAX_YEAR,
  MAX_YEAR_SPAN,
  MIN_YEAR,
  MAX_EVENTS,
  MAX_WORKSHEET_ROWS,
  MAX_EVENT_LABEL_LENGTH,
  MAX_TOTAL_EVENT_LABEL_LENGTH,
} from './fileValidation';
import { pushParseWarning } from './parseWarnings';
import { AppMessageError, isAppMessageError } from '../i18n/errors';

/** 未指定時のイベント色（黒） */
export const DEFAULT_EVENT_COLOR = '#000000';

/** フォントサイズの許容範囲（px） */
export const MIN_FONT_SIZE_PX = 8;
export const MAX_FONT_SIZE_PX = 48;

/** 画像 URL の最大長 */
export const MAX_IMAGE_URL_LENGTH = 2048;

/** 年表入力として解釈する列数（A〜G）。それ以降の列は利用者の補助情報として無視する。 */
const INPUT_COLUMN_COUNT = 7;

function isBlankCell(value: unknown): boolean {
  return value === undefined || value === null || String(value).trim() === '';
}

export function parseYearValue(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getFullYear();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Number.isInteger(value) ? value : null;
  }

  const asString = String(value).trim();
  if (!asString) {
    return null;
  }

  return /^\d{1,4}$/.test(asString) ? Number(asString) : null;
}

function isValidYear(year: number): boolean {
  return year >= MIN_YEAR && year <= MAX_YEAR;
}

/**
 * フォントサイズを px として解釈する。
 * 空欄は undefined（UI 側のデフォルトサイズ）。
 */
export function parseFontSizeValue(value: unknown): number | undefined | 'invalid' {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const text = String(value).trim();
  if (!text) return undefined;
  if (typeof value !== 'number' && !/^\d+(?:\.\d+)?\s*(?:px)?$/i.test(text)) return 'invalid';
  const num = typeof value === 'number' ? value : Number(text.replace(/\s*px$/i, ''));

  if (!Number.isFinite(num)) {
    return 'invalid';
  }

  const rounded = Math.round(num);
  if (rounded < MIN_FONT_SIZE_PX || rounded > MAX_FONT_SIZE_PX) {
    return 'invalid';
  }

  return rounded;
}

/**
 * 色を #RRGGBB に正規化する。
 * 空欄は undefined（呼び出し側で DEFAULT_EVENT_COLOR を適用）。
 */
export function parseColorValue(value: unknown): string | undefined | 'invalid' {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const raw = String(value).trim();
  if (!raw) {
    return undefined;
  }

  // #RGB / #RRGGBB
  const hex = raw.startsWith('#') ? raw : `#${raw}`;
  if (/^#[0-9A-Fa-f]{6}$/.test(hex)) {
    return hex.toUpperCase();
  }
  if (/^#[0-9A-Fa-f]{3}$/.test(hex)) {
    const [, r, g, b] = hex;
    return `#${r}${r}${g}${g}${b}${b}`.toUpperCase();
  }

  // rgb(r,g,b)
  const rgbMatch = raw.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/i);
  if (rgbMatch) {
    const channels = rgbMatch.slice(1, 4).map((n) => Number(n));
    if (channels.every((n) => n >= 0 && n <= 255)) {
      return `#${channels.map((n) => n.toString(16).padStart(2, '0')).join('')}`.toUpperCase();
    }
  }

  return 'invalid';
}

/**
 * F列の表示スタイル。
 * `label` / `ラベル` → 塗り付きラベルボックス。書字方向は画面で切替可能。空欄は default。
 */
export function parseDisplayStyleValue(
  value: unknown
): EventDisplayStyle | undefined | 'invalid' {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const normalized = String(value).trim().toLowerCase();
  if (!normalized) {
    return undefined;
  }

  if (normalized === 'label' || normalized === 'ラベル') {
    return 'label';
  }

  if (
    normalized === 'default' ||
    normalized === 'デフォルト' ||
    normalized === 'text' ||
    normalized === 'テキスト'
  ) {
    return 'default';
  }

  return 'invalid';
}

/**
 * G列の画像リンク。http/https のみ許可（XSS・巨大 data URI を避ける）。
 * http は混在コンテンツでブロックされるため https に格上げする。
 * 空欄は undefined。
 */
export function parseImageUrlValue(value: unknown): string | undefined | 'invalid' {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const raw = String(value).trim();
  if (!raw) {
    return undefined;
  }

  if (raw.length > MAX_IMAGE_URL_LENGTH) {
    return 'invalid';
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return 'invalid';
  }

  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    return url.href;
  }

  if (url.protocol !== 'https:') {
    return 'invalid';
  }

  return url.href;
}

function pushWarning(
  warnings: ParseWarning[],
  type: ParseWarning['type'],
  code: Parameters<typeof pushParseWarning>[2],
  params?: Parameters<typeof pushParseWarning>[3],
  sheet?: string,
  row?: number
) {
  pushParseWarning(warnings, type, code, params, sheet, row);
}

export async function parseExcelBuffer(buffer: ArrayBuffer): Promise<ParseResult> {
  const XLSX = await import('xlsx');
  const warnings: ParseWarning[] = [];

  try {
    const workbook = XLSX.read(buffer, {
      type: 'array', cellDates: true,
      sheets: Array.from({ length: MAX_SHEETS }, (_, index) => index),
      sheetRows: MAX_WORKSHEET_ROWS + 1,
    });

    const allSheetNames = workbook.SheetNames;
    const truncatedSheets = Math.max(0, allSheetNames.length - MAX_SHEETS);

    if (truncatedSheets > 0) {
      pushWarning(warnings, 'too-many-lanes', 'parse.tooManyLanes', {
        count: allSheetNames.length,
        max: MAX_SHEETS,
        skipped: truncatedSheets,
      });
    }

    const sheetNames = allSheetNames.slice(0, MAX_SHEETS);
    const lanes: Lane[] = [];
    let eventCount = 0;
    let labelLength = 0;

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        pushWarning(warnings, 'skipped-sheet', 'parse.skippedSheet', { sheet: sheetName }, sheetName);
        continue;
      }

      const ref = worksheet['!fullref'] ?? worksheet['!ref'];
      const usedRange = ref ? XLSX.utils.decode_range(ref) : null;
      if (usedRange && usedRange.e.r > MAX_WORKSHEET_ROWS) {
        throw new AppMessageError('parse.tooManyRows', { sheet: sheetName, max: MAX_WORKSHEET_ROWS });
      }
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: true,
        range: usedRange ? { s: { r: 0, c: 0 }, e: { r: usedRange.e.r, c: 6 } } : undefined,
      }) as unknown[][];

      if (jsonData.length < 2) {
        pushWarning(warnings, 'empty-sheet', 'parse.emptySheet', { sheet: sheetName }, sheetName);
        continue;
      }

      const events: Event[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 1;

        // 書式だけが設定された行や、H列以降に補助情報だけがある行は入力行ではない。
        // Excel の使用範囲（!ref）が広い場合も、空行を大量の必須項目エラーにしない。
        if (!row || row.slice(0, INPUT_COLUMN_COUNT).every(isBlankCell)) {
          continue;
        }

        if (row.length < 2) {
          pushWarning(
            warnings,
            'missing-columns',
            'parse.missingColumns',
            { sheet: sheetName, row: rowNumber },
            sheetName,
            rowNumber
          );
          continue;
        }

        const startYearRaw = row[0];
        const labelRaw = row[1];
        const endYearRaw = row[2];
        const fontSizeRaw = row[3];
        const colorRaw = row[4];
        const displayStyleRaw = row[5];
        const imageUrlRaw = row[6];

        if (isBlankCell(startYearRaw) || isBlankCell(labelRaw)) {
          pushWarning(
            warnings,
            'missing-columns',
            'parse.missingRequired',
            { sheet: sheetName, row: rowNumber },
            sheetName,
            rowNumber
          );
          continue;
        }

        const start = parseYearValue(startYearRaw);
        if (start === null || !isValidYear(start)) {
          pushWarning(
            warnings,
            'invalid-year',
            'parse.invalidStartYear',
            {
              sheet: sheetName,
              row: rowNumber,
              value: String(startYearRaw),
              min: MIN_YEAR,
              max: MAX_YEAR,
            },
            sheetName,
            rowNumber
          );
          continue;
        }

        const label = String(labelRaw).trim();
        if (label.length > MAX_EVENT_LABEL_LENGTH) {
          throw new AppMessageError('parse.labelTooLong', {
            sheet: sheetName, row: rowNumber, max: MAX_EVENT_LABEL_LENGTH,
          });
        }
        labelLength += label.length;
        if (labelLength > MAX_TOTAL_EVENT_LABEL_LENGTH) {
          throw new AppMessageError('parse.tooMuchText', { max: MAX_TOTAL_EVENT_LABEL_LENGTH });
        }
        eventCount += 1;
        if (eventCount > MAX_EVENTS) {
          throw new AppMessageError('parse.tooManyEvents', { max: MAX_EVENTS });
        }

        let end: number | undefined;
        if (endYearRaw !== undefined && endYearRaw !== null && endYearRaw !== '') {
          const endNum = parseYearValue(endYearRaw);
          if (endNum === null || !isValidYear(endNum)) {
            pushWarning(
              warnings,
              'invalid-year',
              'parse.invalidEndYear',
              { sheet: sheetName, row: rowNumber, value: String(endYearRaw) },
              sheetName,
              rowNumber
            );
          } else if (endNum < start) {
            pushWarning(
              warnings,
              'year-order',
              'parse.yearOrder',
              { sheet: sheetName, row: rowNumber },
              sheetName,
              rowNumber
            );
          } else {
            end = endNum;
          }
        }

        const fontSizeParsed = parseFontSizeValue(fontSizeRaw);
        let fontSize: number | undefined;
        if (fontSizeParsed === 'invalid') {
          pushWarning(
            warnings,
            'invalid-style',
            'parse.invalidFontSize',
            {
              sheet: sheetName,
              row: rowNumber,
              value: String(fontSizeRaw),
              min: MIN_FONT_SIZE_PX,
              max: MAX_FONT_SIZE_PX,
            },
            sheetName,
            rowNumber
          );
        } else {
          fontSize = fontSizeParsed;
        }

        const colorParsed = parseColorValue(colorRaw);
        let color: string | undefined;
        if (colorParsed === 'invalid') {
          pushWarning(
            warnings,
            'invalid-style',
            'parse.invalidColor',
            { sheet: sheetName, row: rowNumber, value: String(colorRaw) },
            sheetName,
            rowNumber
          );
          color = DEFAULT_EVENT_COLOR;
        } else {
          color = colorParsed ?? DEFAULT_EVENT_COLOR;
        }

        const styleParsed = parseDisplayStyleValue(displayStyleRaw);
        let displayStyle: EventDisplayStyle | undefined;
        if (styleParsed === 'invalid') {
          pushWarning(
            warnings,
            'invalid-style',
            'parse.invalidStyle',
            { sheet: sheetName, row: rowNumber, value: String(displayStyleRaw) },
            sheetName,
            rowNumber
          );
        } else if (styleParsed && styleParsed !== 'default') {
          displayStyle = styleParsed;
        }

        const imageParsed = parseImageUrlValue(imageUrlRaw);
        let imageUrl: string | undefined;
        if (imageParsed === 'invalid') {
          pushWarning(
            warnings,
            'invalid-style',
            'parse.invalidImageUrl',
            { sheet: sheetName, row: rowNumber, value: String(imageUrlRaw).slice(0, 80) },
            sheetName,
            rowNumber
          );
        } else {
          imageUrl = imageParsed;
        }

        events.push({
          start,
          end,
          label,
          fontSize,
          color,
          displayStyle,
          imageUrl,
        });
      }

      if (events.length > 0) {
        lanes.push({ name: sheetName, events });
      } else {
        pushWarning(
          warnings,
          'empty-sheet',
          'parse.emptySheetNoEvents',
          { sheet: sheetName },
          sheetName
        );
      }
    }

    if (lanes.length === 0) {
      throw new AppMessageError('parse.noValidData');
    }

    let minYear = Infinity;
    let maxYear = -Infinity;
    lanes.forEach((lane) => {
      lane.events.forEach((event) => {
        minYear = Math.min(minYear, event.start);
        maxYear = Math.max(maxYear, event.end ?? event.start);
      });
    });

    if (maxYear - minYear > MAX_YEAR_SPAN) {
      throw new AppMessageError('parse.yearSpanTooWide', {
        min: minYear,
        max: maxYear,
        maxSpan: MAX_YEAR_SPAN,
      });
    }

    return { lanes, warnings, truncatedSheets };
  } catch (error) {
    if (isAppMessageError(error)) {
      throw error;
    }
    if (error instanceof Error) {
      throw new AppMessageError('parse.failed', { detail: error.message });
    }
    throw new AppMessageError('parse.failedGeneric');
  }
}
