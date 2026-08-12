import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getCenteredScrollOffset,
  scrollTimelineEventIntoView,
} from '../lib/timelineScroll';

afterEach(() => {
  document.body.replaceChildren();
});

describe('getCenteredScrollOffset', () => {
  it('centers a distant target in the visible viewport', () => {
    expect(
      getCenteredScrollOffset({
        currentScroll: 0,
        targetStart: 2800,
        targetSize: 200,
        viewportStart: 12,
        viewportSize: 1200,
        maxScroll: 4000,
      })
    ).toBe(2288);
  });

  it('accounts for an existing scroll offset when returning to an earlier lane', () => {
    expect(
      getCenteredScrollOffset({
        currentScroll: 1800,
        targetStart: -1700,
        targetSize: 100,
        viewportStart: 12,
        viewportSize: 1200,
        maxScroll: 4000,
      })
    ).toBe(0);
  });

  it('clamps a target near the end to the maximum scroll extent', () => {
    expect(
      getCenteredScrollOffset({
        currentScroll: 3500,
        targetStart: 1100,
        targetSize: 200,
        viewportStart: 0,
        viewportSize: 1200,
        maxScroll: 4000,
      })
    ).toBe(4000);
  });

  it('jumps immediately in both axes of the timeline viewport by default', () => {
    const viewport = document.createElement('div');
    viewport.dataset.timelineViewport = '';
    const canvas = document.createElement('div');
    canvas.dataset.timelineCanvasScroll = '';
    const stickyHeader = document.createElement('div');
    stickyHeader.dataset.laneHeaderRow = '';
    const target = document.createElement('div');
    target.id = 'target-event';
    canvas.append(stickyHeader);
    canvas.append(target);
    viewport.append(canvas);
    document.body.append(viewport);

    Object.defineProperties(viewport, {
      clientWidth: { configurable: true, value: 1000 },
      scrollWidth: { configurable: true, value: 4000 },
      clientHeight: { configurable: true, value: 500 },
      scrollHeight: { configurable: true, value: 5000 },
      scrollLeft: { configurable: true, value: 0, writable: true },
      scrollTop: { configurable: true, value: 0, writable: true },
    });

    canvas.getBoundingClientRect = () =>
      ({ left: 0, right: 1000, top: 100, bottom: 600, width: 1000, height: 500 }) as DOMRect;
    stickyHeader.getBoundingClientRect = () =>
      ({ left: 0, right: 1000, top: 100, bottom: 160, width: 1000, height: 60 }) as DOMRect;
    viewport.getBoundingClientRect = () =>
      ({ left: 0, right: 1000, top: 100, bottom: 600, width: 1000, height: 500 }) as DOMRect;
    target.getBoundingClientRect = () =>
      ({ left: 2100, right: 2200, top: 1600, bottom: 1700, width: 100, height: 100 }) as DOMRect;

    const viewportScrollTo = vi.fn();
    viewport.scrollTo = viewportScrollTo;

    expect(scrollTimelineEventIntoView(target.id)).toBe(true);
    expect(viewportScrollTo).toHaveBeenCalledWith({ left: 1650, top: 1270, behavior: 'auto' });
  });
});
