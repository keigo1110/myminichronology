import { useState, useCallback } from 'react';
import { exportPdf } from '../lib/exportPdf';
import { isAppMessageError, type StoredAppError } from '../i18n/errors';

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<StoredAppError | null>(null);

  const exportToPdf = useCallback(async (elementId: string) => {
    setExporting(true);
    setExportError(null);

    try {
      await exportPdf(elementId);
    } catch (error) {
      if (isAppMessageError(error)) {
        setExportError({ code: error.code, params: error.params });
      } else {
        setExportError({ code: 'error.pdfFailed' });
      }
    } finally {
      setExporting(false);
    }
  }, []);

  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  return {
    exporting,
    exportError,
    exportToPdf,
    clearExportError,
  };
}
