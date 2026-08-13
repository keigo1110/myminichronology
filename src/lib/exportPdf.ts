import { AppMessageError } from '../i18n/errors';

// A4 landscape dimensions in mm
const A4_LANDSCAPE_WIDTH_MM = 297;
const A4_LANDSCAPE_HEIGHT_MM = 210;
const MM_PER_INCH = 25.4;
export const PDF_TARGET_DPI = 300;

/** ブラウザのキャンバス上限を考慮した目標ピクセル予算 */
const MAX_CANVAS_DIMENSION = 8192;
const MAX_CANVAS_PIXELS = 16_777_216; // ~16MP

export function computeSafeScale(width: number, height: number, preferredScale = 3): number {
  if (width <= 0 || height <= 0) return 1;

  const maxByDimension = Math.min(
    MAX_CANVAS_DIMENSION / width,
    MAX_CANVAS_DIMENSION / height
  );
  const maxByPixels = Math.sqrt(MAX_CANVAS_PIXELS / (width * height));

  return Math.min(preferredScale, maxByDimension, maxByPixels);
}

export interface PdfCapturePage {
  x: number;
  y: number;
  width: number;
  height: number;
  pdfWidthMm: number;
  pdfHeightMm: number;
}

export interface PdfCapturePlan {
  direction: 'vertical' | 'horizontal';
  scale: number;
  pages: PdfCapturePage[];
}

export type PdfProgressCallback = (completedPages: number, totalPages: number) => void;

export interface PdfBreakInterval {
  start: number;
  end: number;
}

const MIN_SAFE_PAGE_FILL_RATIO = 0.72;
const PAGE_BREAK_CONTENT_MARGIN_PX = 3;

/**
 * A4 1ページを300dpi相当で直接描画するためのクロップ計画。
 * 年表全体を先に1枚へ縮小しないので、長大な年表でも文字解像度を維持できる。
 */
export function computePdfCapturePlan(
  width: number,
  height: number,
  targetDpi = PDF_TARGET_DPI
): PdfCapturePlan {
  if (width <= 0 || height <= 0) {
    return { direction: 'vertical', scale: 1, pages: [] };
  }

  const pageAspect = A4_LANDSCAPE_WIDTH_MM / A4_LANDSCAPE_HEIGHT_MM;
  const elementAspect = width / height;
  const targetPageWidthPx = (A4_LANDSCAPE_WIDTH_MM / MM_PER_INCH) * targetDpi;
  const targetPageHeightPx = (A4_LANDSCAPE_HEIGHT_MM / MM_PER_INCH) * targetDpi;
  const pageHorizontally = elementAspect > pageAspect * 1.15;
  const pages: PdfCapturePage[] = [];

  if (pageHorizontally) {
    const pageWidth = height * pageAspect;
    const preferredScale = targetPageHeightPx / height;
    const scale = computeSafeScale(Math.min(pageWidth, width), height, preferredScale);
    const totalPages = Math.ceil(width / pageWidth);

    for (let index = 0; index < totalPages; index += 1) {
      const x = index * pageWidth;
      const sliceWidth = Math.min(pageWidth, width - x);
      pages.push({
        x,
        y: 0,
        width: sliceWidth,
        height,
        pdfWidthMm: (sliceWidth / height) * A4_LANDSCAPE_HEIGHT_MM,
        pdfHeightMm: A4_LANDSCAPE_HEIGHT_MM,
      });
    }

    return { direction: 'horizontal', scale, pages };
  }

  const pageHeight = width / pageAspect;
  const preferredScale = targetPageWidthPx / width;
  const scale = computeSafeScale(width, Math.min(pageHeight, height), preferredScale);
  const totalPages = Math.ceil(height / pageHeight);

  for (let index = 0; index < totalPages; index += 1) {
    const y = index * pageHeight;
    const sliceHeight = Math.min(pageHeight, height - y);
    pages.push({
      x: 0,
      y,
      width,
      height: sliceHeight,
      pdfWidthMm: A4_LANDSCAPE_WIDTH_MM,
      pdfHeightMm: (sliceHeight / width) * A4_LANDSCAPE_WIDTH_MM,
    });
  }

  return { direction: 'vertical', scale, pages };
}

function mergeBreakIntervals(
  intervals: PdfBreakInterval[],
  axisSize: number
): PdfBreakInterval[] {
  const sorted = intervals
    .filter(
      ({ start, end }) =>
        Number.isFinite(start) && Number.isFinite(end) && end > start
    )
    .map(({ start, end }) => ({
      start: Math.max(0, Math.min(axisSize, start)),
      end: Math.max(0, Math.min(axisSize, end)),
    }))
    .filter(({ start, end }) => end > start)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const merged: PdfBreakInterval[] = [];
  for (const interval of sorted) {
    const previous = merged[merged.length - 1];
    if (!previous || interval.start > previous.end) {
      merged.push({ ...interval });
    } else {
      previous.end = Math.max(previous.end, interval.end);
    }
  }
  return merged;
}

