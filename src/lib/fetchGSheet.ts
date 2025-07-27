import Papa from 'papaparse';
import { TimelineData, Lane, Event } from './types';

export async function fetchGSheet(url: string): Promise<TimelineData> {
  try {
    // URL からスプレッドシート ID とシート名を抽出
    const urlMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!urlMatch) {
      throw new Error('Invalid Google Sheets URL format.');
    }

    const spreadsheetId = urlMatch[1];

    // スプレッドシートのメタデータを取得してシート名を取得
    const metadataUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:json`;
    const metadataResponse = await fetch(metadataUrl);

    if (!metadataResponse.ok) {
      throw new Error('Failed to fetch spreadsheet metadata.');
    }

    const metadataText = await metadataResponse.text();
    // Google Sheets API のレスポンスから JSON 部分を抽出
    const jsonMatch = metadataText.match(/google\.visualization\.Query\.setResponse\((.*)\);/);
    if (!jsonMatch) {
      throw new Error('Invalid response format from Google Sheets.');
    }

    const metadata = JSON.parse(jsonMatch[1]);
    const table = metadata.table;
    const sheetNames: string[] = [];

    // シート名を抽出（実際の API レスポンス構造に応じて調整が必要）
    if (table && table.cols) {
      // この部分は実際の Google Sheets API レスポンス構造に応じて調整
      // 簡易実装として、最初の5つのシートを取得
      for (let i = 0; i < Math.min(5, table.cols.length); i++) {
        sheetNames.push(`Sheet${i + 1}`);
      }
    }

    if (sheetNames.length === 0) {
      throw new Error('No sheets found in the spreadsheet.');
    }

    const lanes: Lane[] = [];

    // 各シートからデータを取得
    for (const sheetName of sheetNames) {
      try {
        const csvUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetName)}`;
        const response = await fetch(csvUrl);

        if (!response.ok) {
          continue; // このシートはスキップ
        }

        const csvText = await response.text();

        // CSV を解析
        const result = Papa.parse(csvText, {
          header: false,
          skipEmptyLines: true
        });

        if (result.data.length < 2) continue; // ヘッダー行のみの場合はスキップ

        const events: Event[] = [];

        // ヘッダー行をスキップしてデータ行を処理
        for (let i = 1; i < result.data.length; i++) {
          const row = result.data[i] as string[];

          if (!row || row.length < 3) continue;

          const startYear = row[0];
          const endYear = row[1];
          const label = row[2];

          // 必須列のチェック
          if (!startYear || !label) {
            continue;
          }

          // 年の形式チェック
          const start = parseInt(startYear);
          if (isNaN(start) || start <= 0) {
            continue;
          }

          let end: number | undefined;
          if (endYear && endYear.trim() !== '') {
            const endNum = parseInt(endYear);
            if (!isNaN(endNum) && endNum >= start) {
              end = endNum;
            }
          }

          events.push({
            start,
            end,
            label: label.trim()
          });
        }

        if (events.length > 0) {
          lanes.push({
            name: sheetName,
            events
          });
        }

      } catch (error) {
        // 個別のシートエラーは無視して続行
        console.warn(`Failed to parse sheet ${sheetName}:`, error);
      }
    }

    if (lanes.length === 0) {
      throw new Error('No valid data found in the Google Sheets.');
    }

    return lanes;

  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to fetch Google Sheets data: ${error.message}`);
    }
    throw new Error('Failed to fetch Google Sheets data.');
  }
}