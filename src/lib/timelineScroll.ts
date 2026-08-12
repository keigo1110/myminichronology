interface CenteredScrollOffsetInput {
  currentScroll: number;
  targetStart: number;
  targetSize: number;
  viewportStart: number;
  viewportSize: number;
  maxScroll: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * ビューポートと対象の中心を揃えるスクロール量を計算する。
 * DOM から独立させ、巨大年表の端でも確実にクランプできるようにする。
 */
export function getCenteredScrollOffset({
  currentScroll,
  targetStart,
  targetSize,
  viewportStart,
  viewportSize,
  maxScroll,
}: CenteredScrollOffsetInput): number {
  const targetCenter = targetStart + targetSize / 2;
  const viewportCenter = viewportStart + viewportSize / 2;
  return clamp(currentScroll + targetCenter - viewportCenter, 0, Math.max(0, maxScroll));
}

function getHorizontalOffset(container: HTMLElement, targetRect: DOMRect): number {
  if (container.scrollWidth <= container.clientWidth + 1) return container.scrollLeft;
  const containerRect = container.getBoundingClientRect();
  return getCenteredScrollOffset({
    currentScroll: container.scrollLeft,
    targetStart: targetRect.left,
    targetSize: targetRect.width,
    viewportStart: containerRect.left,
    viewportSize: container.clientWidth,
    maxScroll: container.scrollWidth - container.clientWidth,
  });
}

function getFullyVisibleOffset(
  currentScroll: number,
  targetStart: number,
  targetSize: number,
  viewportStart: number,
  viewportSize: number,
  maxScroll: number
): number {
  if (targetSize >= viewportSize) {
    return clamp(currentScroll + targetStart - viewportStart, 0, Math.max(0, maxScroll));
  }
  return getCenteredScrollOffset({
    currentScroll,
    targetStart,
    targetSize,
    viewportStart,
    viewportSize,
    maxScroll,
  });
}

function intersectsViewport(rect: DOMRect, viewportRect: DOMRect): boolean {
  return rect.bottom > viewportRect.top && rect.top < viewportRect.bottom;
}

function getVerticalViewportBounds(
  container: HTMLElement,
  viewportRect: DOMRect
): { start: number; size: number } {
  let start = viewportRect.top;
  let end = viewportRect.bottom;
  const stickyTop = container.querySelector<HTMLElement>(
    '[data-lane-header-row], [data-year-axis="top"]'
  );
  const stickyBottom = container.querySelector<HTMLElement>('[data-year-axis="bottom"]');

  if (stickyTop) {
    const rect = stickyTop.getBoundingClientRect();
    if (intersectsViewport(rect, viewportRect)) start = Math.max(start, rect.bottom);
  }
  if (stickyBottom) {
    const rect = stickyBottom.getBoundingClientRect();
    if (intersectsViewport(rect, viewportRect)) end = Math.min(end, rect.top);
  }

  return { start, size: Math.max(1, end - start) };
}

/**
 * 年表の単一ビューポートを横・縦とも同時に動かす。
 * scrollIntoView は巨大な年表内部を基準にして検索結果を画面外へ残したり、
 * sticky な年軸・レーン見出しを無効化したりするため使用しない。
 */
export function scrollTimelineEventIntoView(
  eventId: string,
  behavior: ScrollBehavior = 'auto'
): boolean {
  const target = document.getElementById(eventId);
  if (!target) return false;

  const targetRect = target.getBoundingClientRect();
  const viewportScroller = target.closest<HTMLElement>('[data-timeline-viewport]');
  if (viewportScroller) {
    const viewportRect = viewportScroller.getBoundingClientRect();
    const verticalViewport = getVerticalViewportBounds(viewportScroller, viewportRect);
    const left = getHorizontalOffset(viewportScroller, targetRect);
    const top = getFullyVisibleOffset(
      viewportScroller.scrollTop,
      targetRect.top,
      targetRect.height,
      verticalViewport.start,
      verticalViewport.size,
      viewportScroller.scrollHeight - viewportScroller.clientHeight
    );
    viewportScroller.scrollTo({
      left,
      top,
      behavior,
    });
  }
  return true;
}
