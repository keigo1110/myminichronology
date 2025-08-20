import { describe, it, expect, vi } from 'vitest';

// page.tsxの handleFileDrop 関数をユニットテストとして抽出
// 実際のファイルから関数をインポートできないため、ロジックを再現
function createHandleFileDrop(mockClearData: () => void, mockLoadExcelFile: (file: File) => void) {
  return (file: File): string | null => {
    try {
      // ファイル形式チェック（大文字小文字を区別しない）
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        const errorMsg = 'Excelファイル（.xlsx）を選択してください';
        return errorMsg;
      }

      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        const errorMsg = 'ファイルサイズが大きすぎます（10MB以下にしてください）';
        return errorMsg;
      }

      mockClearData();
      mockLoadExcelFile(file);
      return null; // 成功
    } catch (err) {
      const errorMsg = 'ファイルの処理中にエラーが発生しました';
      return errorMsg;
    }
  };
}

describe('page.tsx - handleFileDrop', () => {
  it('should reject non-xlsx files', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = handleFileDrop(file);

    expect(result).toBe('Excelファイル（.xlsx）を選択してください');
    expect(mockClearData).not.toHaveBeenCalled();
    expect(mockLoadExcelFile).not.toHaveBeenCalled();
  });

  it('should reject files larger than 10MB', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    // 11MBのファイルを作成
    const largeSize = 11 * 1024 * 1024;
    const file = new File(['x'.repeat(largeSize)], 'large.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    Object.defineProperty(file, 'size', { value: largeSize });

    const result = handleFileDrop(file);

    expect(result).toBe('ファイルサイズが大きすぎます（10MB以下にしてください）');
    expect(mockClearData).not.toHaveBeenCalled();
    expect(mockLoadExcelFile).not.toHaveBeenCalled();
  });

  it('should accept valid xlsx files under 10MB', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    const file = new File(['content'], 'valid.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const result = handleFileDrop(file);

    expect(result).toBeNull(); // 成功
    expect(mockClearData).toHaveBeenCalledOnce();
    expect(mockLoadExcelFile).toHaveBeenCalledWith(file);
  });

  it('should handle exactly 10MB files', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    const exactSize = 10 * 1024 * 1024; // 正確に10MB
    const file = new File(['content'], 'exact.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    Object.defineProperty(file, 'size', { value: exactSize });

    const result = handleFileDrop(file);

    expect(result).toBeNull(); // 成功（10MB以下なので許可）
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
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const result = handleFileDrop(file);

    expect(result).toBe('ファイルの処理中にエラーが発生しました');
    expect(mockClearData).toHaveBeenCalledOnce();
    expect(mockLoadExcelFile).toHaveBeenCalledWith(file);
  });

  it('should validate file extensions case-insensitively', () => {
    const mockClearData = vi.fn();
    const mockLoadExcelFile = vi.fn();
    const handleFileDrop = createHandleFileDrop(mockClearData, mockLoadExcelFile);

    // 大文字の拡張子
    const file = new File(['content'], 'test.XLSX', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const result = handleFileDrop(file);

    // 大文字小文字を区別しないため、成功する
    expect(result).toBeNull(); // 成功
    expect(mockClearData).toHaveBeenCalledOnce();
    expect(mockLoadExcelFile).toHaveBeenCalledWith(file);
  });
});
