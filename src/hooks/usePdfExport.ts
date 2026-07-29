import { useState, useCallback } from 'react';
import { exportPdf } from '../lib/exportPdf';

export function usePdfExport() {
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const exportToPdf = useCallback(async (elementId: string) => {
    setExporting(true);
    setExportError(null);

    try {
      await exportPdf(elementId);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'PDFのエクスポートに失敗しました。';
      setExportError(message);
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
