import { useState, useCallback } from 'react';
import { TimelineData, ParseWarning } from '../lib/types';
import { parseExcel } from '../lib/parseExcel';
import { isXlsxFile } from '../lib/fileValidation';

export function useSheetLoader() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<ParseWarning[]>([]);

  const loadExcelFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      if (!isXlsxFile(file)) {
        throw new Error('Excelファイル（.xlsx）を選択してください。');
      }

      const result = await parseExcel(file);
      setData(result.lanes);
      setWarnings(result.warnings);
    } catch (err) {
      console.error('Excel file load error:', err);
      const message = err instanceof Error ? err.message : 'Excelファイルの読み込みに失敗しました。';
      setError(message);
      setData(null);
      setWarnings([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearData = useCallback(() => {
    setData(null);
    setError(null);
    setWarnings([]);
  }, []);

  return {
    data,
    loading,
    error,
    warnings,
    loadExcelFile,
    clearData,
  };
}
