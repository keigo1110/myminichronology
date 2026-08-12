import { describe, it, expect, vi } from 'vitest';
import { validateExcelFile } from '../lib/fileValidation';
import type { MessageKey } from '../i18n/messages';

/**
 * page.tsx の handleFileDrop と同じ検証ロジックをテストする。
 * 実際の読み込みコールバックはモックする。
 * 戻り値は MessageKey（UI 側で t() する前提）。
 */
function createHandleFileDrop(
  mockClearData: () => void,
  mockLoadExcelFile: (file: File) => void
) {
  return (file: File): MessageKey | null => {
    try {
      const validationError = validateExcelFile(file);
      if (validationError) {
        return validationError;
      }

      mockClearData();
      mockLoadExcelFile(file);
      return null;
    } catch {
      return 'error.fileProcess';
    }
  };
}

describe('file drop validation', () => {
  it('should reject non-xlsx files', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = handleFileDrop(file);

    expect(result).toBe('file.notXlsx');
    expect(mockClearData).not.toHaveBeenCalled();
    expect(mockLoadExcelFile).not.toHaveBeenCalled();
  });

  it('should reject files larger than 10MB', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    const largeSize = 11 * 1024 * 1024;
    const file = new File(['x'], 'large.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(file, 'size', { value: largeSize });

    const result = handleFileDrop(file);

    expect(result).toBe('file.tooLarge');
    expect(mockClearData).not.toHaveBeenCalled();
    expect(mockLoadExcelFile).not.toHaveBeenCalled();
  });

  it('should accept valid xlsx files under 10MB', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    const file = new File(['content'], 'valid.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = handleFileDrop(file);

    expect(result).toBeNull();
    expect(mockClearData).toHaveBeenCalledOnce();
    expect(mockLoadExcelFile).toHaveBeenCalledWith(file);
  });

  it('should handle exactly 10MB files', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    const exactSize = 10 * 1024 * 1024;
    const file = new File(['content'], 'exact.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    Object.defineProperty(file, 'size', { value: exactSize });

    const result = handleFileDrop(file);

    expect(result).toBeNull();
    expect(mockClearData).toHaveBeenCalledOnce();
    expect(mockLoadExcelFile).toHaveBeenCalledWith(file);
  });

  it('should handle exceptions gracefully', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn().mockImplementation(() => {
      throw new Error('Mock error');
    });
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    const file = new File(['content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = handleFileDrop(file);

    expect(result).toBe('error.fileProcess');
    expect(mockClearData).toHaveBeenCalledOnce();
    expect(mockLoadExcelFile).toHaveBeenCalledWith(file);
  });

  it('should validate file extensions case-insensitively', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    const file = new File(['content'], 'test.XLSX', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const result = handleFileDrop(file);

    expect(result).toBeNull();
    expect(mockClearData).toHaveBeenCalledOnce();
    expect(mockLoadExcelFile).toHaveBeenCalledWith(file);
  });
});