/**
 * 文字や画像の途中を避けて、固定A4境界を少し手前へ移動する。
 * 長大な1要素がページの大半を占める場合だけは、空白過多を避けて元の境界を使う。
 */
export function avoidPdfContentBreaks(
  basePlan: PdfCapturePlan,
  axisSize: number,
  intervals: PdfBreakInterval[],
  minimumFillRatio = MIN_SAFE_PAGE_FILL_RATIO
): PdfCapturePlan {
  if (basePlan.pages.length <= 1 || intervals.length === 0 || axisSize <= 0) {
    return basePlan;
  }

  const isVertical = basePlan.direction === 'vertical';
  const maxPageSpan = isVertical
    ? basePlan.pages[0].height
    : basePlan.pages[0].width;
  const crossSize = isVertical
    ? basePlan.pages[0].width
    : basePlan.pages[0].height;
  const mergedIntervals = mergeBreakIntervals(intervals, axisSize);
  const pages: PdfCapturePage[] = [];
  let start = 0;

  while (axisSize - start > maxPageSpan + 0.01) {
    const plannedEnd = start + maxPageSpan;
    let safeEnd = plannedEnd;

    // 重なった区間を統合済みなので、候補を区間の先頭へ戻せば安全位置になる。
    const blocker = mergedIntervals.find(
      (interval) => interval.start < safeEnd && safeEnd < interval.end
    );
    if (blocker) {
      const candidate = blocker.start;
      if (candidate - start >= maxPageSpan * minimumFillRatio) {
        safeEnd = candidate;
      }
    }

    const span = Math.max(1, safeEnd - start);
    pages.push(
      isVertical
        ? {
            x: 0,
            y: start,
            width: crossSize,
            height: span,
            pdfWidthMm: A4_LANDSCAPE_WIDTH_MM,
            pdfHeightMm: (span / crossSize) * A4_LANDSCAPE_WIDTH_MM,
          }
        : {
            x: start,
            y: 0,
            width: span,
            height: crossSize,
            pdfWidthMm: (span / crossSize) * A4_LANDSCAPE_HEIGHT_MM,
            pdfHeightMm: A4_LANDSCAPE_HEIGHT_MM,
          }
    );
    start = safeEnd;
  }

  const finalSpan = Math.max(1, axisSize - start);
  pages.push(
    isVertical
      ? {
          x: 0,
          y: start,
          width: crossSize,
          height: finalSpan,
          pdfWidthMm: A4_LANDSCAPE_WIDTH_MM,
          pdfHeightMm: (finalSpan / crossSize) * A4_LANDSCAPE_WIDTH_MM,
        }
      : {
          x: start,
          y: 0,
          width: finalSpan,
          height: crossSize,
          pdfWidthMm: (finalSpan / crossSize) * A4_LANDSCAPE_HEIGHT_MM,
          pdfHeightMm: A4_LANDSCAPE_HEIGHT_MM,
        }
  );

  return { ...basePlan, pages };
}

/**
 * 年表のスクロール位置を先頭に戻す。
 * 対象は年表要素の祖先スクロールコンテナ（`[data-timeline-scroll]`）。
 */
function resetTimelineScroll(element: HTMLElement): () => void {
  const targets = new Set<HTMLElement>();

  const closest = element.closest<HTMLElement>('[data-timeline-scroll]');
  if (closest) targets.add(closest);
  document
    .querySelectorAll<HTMLElement>('[data-timeline-scroll]')
    .forEach((target) => targets.add(target));

  const positions = Array.from(targets, (target) => ({
    target,
    top: target.scrollTop,
    left: target.scrollLeft,
  }));

  targets.forEach((target) => {
    target.scrollTop = 0;
    target.scrollLeft = 0;
  });

  return () => {
    positions.forEach(({ target, top, left }) => {
      target.scrollTop = top;
      target.scrollLeft = left;
    });
  };
}

/**
 * html2canvas が生成した複製 DOM では sticky の基準が表示画面のまま残ることがある。
 * 年代軸を文書フローへ戻し、画面幅に関係なく印刷版の実端へ配置する。
 */
