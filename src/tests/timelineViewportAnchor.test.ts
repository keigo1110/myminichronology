import { describe, expect, it } from 'vitest';
import {
  captureTimelineViewportAnchor,
  restoreTimelineViewportAnchor,
} from '../lib/timelineViewportAnchor';
import type { DynamicLayoutConfig } from '../lib/types';

function mockDimension(
  element: HTMLElement,
  property: 'clientWidth' | 'clientHeight' | 'scrollWidth' | 'scrollHeight',
  value: number
) {
  Object.defineProperty(element, property, { configurable: true, value });
}

describe('timeline viewport anchor', () => {
  it('keeps the same vertical-timeline year centered after a height change', () => {
    const viewport = document.createElement('div');
    const timeline = document.createElement('div');
    viewport.appendChild(timeline);

    mockDimension(viewport, 'clientWidth', 500);
    mockDimension(viewport, 'clientHeight', 400);
    mockDimension(viewport, 'scrollWidth', 1200);
    mockDimension(viewport, 'scrollHeight', 2000);
    viewport.scrollTop = 500;
    viewport.scrollLeft = 175;

    viewport.getBoundingClientRect = () =>
      ({ top: 100, left: 20, width: 500, height: 400 } as DOMRect);
    timeline.getBoundingClientRect = () =>
      ({
        top: 100 - viewport.scrollTop,
        left: 20 - viewport.scrollLeft,
        width: 1200,
        height: 1052,
      } as DOMRect);

    const before: DynamicLayoutConfig = {
      laneWidths: [1080],
      laneWidthByName: { lane: 1080 },
      yearAxisWidth: 60,
      totalWidth: 1200,
      timelineHeight: 1052,
      orientation: 'vertical',
    };
    const anchor = captureTimelineViewportAnchor({
      viewport,
      timeline,
      orientation: 'vertical',
      yearRange: { min: 1900, max: 2000 },
      layoutConfig: before,
    });

    mockDimension(viewport, 'scrollHeight', 3000);
    const after = { ...before, timelineHeight: 2052 };
    expect(
      restoreTimelineViewportAnchor(
        {
          viewport,
          timeline,
          orientation: 'vertical',
          yearRange: { min: 1900, max: 2000 },
          layoutConfig: after,
        },
        anchor
      )
    ).toBe(true);

    // 変更前の中央は 1964.8 年付近。高さ2倍後も同じ年を中央に置く。
    expect(viewport.scrollTop).toBeCloseTo(1148, 6);
    // 横方向は可動域に対する比率を維持する。
    expect(viewport.scrollLeft).toBeCloseTo(175, 6);
  });

  it('keeps the same horizontal-timeline year centered after a width change', () => {
    const viewport = document.createElement('div');
    const timeline = document.createElement('div');
    viewport.appendChild(timeline);

    mockDimension(viewport, 'clientWidth', 400);
    mockDimension(viewport, 'clientHeight', 300);
    mockDimension(viewport, 'scrollWidth', 1050);
    mockDimension(viewport, 'scrollHeight', 900);
    viewport.scrollLeft = 300;
    viewport.scrollTop = 150;

    viewport.getBoundingClientRect = () =>
      ({ top: 40, left: 10, width: 400, height: 300 } as DOMRect);
    timeline.getBoundingClientRect = () =>
      ({
        top: 40 - viewport.scrollTop,
        left: 10 - viewport.scrollLeft,
        width: 1050,
        height: 900,
      } as DOMRect);

    const before: DynamicLayoutConfig = {
      laneWidths: [1000],
      laneWidthByName: { lane: 1000 },
      yearAxisWidth: 0,
      laneLabelWidth: 50,
      yearContentWidth: 1000,
      totalWidth: 1050,
      timelineHeight: 900,
      orientation: 'horizontal',
    };
    const anchor = captureTimelineViewportAnchor({
      viewport,
      timeline,
      orientation: 'horizontal',
      yearRange: { min: 1900, max: 2000 },
      layoutConfig: before,
    });

    mockDimension(viewport, 'scrollWidth', 2050);
    mockDimension(viewport, 'scrollHeight', 1500);
    const after = {
      ...before,
      laneWidths: [2000],
      laneWidthByName: { lane: 2000 },
      yearContentWidth: 2000,
      totalWidth: 2050,
      timelineHeight: 1500,
    };
    expect(
      restoreTimelineViewportAnchor(
        {
          viewport,
          timeline,
          orientation: 'horizontal',
          yearRange: { min: 1900, max: 2000 },
          layoutConfig: after,
        },
        anchor
      )
    ).toBe(true);

    expect(anchor.year).toBeCloseTo(1945, 6);
    expect(viewport.scrollLeft).toBeCloseTo(750, 6);
    expect(viewport.scrollTop).toBeCloseTo(300, 6);
  });
});
