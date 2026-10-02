import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useSheetLoader } from '../hooks/useSheetLoader';
import { parseExcel } from '../lib/parseExcel';
import { AppMessageError } from '../i18n/errors';
import type { ParseResult } from '../lib/types';

vi.mock('../lib/parseExcel', () => ({ parseExcel: vi.fn() }));
const parsed = (name: string): ParseResult => ({ lanes: [{ name, events: [{ start: 2000, label: name }] }], warnings: [], truncatedSheets: 0 });
const file = (name: string) => new File(['x'], `${name}.xlsx`);
describe('useSheetLoader', () => {
  beforeEach(() => vi.clearAllMocks());
  it('aborts earlier work and ignores a stale success arriving last', async () => {
    const completions: ((value: ParseResult) => void)[] = [];
    vi.mocked(parseExcel).mockImplementation(() => new Promise((resolve) => completions.push(resolve)));
    const { result } = renderHook(useSheetLoader);
    let a!: Promise<void>; let b!: Promise<void>;
    act(() => { a = result.current.loadExcelFile(file('A')); });
    const signal = vi.mocked(parseExcel).mock.calls[0][1]!;
    act(() => { b = result.current.loadExcelFile(file('B')); });
    expect(signal.aborted).toBe(true);
    await act(async () => { completions[1](parsed('B')); await b; });
    await act(async () => { completions[0](parsed('A')); await a; });
    expect(result.current.data?.[0].name).toBe('B'); expect(result.current.loading).toBe(false);
  });
  it('keeps existing data when a replacement fails and aborts on unmount', async () => {
    vi.mocked(parseExcel).mockResolvedValueOnce(parsed('Original')).mockRejectedValueOnce(new AppMessageError('parse.noValidData'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result, unmount } = renderHook(useSheetLoader);
    await act(async () => { await result.current.loadExcelFile(file('Original')); });
    await act(async () => { await result.current.loadExcelFile(file('Broken')); });
    expect(result.current.data?.[0].name).toBe('Original'); expect(result.current.error?.code).toBe('parse.noValidData');
    vi.mocked(parseExcel).mockImplementation(() => new Promise(() => {}));
    act(() => { void result.current.loadExcelFile(file('Pending')); });
    const signal = vi.mocked(parseExcel).mock.calls.at(-1)![1]!;
    unmount(); expect(signal.aborted).toBe(true); consoleError.mockRestore();
  });
});
