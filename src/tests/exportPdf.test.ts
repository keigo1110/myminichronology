import { describe, expect, it } from 'vitest';
import { computeSafeScale, normalizeTimelineCloneForPdf } from '../lib/exportPdf';

describe('computeSafeScale', () => {
  it('keeps the preferred scale for an ordinary timeline', () => {
    expect(computeSafeScale(1200, 800, 3)).toBe(3);
  });

  it('downscales a tall real-world timeline to the canvas budget', () => {
    const width = 3302;
    const height = 19_642;
    const scale = computeSafeScale(width, height, 3);

    expect(scale).toBeCloseTo(8192 / height, 8);
    expect(width * scale).toBeLessThanOrEqual(8192);
    expect(height * scale).toBeLessThanOrEqual(8192);
    expect(width * height * scale * scale).toBeLessThanOrEqual(16_777_216);
  });

  it('returns a usable default for an empty element', () => {
    expect(computeSafeScale(0, 0)).toBe(1);
  });
});

describe('normalizeTimelineCloneForPdf', () => {
  it('places duplicate axes in normal flow and restores a mobile-hidden right axis', () => {
    const timeline = document.createElement('div');
    timeline.innerHTML = `
      <div data-year-axis="left" style="position: sticky; left: 0"></div>
      <div data-year-axis="right" style="position: sticky; right: 0; display: none"></div>
    `;

    normalizeTimelineCloneForPdf(timeline);

    const leftAxis = timeline.querySelector<HTMLElement>('[data-year-axis="left"]');
    const rightAxis = timeline.querySelector<HTMLElement>('[data-year-axis="right"]');

    expect(leftAxis?.style.position).toBe('relative');
    expect(leftAxis?.style.left).toBe('auto');
    expect(rightAxis?.style.position).toBe('relative');
    expect(rightAxis?.style.right).toBe('auto');
    expect(rightAxis?.style.display).toBe('flex');
  });
});