export function normalizeTimelineCloneForPdf(element: HTMLElement): void {
  element.querySelectorAll<HTMLElement>('[data-year-axis]').forEach((axis) => {
    axis.style.position = 'relative';
    axis.style.top = 'auto';
    axis.style.right = 'auto';
    axis.style.bottom = 'auto';
    axis.style.left = 'auto';
  });

  const rightAxis = element.querySelector<HTMLElement>('[data-year-axis="right"]');
  if (rightAxis) {
    rightAxis.style.display = 'flex';
  }
}

function collectPdfBreakIntervals(
  element: HTMLElement,
  direction: PdfCapturePlan['direction']
): PdfBreakInterval[] {
  const rootRect = element.getBoundingClientRect();
  const isVertical = direction === 'vertical';
  const candidates = element.querySelectorAll<HTMLElement>(
    '[data-event-label] .MuiTypography-root, [data-event-label] img, [data-year-label="true"]'
  );

  return Array.from(candidates, (candidate) => {
    const rect = candidate.getBoundingClientRect();
    const start = isVertical
      ? rect.top - rootRect.top
      : rect.left - rootRect.left;
    const end = isVertical
      ? rect.bottom - rootRect.top
      : rect.right - rootRect.left;
    return {
      start: start - PAGE_BREAK_CONTENT_MARGIN_PX,
      end: end + PAGE_BREAK_CONTENT_MARGIN_PX,
    };
  });
}

async function capturePdfPages(
  element: HTMLElement,
  html2canvas: typeof import('html2canvas').default,
  pdf: import('jspdf').jsPDF,
  onProgress?: PdfProgressCallback
): Promise<void> {
  const elementWidth = element.scrollWidth;
  const elementHeight = element.scrollHeight;
  const basePlan = computePdfCapturePlan(elementWidth, elementHeight);
  const plan = avoidPdfContentBreaks(
    basePlan,
    basePlan.direction === 'vertical' ? elementHeight : elementWidth,
    collectPdfBreakIntervals(element, basePlan.direction)
  );

  if (plan.pages.length === 0) {
    throw new AppMessageError('pdf.canvasFailed');
  }

  onProgress?.(0, plan.pages.length);

  for (let index = 0; index < plan.pages.length; index += 1) {
    const page = plan.pages[index];
    const canvas = await html2canvas(element, {
      scale: plan.scale,
      x: page.x,
      y: page.y,
      width: page.width,
      height: page.height,
      windowWidth: elementWidth,
      windowHeight: Math.ceil(page.height),
      scrollX: 0,
      scrollY: 0,
      useCORS: true,
      // taint されたキャンバスは toDataURL が失敗するため許可しない
      allowTaint: false,
      backgroundColor: '#ffffff',
      logging: false,
      ignoreElements: (candidate) => candidate.classList.contains('pdf-export-ignore'),
      onclone: (_clonedDocument, clonedElement) => {
        normalizeTimelineCloneForPdf(clonedElement);
      },
    });

    if (index > 0) pdf.addPage();

    // 小さい日本語文字の輪郭を保つため、JPEGではなく可逆PNGで格納する。
    const imageData = canvas.toDataURL('image/png');
    pdf.addImage(
      imageData,
      'PNG',
      0,
      0,
      page.pdfWidthMm,
      page.pdfHeightMm,
      undefined,
      'FAST'
    );

    // 次ページの描画前に大きなピクセルバッファを解放する。
    canvas.width = 1;
    canvas.height = 1;

    onProgress?.(index + 1, plan.pages.length);

    // 長い年表でも進捗リングがページ間で再描画できるようイベントループへ譲る。
    // 背景タブで停止し得る requestAnimationFrame は使わない。
    if (index + 1 < plan.pages.length) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
  }
}

export async function exportPdf(
  elementId: string,
  onProgress?: PdfProgressCallback
): Promise<void> {
  const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);

  let element: HTMLElement | null = null;
  let restoreTimelineScroll: (() => void) | null = null;

  try {
    element = document.getElementById(elementId);
    if (!element) {
      throw new AppMessageError('pdf.elementMissing');
    }

    element.classList.add('pdf-export');

    restoreTimelineScroll = resetTimelineScroll(element);
    await document.fonts.ready;

    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    await capturePdfPages(element, html2canvas, pdf, onProgress);

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    pdf.save(`timeline-export-${timestamp}.pdf`);
  } catch (error) {
    if (error instanceof AppMessageError) {
      throw error;
    }
    if (error instanceof Error) {
      throw new AppMessageError('pdf.exportFailed', { detail: error.message });
    }
    throw new AppMessageError('pdf.exportFailedGeneric');
  } finally {
    element?.classList.remove('pdf-export');
    restoreTimelineScroll?.();
  }
}
