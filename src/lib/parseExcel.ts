import * as XLSX from 'xlsx';
import { TimelineData, Lane, Event } from './types';

export async function parseExcel(file: File): Promise<TimelineData> {
  try {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });

    const lanes: Lane[] = [];

    // 最大5シートまで処理
    const sheetNames = workbook.SheetNames.slice(0, 5);

    for (const sheetName of sheetNames) {
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) continue; // ヘッダー行のみの場合はスキップ

      const events: Event[] = [];

      // ヘッダー行をスキップしてデータ行を処理
      for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i] as unknown[];

        if (!row || row.length < 3) continue;

        const startYear = row[0];
        const endYear = row[1];
        const label = row[2];

        // 必須列のチェック
        if (startYear === undefined || startYear === null || label === undefined || label === null) {
          continue;
        }

        // 年の形式チェック
        const start = parseInt(String(startYear));
        if (isNaN(start) || start <= 0) {
          continue;
        }

        let end: number | undefined;
        if (endYear !== undefined && endYear !== null && endYear !== '') {
          const endNum = parseInt(String(endYear));
          if (!isNaN(endNum) && endNum >= start) {
            end = endNum;
          }
        }

        events.push({
          start,
          end,
          label: String(label).trim()
        });
      }

      if (events.length > 0) {
        lanes.push({
          name: sheetName,
          events
        });
      }
    }

    if (lanes.length === 0) {
      throw new Error('No valid data found in the Excel file.');
    }

    return lanes;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to parse Excel file: ${error.message}`);
    }
    throw new Error('Failed to parse Excel file.');
  }
}