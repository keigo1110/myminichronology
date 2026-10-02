import type { MessageKey } from '../i18n/messages';

/** Excel ファイルの最大サイズ（10MB） */
export const MAX_EXCEL_FILE_SIZE = 10 * 1024 * 1024;

/** 受け入れ可能な年の範囲 */
export const MIN_YEAR = 1;
export const MAX_YEAR = 9999;

/** 年表として扱える最大年幅（ブラウザ負荷対策） */
export const MAX_YEAR_SPAN = 2000;

/** 読み込み可能な最大シート数 */
export const MAX_SHEETS = 5;

/** 圧縮後の容量だけでは制限できない、展開後の処理量の上限。 */
export const MAX_EVENTS = 5000;
export const MAX_WORKSHEET_ROWS = 20000;
export const MAX_EVENT_LABEL_LENGTH = 2000;
export const MAX_TOTAL_EVENT_LABEL_LENGTH = 250_000;
export const MAX_PARSE_WARNINGS = 200;

export function isXlsxFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.xlsx');
}

export function isXlsxFile(file: File): boolean {
  return isXlsxFileName(file.name);
}

/**
 * アップロード前のファイル検証。
 * @returns エラーメッセージキー。成功時は null。
 */
export function validateExcelFile(file: File): MessageKey | null {
  if (!isXlsxFile(file)) {
    return 'file.notXlsx';
  }

  if (file.size > MAX_EXCEL_FILE_SIZE) {
    return 'file.tooLarge';
  }

  return null;
}
