import { useState, useCallback } from 'react';
import { TimelineData, ParseWarning } from '../lib/types';
import { parseExcel } from '../lib/parseExcel';
import { isXlsxFile } from '../lib/fileValidation';
import { AppMessageError, isAppMessageError, type StoredAppError } from '../i18n/errors';

export function useSheetLoader() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StoredAppError | null>(null);
  const [warnings, setWarnings] = useState<ParseWarning[]>([]);

  const loadExcelFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    setWarnings([]);

    try {
      if (!isXlsxFile(file)) {
        throw new AppMessageError('file.notXlsxPeriod');
      }

      const result = await parseExcel(file);
      setData(result.lanes);
      setWarnings(result.warnings);
    } catch (err) {
      console.error('Excel file load error:', err);
      if (isAppMessageError(err)) {
        setError({ code: err.code, params: err.params });
      } else {
        setError({ code: 'error.loadFailed' });
      }
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
