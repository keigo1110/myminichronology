import React, { useState } from 'react';
import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import * as XLSX from 'xlsx';
import { ThemeProvider } from '../app/providers';
import { YearRangeFields } from '../components/YearRangeFields';
import { EventItem } from '../components/EventItem';
import { computeLayout, mapYearToPosition } from '../lib/computeLayout';
import { MAX_PARSE_WARNINGS, MAX_TOTAL_EVENT_LABEL_LENGTH } from '../lib/fileValidation';
import { parseExcelBuffer, parseFontSizeValue } from '../lib/parseExcelBuffer';
import { pushParseWarning } from '../lib/parseWarnings';
import { computePdfCapturePlan } from '../lib/exportPdf';
import { abortable } from '../lib/abortable';
import { usePdfExport } from '../hooks/usePdfExport';
import { exportPdf } from '../lib/exportPdf';
import type { ParseWarning } from '../lib/types';

vi.mock('../lib/exportPdf', async (importOriginal) => ({
  ...await importOriginal<typeof import('../lib/exportPdf')>(), exportPdf: vi.fn(),
}));

describe('second review regressions', () => {
  it('keeps the period bar tied to its years even when the label is much longer', () => {
    const layout = computeLayout([{ name: 'Range', events: [{ start: 2000, end: 2001, label: '長い出来事'.repeat(30) }, { start: 2010, label: 'last' }] }], 1, undefined, 'horizontal');
    const event = layout.positionedEvents[0].find((event) => event.end === 2001)!;
    const axis = layout.layoutConfig.yearContentWidth!;
    expect(event.rangeLength).toBeCloseTo(mapYearToPosition(2001, layout.yearRange, axis) - mapYearToPosition(2000, layout.yearRange, axis));
    expect(event.width).toBeGreaterThan(event.rangeLength! * 2);
    const { container, rerender } = render(<ThemeProvider><EventItem event={event} orientation="horizontal" /></ThemeProvider>);
    const bar = container.querySelector('[data-range-bar="horizontal"]')!;
    const width = getComputedStyle(bar).width;
    expect(parseFloat(width)).toBeCloseTo(event.rangeLength!);
    rerender(<ThemeProvider><EventItem event={event} orientation="horizontal" highlighted /></ThemeProvider>);
    expect(getComputedStyle(bar).width).toBe(width);
  });

  it('reuses horizontal rows with mixed heights without overlap or changing year coordinates', () => {
    const data = [{ name: 'Mixed', events: Array.from({ length: 180 }, (_, i) => ({
      start: 1900 + (i * 7 % 100), end: i % 3 === 0 ? 1910 + (i * 7 % 100) : undefined,
      label: `Event ${i}`, fontSize: 8 + i % 41, imageUrl: i % 5 === 0 ? 'https://example.com/image.png' : undefined,
    })) }];
    const layout = computeLayout(data, 1, undefined, 'horizontal');
    const events = layout.positionedEvents[0];
    expect(computeLayout(data, 1, undefined, 'horizontal').positionedEvents).toEqual(layout.positionedEvents);
    for (let i = 0; i < events.length; i++) {
      expect(events[i].x).toBeCloseTo(mapYearToPosition(events[i].start, layout.yearRange, layout.layoutConfig.yearContentWidth!));
      const event = events[i];
      const blockers = events.slice(0, i).filter((other) => other.x < event.x + event.width && event.x < other.x + other.width).sort((a, b) => a.y - b.y);
      let earliest = 4;
      for (const blocker of blockers) {
        if (earliest + event.height <= blocker.y) break;
        if (earliest < blocker.y + blocker.height) earliest = blocker.y + blocker.height + 4;
      }
      expect(event.y).toBe(earliest);
      for (let j = i + 1; j < events.length; j++) {
        const a = events[i], b = events[j];
        expect(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y).toBe(true);
      }
    }
  });

  it('allows clearing and retyping years and preserves the next field during a commit', () => {
    function Fields() {
      const [value, setValue] = useState<[number, number]>([1900, 2100]);
      return <YearRangeFields bounds={{ min: 1900, max: 2100 }} value={value} onChange={setValue} />;
    }
    render(<ThemeProvider><Fields /></ThemeProvider>);
    const start = screen.getByRole('spinbutton', { name: '開始年' });
    const end = screen.getByRole('spinbutton', { name: '終了年' });
    fireEvent.change(start, { target: { value: '' } });
    expect(start).toHaveValue(null);
    fireEvent.change(start, { target: { value: '2000' } });
    fireEvent.blur(start); end.focus();
    expect(start).toHaveValue(2000); expect(end).toHaveFocus();
    expect(screen.getByRole('spinbutton', { name: '終了年' })).toBe(end);
    fireEvent.change(start, { target: { value: '2001.5' } }); fireEvent.blur(start);
    expect(start).toHaveValue(2000);
    fireEvent.change(end, { target: { value: '2005' } }); fireEvent.keyDown(end, { key: 'Escape' });
    expect(end).toHaveValue(2100);
    fireEvent.click(screen.getByRole('button', { name: '年代範囲をリセット' }));
    expect(start).toHaveValue(1900);
  });

  it('bounds warning details and reports the omitted count accurately', () => {
    const warnings: ParseWarning[] = [];
    for (let i = 0; i < 10_000; i++) pushParseWarning(warnings, 'invalid-year', 'parse.invalidStartYear', { value: 'x'.repeat(1000) });
    expect(warnings).toHaveLength(MAX_PARSE_WARNINGS + 1);
    expect(String(warnings[0].params?.value)).toHaveLength(121);
    expect(warnings.at(-1)).toMatchObject({ type: 'warning-limit', params: { count: 10_000 - MAX_PARSE_WARNINGS } });
  });

  it('limits total label text across sheets to protect browser layout size', async () => {
    const book = XLSX.utils.book_new();
    for (let i = 0; i < 2; i++) XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([
      ['年', '出来事'], ...Array.from({ length: Math.floor(MAX_TOTAL_EVENT_LABEL_LENGTH / 2000 / 2) + 1 }, () => [2000, '長'.repeat(2000)]),
    ]), `Sheet${i}`);
    await expect(parseExcelBuffer(XLSX.write(book, { type: 'array', bookType: 'xlsx' }))).rejects.toMatchObject({ code: 'parse.tooMuchText' });
  });

  it.each(['24garbage', '2e1', '12pxjunk', '-12', 'Infinity'])('rejects incomplete font size %s', (value) => {
    expect(parseFontSizeValue(value)).toBe('invalid');
  });
  it('accepts complete font sizes with optional px', () => {
    expect(parseFontSizeValue('24px')).toBe(24); expect(parseFontSizeValue('12.5 px')).toBe(13);
  });

  it('rejects excessive PDF pages and invalid dimensions before allocating page plans', () => {
    expect(() => computePdfCapturePlan(500, 1e12)).toThrow();
    expect(() => computePdfCapturePlan(1e12, 500)).toThrow();
    expect(() => computePdfCapturePlan(NaN, 500)).toThrow();
    expect(() => computePdfCapturePlan(100, 500, 0)).toThrow();
  });

  it('can abort a pending read without waiting for its source promise', async () => {
    const controller = new AbortController();
    const source = new Promise<void>(() => {});
    const result = expect(abortable(source, controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort(); await result;
  });

  it('cancels PDF work, releases the busy state and does not show a failure', async () => {
    vi.mocked(exportPdf).mockImplementation((_id, _progress, options) => abortable(new Promise<void>(() => {}), options?.signal));
    const { result } = renderHook(() => usePdfExport());
    let pending!: Promise<void>;
    act(() => { pending = result.current.exportToPdf('timelineRoot'); });
    expect(result.current.exporting).toBe(true);
    await act(async () => { result.current.cancelExport(); await pending; });
    expect(result.current.exporting).toBe(false); expect(result.current.exportError).toBeNull();
  });

  it('reports missing PDF images after saving and clears the notice for a new file', async () => {
    vi.mocked(exportPdf).mockImplementation(async (_id, _progress, options) => {
      options?.onWarning?.({ code: 'pdf.imagesOmitted', params: { count: 2 } });
    });
    const { result } = renderHook(() => usePdfExport());
    await act(async () => { await result.current.exportToPdf('timelineRoot', '画像なし'); });
    expect(result.current.exportWarning).toEqual({ code: 'pdf.imagesOmitted', params: { count: 2 } });
    expect(result.current.exportError).toBeNull();
    act(() => result.current.clearExportError());
    expect(result.current.exportWarning).toBeNull();
  });
});
