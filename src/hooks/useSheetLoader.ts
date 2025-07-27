import { useState, useCallback } from 'react';
import { TimelineData } from '../lib/types';
import { parseExcel } from '../lib/parseExcel';

export function useSheetLoader() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExcelFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      // ファイル形式チェック
      if (!file.name.endsWith('.xlsx')) {
        throw new Error('Unsupported file. Please upload .xlsx.');
      }

      const timelineData = await parseExcel(file);

      // レーン数チェック
      if (timelineData.length > 5) {
        throw new Error('Maximum 5 sheets/lane supported.');
      }

      setData(timelineData);
    } catch (err) {
      console.error('Excel file load error:', err);
      const message = err instanceof Error ? err.message : 'Failed to load Excel file.';
      setError(message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);



  const clearData = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return {
    data,
    loading,
    error,
    loadExcelFile,
    clearData
  };
}