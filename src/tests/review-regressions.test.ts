import { act, renderHook } from '@testing-library/react';
import * as XLSX from 'xlsx';
import { parseExcelBuffer, parseYearValue } from '../lib/parseExcelBuffer';
import { MAX_EVENTS, MAX_EVENT_LABEL_LENGTH, MAX_WORKSHEET_ROWS } from '../lib/fileValidation';
import { computeLayout, mapYearToPosition, TIMELINE_HEADER_HEIGHT } from '../lib/computeLayout';
import { useFilteredEvents } from '../hooks/useFilteredEvents';
import { isEventVisible } from '../lib/eventVisibility';
import { createPdfSnapshot } from '../lib/pdfSnapshot';

function buffer(rows: unknown[][], customize?: (sheet: XLSX.WorkSheet) => void) {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet(rows);
  customize?.(sheet);
  XLSX.utils.book_append_sheet(book, sheet, 'Test');
  return XLSX.write(book, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

describe('review regressions', () => {
  it('uses raw years and date values instead of Excel display formatting', async () => {
    const result = await parseExcelBuffer(buffer([['年', '出来事'], [2000, 'number'], [new Date(2012, 0, 2), 'date']], (sheet) => {
      sheet.A2.z = '#,##0'; sheet.A3.z = 'm/d/yy';
    }));
    expect(result.lanes[0].events.map((event) => event.start)).toEqual([2000, 2012]);
  });
  it.each(['2000abc', '2000.5', '2e3', 2000.5, NaN])('rejects incomplete or fractional year %s', (value) => {
    expect(parseYearValue(value)).toBeNull();
  });
  it('bounds the expanded workbook, event count, and individual labels', async () => {
    await expect(parseExcelBuffer(buffer([['年', '出来事'], ...Array.from({ length: MAX_EVENTS + 1 }, () => [2000, 'event'])])))
      .rejects.toMatchObject({ code: 'parse.tooManyEvents' });
    await expect(parseExcelBuffer(buffer([['年', '出来事'], [2000, 'x'.repeat(MAX_EVENT_LABEL_LENGTH + 1)]])))
      .rejects.toMatchObject({ code: 'parse.labelTooLong' });
    await expect(parseExcelBuffer(buffer([['年', '出来事'], [2000, 'event']], (sheet) => {
      sheet[`B${MAX_WORKSHEET_ROWS + 2}`] = { t: 's', v: 'far row' };
      sheet['!ref'] = `A1:G${MAX_WORKSHEET_ROWS + 2}`;
    }))).rejects.toMatchObject({ code: 'parse.tooManyRows' });
  });
  it('keeps overlapping periods anchored to the year scale and inside their lane', () => {
    const layout = computeLayout([{ name: 'Test', events: Array.from({ length: 20 }, (_, i) => ({ start: 2000, end: 2010, label: `range ${i}` })) }]);
    const scale = layout.layoutConfig.yearScale!;
    const events = layout.positionedEvents[0];
    const start = mapYearToPosition(2000, layout.yearRange, scale.contentSize, scale);
    const end = mapYearToPosition(2010, layout.yearRange, scale.contentSize, scale);
    for (const event of events) {
      expect(event.y).toBe(start);
      expect(event.y + event.height).toBeCloseTo(end);
      expect(event.y + event.height).toBeLessThanOrEqual(layout.layoutConfig.timelineHeight! - TIMELINE_HEADER_HEIGHT);
      expect(event.x + event.width).toBeLessThanOrEqual(layout.layoutConfig.laneWidths[0]);
    }
    for (let i = 0; i < events.length; i++) for (let j = i + 1; j < events.length; j++) {
      expect(events[i].x + events[i].width <= events[j].x || events[j].x + events[j].width <= events[i].x).toBe(true);
    }
  });
  it('places 3200 dense events within the expanded axis without overlaps', () => {
    const events = computeLayout([{ name: 'Dense', events: Array.from({ length: 3200 }, (_, i) => ({ start: 2000, label: `Event ${i}` })) }]);
    const positioned = events.positionedEvents[0];
    expect(positioned).toHaveLength(3200);
    for (let i = 0; i < positioned.length; i++) {
      const event = positioned[i];
      expect(event.y + event.height).toBeLessThanOrEqual(events.layoutConfig.timelineHeight! - TIMELINE_HEADER_HEIGHT);
      for (let j = i + 1; j < positioned.length && positioned[j].y < event.y + event.height; j++) {
        const other = positioned[j];
        expect(event.x + event.width <= other.x || other.x + other.width <= event.x || event.y + event.height <= other.y || other.y + other.height <= event.y).toBe(true);
      }
    }
  });
  it('preserves the full-layout positions and scale when filtering in place', () => {
    const data = [{ name: 'Test', events: Array.from({ length: 20 }, (_, i) => ({ start: 2000 + i, label: `Event ${i}` })) }];
    const base = computeLayout(data);
    const { result, rerender } = renderHook(({ start }) => useFilteredEvents(data, base.positionedEvents, { yearRange: [start, 2010] }, ['Test'], 'filter', 1, base.yearRange, 'vertical', 'vertical', base.layoutConfig), { initialProps: { start: 2000 } });
    act(() => rerender({ start: 2005 }));
    const target = base.positionedEvents[0].find((event) => event.start === 2005);
    expect(result.current.filteredPositionedEvents[0][0]).toBe(target);
    expect(result.current.layoutConfig?.yearScale).toBe(base.layoutConfig.yearScale);
  });
  it('includes long bars crossing the viewport and applies lane offsets', () => {
    const event = { start: 2000, label: 'range', x: 0, y: 0, width: 10, height: 2000 };
    const window = { top: 500, bottom: 1000, left: 100, right: 500 };
    expect(isEventVisible(event, window, 120)).toBe(true);
    expect(isEventVisible(event, window, 600)).toBe(false);
    expect(isEventVisible(event, null)).toBe(true);
  });
  it('freezes DOM and stylesheet rules for PDF and cleans up the snapshot', () => {
    const style = document.createElement('style'); document.head.appendChild(style);
    style.sheet!.insertRule('.test-freeze { color: rgb(12, 34, 56) }');
    const original = document.createElement('div'); original.innerHTML = '<span class="test-freeze">Before</span>';
    const snapshot = createPdfSnapshot(original);
    original.textContent = 'After'; style.sheet!.deleteRule(0);
    expect(snapshot.element.textContent).toBe('Before');
    expect(snapshot.element.ownerDocument.head.textContent).toContain('rgb(12, 34, 56)');
    snapshot.dispose(); style.remove();
    expect(document.querySelector('iframe[title="PDF snapshot"]')).toBeNull();
  });
});
