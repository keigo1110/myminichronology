/** Excel ファイルの最大サイズ（10MB） */
export const MAX_EXCEL_FILE_SIZE = 10 * 1024 * 1024;

/** 受け入れ可能な年の範囲 */
export const MIN_YEAR = 1;
export const MAX_YEAR = 9999;

/** 年表として扱える最大年幅（ブラウザ負荷対策） */
export const MAX_YEAR_SPAN = 2000;

/** 読み込み可能な最大シート数 */
export const MAX_SHEETS = 5;

export function isXlsxFileName(fileName: string): boolean {
  return fileName.toLowerCase().endsWith('.xlsx');
}

export function isXlsxFile(file: File): boolean {
  return isXlsxFileName(file.name);
}

/**
 * アップロード前のファイル検証。
 * @returns エラーメッセージ（日本語）。成功時は null。
 */
export function validateExcelFile(file: File): string | null {
  if (!isXlsxFile(file)) {
    return 'Excelファイル（.xlsx）を選択してください';
  }

  if (file.size > MAX_EXCEL_FILE_SIZE) {
    return 'ファイルサイズが大きすぎます（10MB以下にしてください）';
  }

  return null;
}
