import { describe, expect, it } from 'vitest';
import {
  PDF_TARGET_DPI,
  avoidPdfContentBreaks,
  computePdfCapturePlan,
  computeSafeScale,
  normalizeTimelineCloneForPdf,
} from '../lib/exportPdf';

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

describe('computePdfCapturePlan', () => {
  it('captures a tall real-world timeline one A4 page at a time at 300dpi', () => {
    const plan = computePdfCapturePlan(3302, 19_642);

    expect(plan.direction).toBe('vertical');
    expect(plan.pages).toHaveLength(9);

    const firstPage = plan.pages[0];
    const effectiveDpi =
      (firstPage.width * plan.scale) / (firstPage.pdfWidthMm / 25.4);

    expect(effectiveDpi).toBeCloseTo(PDF_TARGET_DPI, 6);
    expect(firstPage.pdfWidthMm).toBe(297);
    expect(firstPage.pdfHeightMm).toBeCloseTo(210, 8);

    for (const page of plan.pages) {
      expect(page.width * plan.scale).toBeLessThanOrEqual(8192);
      expect(page.height * plan.scale).toBeLessThanOrEqual(8192);
      expect(page.width * page.height * plan.scale * plan.scale).toBeLessThanOrEqual(
        16_777_216
      );
    }

    expect(plan.pages[0].y).toBe(0);
    plan.pages.slice(1).forEach((page, index) => {
      const previous = plan.pages[index];
      expect(page.y).toBeCloseTo(previous.y + previous.height, 8);
    });
    expect(plan.pages.reduce((sum, page) => sum + page.height, 0)).toBeCloseTo(
      19_642,
      8
    );

    expect(plan.pages.at(-1)?.pdfHeightMm).toBeLessThan(210);
  });

  it('paginates a wide horizontal timeline from left to right at 300dpi', () => {
    const plan = computePdfCapturePlan(10_000, 1000);

    expect(plan.direction).toBe('horizontal');
    expect(plan.pages).toHaveLength(8);

    const firstPage = plan.pages[0];
    const effectiveDpi =
      (firstPage.height * plan.scale) / (firstPage.pdfHeightMm / 25.4);

    expect(effectiveDpi).toBeCloseTo(PDF_TARGET_DPI, 6);
    expect(firstPage.pdfWidthMm).toBeCloseTo(297, 8);
    expect(firstPage.pdfHeightMm).toBe(210);
    expect(plan.pages[0].x).toBe(0);
    plan.pages.slice(1).forEach((page, index) => {
      const previous = plan.pages[index];
      expect(page.x).toBeCloseTo(previous.x + previous.width, 8);
    });
    expect(plan.pages.reduce((sum, page) => sum + page.width, 0)).toBeCloseTo(
      10_000,
      8
    );
    expect(plan.pages.at(-1)?.pdfWidthMm).toBeLessThan(297);
  });

  it('returns no pages for an empty element', () => {
    expect(computePdfCapturePlan(0, 0)).toEqual({
      direction: 'vertical',
      scale: 1,
      pages: [],
    });
  });
});

describe('avoidPdfContentBreaks', () => {
  it('moves a vertical page boundary before text without leaving a gap', () => {
    const basePlan = {
      direction: 'vertical' as const,
      scale: 2,
      pages: [
        { x: 0, y: 0, width: 200, height: 100, pdfWidthMm: 297, pdfHeightMm: 148.5 },
        { x: 0, y: 100, width: 200, height: 100, pdfWidthMm: 297, pdfHeightMm: 148.5 },
        { x: 0, y: 200, width: 200, height: 50, pdfWidthMm: 297, pdfHeightMm: 74.25 },
      ],
    };

    const adjusted = avoidPdfContentBreaks(basePlan, 250, [
      { start: 94, end: 112 },
    ]);

    expect(adjusted.pages[0]).toMatchObject({ y: 0, height: 94 });
    adjusted.pages.slice(1).forEach((page, index) => {
      const previous = adjusted.pages[index];
      expect(page.y).toBeCloseTo(previous.y + previous.height, 8);
    });
    expect(adjusted.pages.reduce((sum, page) => sum + page.height, 0)).toBe(250);
    expect(adjusted.pages[0].pdfHeightMm).toBeLessThan(210);
  });

  it('keeps the original boundary when avoiding one item would underfill the page', () => {
    const basePlan = computePdfCapturePlan(1000, 3000);
    const firstBoundary = basePlan.pages[0].height;
    const adjusted = avoidPdfContentBreaks(basePlan, 3000, [
      { start: 10, end: firstBoundary + 20 },
    ]);

    expect(adjusted.pages[0].height).toBeCloseTo(firstBoundary, 8);
  });

  it('moves horizontal page boundaries along the x axis', () => {
    const basePlan = {
      direction: 'horizontal' as const,
      scale: 2,
      pages: [
        { x: 0, y: 0, width: 100, height: 50, pdfWidthMm: 297, pdfHeightMm: 210 },
        { x: 100, y: 0, width: 100, height: 50, pdfWidthMm: 297, pdfHeightMm: 210 },
      ],
    };
    const adjusted = avoidPdfContentBreaks(basePlan, 200, [
      { start: 90, end: 110 },
    ]);

    expect(adjusted.pages[0]).toMatchObject({ x: 0, width: 90 });
    expect(adjusted.pages[1].x).toBe(90);
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
