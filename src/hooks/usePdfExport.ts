import { useState, useCallback, useRef, useEffect } from 'react';
import { flushSync } from 'react-dom';
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
  const [exportWarning, setExportWarning] = useState<StoredAppError | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const exportingRef = useRef(false);
  const controllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; controllerRef.current?.abort(); };
  }, []);

  const exportToPdf = useCallback(async (elementId: string, missingImageLabel?: string) => {
    // React が disabled を反映する前の連打でも、同時に複数生成しない。
    if (exportingRef.current) return;
    exportingRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;
    // 仮想描画を解除してから、全イベントを含む複製を作る。
    flushSync(() => setExporting(true));
    setExportError(null);
    setExportProgress(null);
    setExportWarning(null);
    setCancelling(false);

    try {
      await exportPdf(elementId, (completed, total) => {
        if (mountedRef.current && !controller.signal.aborted) setExportProgress({ completed, total });
      }, {
        signal: controller.signal,
        missingImageLabel,
        onWarning: (warning) => { if (mountedRef.current) setExportWarning(warning); },
      });
    } catch (error) {
      if (controller.signal.aborted || !mountedRef.current) return;
      if (isAppMessageError(error)) {
        setExportError({ code: error.code, params: error.params });
      } else {
        setExportError({ code: 'error.pdfFailed' });
      }
    } finally {
      exportingRef.current = false;
      controllerRef.current = null;
      if (mountedRef.current) {
        setExporting(false);
        setExportProgress(null);
        setCancelling(false);
      }
    }
  }, []);

  const clearExportError = useCallback(() => {
    setExportError(null);
    setExportWarning(null);
  }, []);
  const cancelExport = useCallback(() => {
    if (!controllerRef.current) return;
    setCancelling(true);
    controllerRef.current.abort();
  }, []);

  return {
    exporting,
    exportProgress,
    exportError,
    exportWarning,
    cancelling,
    cancelExport,
    exportToPdf,
    clearExportError,
  };
}
