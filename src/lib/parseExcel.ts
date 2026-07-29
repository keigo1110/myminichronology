import type { TimelineData, Event, Lane, ParseResult, ParseWarning } from './types';
import {
  MAX_SHEETS,
  MAX_YEAR,
  MAX_YEAR_SPAN,
  MIN_YEAR,
} from './fileValidation';

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

  // Excel シリアル値（おおむね 1900〜2100年相当）
  const asNumber = Number(asString);
  if (Number.isFinite(asNumber) && asNumber > 20000 && asNumber < 60000) {
    // SheetJS が日付を数値のまま返す場合のフォールバック
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

export async function parseExcel(file: File): Promise<ParseResult> {
  const XLSX = await import('xlsx');
  const warnings: ParseWarning[] = [];

  try {
    const buffer = await readFileAsArrayBuffer(file);
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });

    const allSheetNames = workbook.SheetNames;
    const truncatedSheets = Math.max(0, allSheetNames.length - MAX_SHEETS);

    if (truncatedSheets > 0) {
      warnings.push({
        type: 'too-many-lanes',
        message: `シートが${allSheetNames.length}件あります。先頭${MAX_SHEETS}件のみ読み込みました（${truncatedSheets}件をスキップ）。`,
      });
    }

    const sheetNames = allSheetNames.slice(0, MAX_SHEETS);
    const lanes: Lane[] = [];

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      if (!worksheet) {
        warnings.push({
          type: 'skipped-sheet',
          sheet: sheetName,
          message: `シート「${sheetName}」は読み込めませんでした（チャートシート等）。`,
        });
        continue;
      }

      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: false,
      }) as unknown[][];

      if (jsonData.length < 2) {
        warnings.push({
          type: 'empty-sheet',
          sheet: sheetName,
          message: `シート「${sheetName}」にデータ行がありません。`,
        });
        continue;
      }

      const events: Event[] = [];

      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowNumber = i + 1;

        if (!row || row.length < 3) {
          if (row && row.some((cell) => cell !== null && cell !== undefined && cell !== '')) {
            warnings.push({
              type: 'missing-columns',
              sheet: sheetName,
              row: rowNumber,
              message: `シート「${sheetName}」${rowNumber}行目: 列が不足しているためスキップしました。`,
            });
          }
          continue;
        }

        const startYearRaw = row[0];
        const endYearRaw = row[1];
        const labelRaw = row[2];

        if (
          startYearRaw === undefined ||
          startYearRaw === null ||
          startYearRaw === '' ||
          labelRaw === undefined ||
          labelRaw === null ||
          String(labelRaw).trim() === ''
        ) {
          warnings.push({
            type: 'missing-columns',
            sheet: sheetName,
            row: rowNumber,
            message: `シート「${sheetName}」${rowNumber}行目: 開始年または出来事が空のためスキップしました。`,
          });
          continue;
        }

        const start = parseYearValue(startYearRaw);
        if (start === null || !isValidYear(start)) {
          warnings.push({
            type: 'invalid-year',
            sheet: sheetName,
            row: rowNumber,
            message: `シート「${sheetName}」${rowNumber}行目: 開始年「${String(startYearRaw)}」が無効です（${MIN_YEAR}〜${MAX_YEAR}）。`,
          });
          continue;
        }

        let end: number | undefined;
        if (endYearRaw !== undefined && endYearRaw !== null && endYearRaw !== '') {
          const endNum = parseYearValue(endYearRaw);
          if (endNum === null || !isValidYear(endNum)) {
            warnings.push({
              type: 'invalid-year',
              sheet: sheetName,
              row: rowNumber,
              message: `シート「${sheetName}」${rowNumber}行目: 終了年「${String(endYearRaw)}」が無効なため点イベントとして扱います。`,
            });
          } else if (endNum < start) {
            warnings.push({
              type: 'year-order',
              sheet: sheetName,
              row: rowNumber,
              message: `シート「${sheetName}」${rowNumber}行目: 終了年が開始年より前のため点イベントとして扱います。`,
            });
          } else {
            end = endNum;
          }
        }

        events.push({
          start,
          end,
          label: String(labelRaw).trim(),
        });
      }

      if (events.length > 0) {
        lanes.push({ name: sheetName, events });
      } else {
        warnings.push({
          type: 'empty-sheet',
          sheet: sheetName,
          message: `シート「${sheetName}」から有効なイベントを読み取れませんでした。`,
        });
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
      // 二重メッセージを避ける
      if (error.message.startsWith('有効なデータ') || error.message.startsWith('年の範囲')) {
        throw error;
      }
      throw new Error(`Excelファイルの解析に失敗しました: ${error.message}`);
    }
    throw new Error('Excelファイルの解析に失敗しました。');
  }
}

/** 後方互換: レーン配列のみが必要な呼び出し向け */
export async function parseExcelLanes(file: File): Promise<TimelineData> {
  const result = await parseExcel(file);
  return result.lanes;
}
