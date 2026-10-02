import { useState, useCallback, useRef, useEffect } from 'react';
import { TimelineData, ParseWarning } from '../lib/types';
import { parseExcel } from '../lib/parseExcel';
import { isXlsxFile } from '../lib/fileValidation';
import { AppMessageError, isAppMessageError, type StoredAppError } from '../i18n/errors';

export function useSheetLoader() {
  const [data, setData] = useState<TimelineData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StoredAppError | null>(null);
  const [warnings, setWarnings] = useState<ParseWarning[]>([]);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  useEffect(() => () => { requestId.current += 1; controller.current?.abort(); }, []);

  const loadExcelFile = useCallback(async (file: File) => {
    const id = ++requestId.current;
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    setLoading(true);
    setError(null);

    try {
      if (!isXlsxFile(file)) {
        throw new AppMessageError('file.notXlsxPeriod');
      }

      const result = await parseExcel(file, nextController.signal);
      if (id !== requestId.current) return;
      setData(result.lanes);
      setWarnings(result.warnings);
    } catch (err) {
      if (id !== requestId.current || nextController.signal.aborted) return;
      if (isAppMessageError(err)) {
        setError({ code: err.code, params: err.params });
      } else {
        console.error('Excel file load error:', err);
        setError({ code: 'error.loadFailed' });
      }
    } finally {
      if (id === requestId.current) { setLoading(false); controller.current = null; }
    }
  }, []);

  const clearData = useCallback(() => {
    requestId.current += 1;
    controller.current?.abort();
    controller.current = null;
    setLoading(false);
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
