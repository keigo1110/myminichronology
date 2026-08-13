import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { exportPdf } from '../lib/exportPdf';
import { usePdfExport } from '../hooks/usePdfExport';

vi.mock('../lib/exportPdf', () => ({
  exportPdf: vi.fn(),
}));

const mockedExportPdf = vi.mocked(exportPdf);

describe('usePdfExport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('blocks duplicate exports and reports page progress', async () => {
    let finishExport: (() => void) | undefined;
    mockedExportPdf.mockImplementation(async (_elementId, onProgress) => {
      onProgress?.(0, 4);
      await new Promise<void>((resolve) => {
        finishExport = resolve;
      });
      onProgress?.(4, 4);
    });

    const { result } = renderHook(() => usePdfExport());
    let firstExport!: Promise<void>;

    act(() => {
      firstExport = result.current.exportToPdf('timelineRoot');
      void result.current.exportToPdf('timelineRoot');
    });

    expect(mockedExportPdf).toHaveBeenCalledTimes(1);
    expect(result.current.exporting).toBe(true);
    expect(result.current.exportProgress).toEqual({ completed: 0, total: 4 });

    await act(async () => {
      finishExport?.();
      await firstExport;
    });

    expect(result.current.exporting).toBe(false);
    expect(result.current.exportProgress).toBeNull();
  });
});
