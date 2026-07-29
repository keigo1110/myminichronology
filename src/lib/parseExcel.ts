import type { TimelineData, Event, Lane, ParseResult, ParseWarning, ParseErrorType } from './types';
import {
  MAX_SHEETS,
  MAX_YEAR,
  MAX_YEAR_SPAN,
  MIN_YEAR,
} from './fileValidation';

/** 未指定時のイベント塗り色（黒） */
export const DEFAULT_EVENT_COLOR = '#000000';

/** フォントサイズの許容範囲（px） */
export const MIN_FONT_SIZE_PX = 8;
export const MAX_FONT_SIZE_PX = 48;

function parseYearValue(value: unknown): number | null {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.getFullYear();
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  const asString = String(value).trim();
  if (!asString) {
    return null;
  }

  const asNumber = Number(asString);
  if (Number.isFinite(asNumber) && asNumber > 20000 && asNumber < 60000) {
    const excelEpoch = Date.UTC(1899, 11, 30);
    const date = new Date(excelEpoch + asNumber * 86400000);
    if (!Number.isNaN(date.getTime())) {
      return date.getFullYear();
    }
  }

  const parsed = parseInt(asString, 10);
  if (Number.isNaN(parsed)) {
    return null;
  }

  return parsed;
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

  const num =
    typeof value === 'number' ? value : parseFloat(String(value).trim().replace(/px$/i, ''));

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

async function readFileAsArrayBuffer(file: Blob): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') {
    return file.arrayBuffer();
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error ?? new Error('ファイルの読み込みに失敗しました。'));
    reader.readAsArrayBuffer(file);
  });
}

function pushWarning(
  warnings: ParseWarning[],
  type: ParseErrorType,
  message: string,
  sheet?: string,
  row?: number
) {
  warnings.push({ type, message, sheet, row });
}

export async function parseExcel(file: File): Promise<ParseResult> {
  const XLSX = await import('xlsx');
  const warnings: ParseWarning[] = [];

  try {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    const allSheetNames = workbook.SheetNames;
    const truncatedSheets = Math.max(0, allSheetNames.length - MAX_SHEETS);

    if (truncatedSheets > 0) {
      pushWarning(
        warnings,
        'too-many-lanes',
        `シートが${allSheetNames.length}件あります。先頭${MAX_SHEETS}件のみ読み込みました（${truncatedSheets}件をスキップ）。`
      );
    }

    const sheetNames = allSheetNames.slice(0, MAX_SHEETS);
    const lanes: Lane[] = [];

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        pushWarning(
          warnings,
          'skipped-sheet',
          `シート「${sheetName}」は読み込めませんでした（チャートシート等）。`,
          sheetName
        );
        continue;
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: false,
      }) as unknown[][];

      if (jsonData.length < 2) {
        pushWarning(
          warnings,
          'empty-sheet',
          `シート「${sheetName}」にデータ行がありません。`,
          sheetName
        );
        continue;
      }

      const events: Event[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 1;

        if (!row || row.length < 3) {
          if (row && row.some((cell) => cell !== null && cell !== undefined && cell !== '')) {
            pushWarning(
              warnings,
              'missing-columns',
              `シート「${sheetName}」${rowNumber}行目: 列が不足しているためスキップしました。`,
              sheetName,
              rowNumber
            );
          }
          continue;
        }

        const startYearRaw = row[0];
        const endYearRaw = row[1];
        const labelRaw = row[2];
        const fontSizeRaw = row[3];
        const colorRaw = row[4];

        if (
          startYearRaw === undefined ||
          startYearRaw === null ||
          startYearRaw === '' ||
          labelRaw === undefined ||
          labelRaw === null ||
          String(labelRaw).trim() === ''
        ) {
          pushWarning(
            warnings,
            'missing-columns',
            `シート「${sheetName}」${rowNumber}行目: 開始年または出来事が空のためスキップしました。`,
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
            `シート「${sheetName}」${rowNumber}行目: 開始年「${String(startYearRaw)}」が無効です（${MIN_YEAR}〜${MAX_YEAR}）。`,
            sheetName,
            rowNumber
          );
          continue;
        }

        let end: number | undefined;
        if (endYearRaw !== undefined && endYearRaw !== null && endYearRaw !== '') {
          const endNum = parseYearValue(endYearRaw);
          if (endNum === null || !isValidYear(endNum)) {
            pushWarning(
              warnings,
              'invalid-year',
              `シート「${sheetName}」${rowNumber}行目: 終了年「${String(endYearRaw)}」が無効なため点イベントとして扱います。`,
              sheetName,
              rowNumber
            );
          } else if (endNum < start) {
            pushWarning(
              warnings,
              'year-order',
              `シート「${sheetName}」${rowNumber}行目: 終了年が開始年より前のため点イベントとして扱います。`,
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
            `シート「${sheetName}」${rowNumber}行目: フォントサイズ「${String(fontSizeRaw)}」が無効です（${MIN_FONT_SIZE_PX}〜${MAX_FONT_SIZE_PX}）。デフォルトを使います。`,
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
            `シート「${sheetName}」${rowNumber}行目: 色「${String(colorRaw)}」が無効です（例: #C45C26）。黒を使います。`,
            sheetName,
            rowNumber
          );
          color = DEFAULT_EVENT_COLOR;
        } else {
          color = colorParsed ?? DEFAULT_EVENT_COLOR;
        }

        events.push({
          start,
          end,
          label: String(labelRaw).trim(),
          fontSize,
          color,
        });
      }

      if (events.length > 0) {
        lanes.push({ name: sheetName, events });
      } else {
        pushWarning(
          warnings,
          'empty-sheet',
          `シート「${sheetName}」から有効なイベントを読み取れませんでした。`,
          sheetName
        );
      }
    }

    if (lanes.length === 0) {
      throw new Error('有効なデータが見つかりませんでした。年・出来事の列を確認してください。');
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
      throw new Error(
        `年の範囲が広すぎます（${minYear}〜${maxYear}年）。${MAX_YEAR_SPAN}年以内に収まるデータをご用意ください。`
      );
    }

    return { lanes, warnings, truncatedSheets };
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.startsWith('有効なデータ') || error.message.startsWith('年の範囲')) {
        throw error;
      }
      throw new Error(`Excelファイルの解析に失敗しました: ${error.message}`);
    }
    throw new Error('Excelファイルの解析に失敗しました。');
  }
}

export async function parseExcelLanes(file: File): Promise<TimelineData> {
  const result = await parseExcel(file);
  return result.lanes;
}
