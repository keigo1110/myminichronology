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
      const message = error instanceof Error ? error.message : 'Failed to export PDF.';
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
    clearExportError
  };
}