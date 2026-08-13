import { useState, useCallback, useRef } from 'react';
import { exportPdf } from '../lib/exportPdf';
import { isAppMessageError, type StoredAppError } from '../i18n/errors';

export interface PdfExportProgress {
  completed: number;
  total: number;
}

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<StoredAppError | null>(null);
  const [exportProgress, setExportProgress] = useState<PdfExportProgress | null>(null);
  const exportingRef = useRef(false);

  const exportToPdf = useCallback(async (elementId: string) => {
    // React が disabled を反映する前の連打でも、同時に複数生成しない。
    if (exportingRef.current) return;
    exportingRef.current = true;
    setExporting(true);
    setExportError(null);
    setExportProgress(null);

    try {
      await exportPdf(elementId, (completed, total) => {
        setExportProgress({ completed, total });
      });
    } catch (error) {
      if (isAppMessageError(error)) {
        setExportError({ code: error.code, params: error.params });
      } else {
        setExportError({ code: 'error.pdfFailed' });
      }
    } finally {
      exportingRef.current = false;
      setExporting(false);
      setExportProgress(null);
    }
  }, []);

  const clearExportError = useCallback(() => {
    setExportError(null);
  }, []);

  return {
    exporting,
    exportProgress,
    exportError,
    exportToPdf,
    clearExportError,
  };
}
