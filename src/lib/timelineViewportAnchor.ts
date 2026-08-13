import {
  LANE_LABEL_WIDTH_HORIZONTAL,
  TIMELINE_HEADER_HEIGHT,
  mapPositionToYear,
  mapYearToPosition,
} from './computeLayout';
import type {
  DynamicLayoutConfig,
  TimelineOrientation,
} from './types';

export interface TimelineViewportAnchor {
  orientation: TimelineOrientation;
  year: number;
  axisViewportOffset: number;
  crossAxisProgress: number;
}

interface TimelineViewportAnchorOptions {
  viewport: HTMLElement;
  timeline: HTMLElement;
  orientation: TimelineOrientation;
  yearRange: { min: number; max: number };
  layoutConfig: DynamicLayoutConfig;
}

function scrollProgress(position: number, scrollSize: number, clientSize: number): number {
  const maximum = Math.max(0, scrollSize - clientSize);
  return maximum > 0 ? Math.max(0, Math.min(1, position / maximum)) : 0;
}

function resolveAxisContentSize(
  timeline: HTMLElement,
  orientation: TimelineOrientation,
  layoutConfig: DynamicLayoutConfig
): number {
  if (orientation === 'horizontal') {
    return Math.max(
      1,
      layoutConfig.yearContentWidth ??
        layoutConfig.totalWidth -
          (layoutConfig.laneLabelWidth ?? LANE_LABEL_WIDTH_HORIZONTAL)
    );
  }

  return Math.max(
    1,
    (layoutConfig.timelineHeight ?? timeline.scrollHeight) -
      TIMELINE_HEADER_HEIGHT
  );
}

export function captureTimelineViewportAnchor({
  viewport,
  timeline,
  orientation,
  yearRange,
  layoutConfig,
}: TimelineViewportAnchorOptions): TimelineViewportAnchor {
  const viewportRect = viewport.getBoundingClientRect();
  const timelineRect = timeline.getBoundingClientRect();
  const contentSize = resolveAxisContentSize(timeline, orientation, layoutConfig);

  if (orientation === 'horizontal') {
    const axisViewportOffset = viewport.clientWidth / 2;
    const labelOffset = layoutConfig.laneLabelWidth ?? LANE_LABEL_WIDTH_HORIZONTAL;
    const contentPosition =
      viewportRect.left + axisViewportOffset - timelineRect.left - labelOffset;

    return {
      orientation,
      year: mapPositionToYear(contentPosition, yearRange, contentSize),
      axisViewportOffset,
      crossAxisProgress: scrollProgress(
        viewport.scrollTop,
        viewport.scrollHeight,
        viewport.clientHeight
      ),
    };
  }

  const axisViewportOffset = viewport.clientHeight / 2;
  const contentPosition =
    viewportRect.top +
    axisViewportOffset -
    timelineRect.top -
    TIMELINE_HEADER_HEIGHT;

  return {
    orientation,
    year: mapPositionToYear(
      contentPosition,
      yearRange,
      contentSize,
      layoutConfig.yearScale
    ),
    axisViewportOffset,
    crossAxisProgress: scrollProgress(
      viewport.scrollLeft,
      viewport.scrollWidth,
      viewport.clientWidth
    ),
  };
}

export function restoreTimelineViewportAnchor(
  options: TimelineViewportAnchorOptions,
  anchor: TimelineViewportAnchor
): boolean {
  const { viewport, timeline, orientation, yearRange, layoutConfig } = options;
  if (anchor.orientation !== orientation) return false;

  const viewportRect = viewport.getBoundingClientRect();
  const timelineRect = timeline.getBoundingClientRect();
  const contentSize = resolveAxisContentSize(timeline, orientation, layoutConfig);

  if (orientation === 'horizontal') {
    const labelOffset = layoutConfig.laneLabelWidth ?? LANE_LABEL_WIDTH_HORIZONTAL;
    const targetClientPosition =
      timelineRect.left +
      labelOffset +
      mapYearToPosition(anchor.year, yearRange, contentSize);
    const desiredClientPosition = viewportRect.left + anchor.axisViewportOffset;
    viewport.scrollLeft += targetClientPosition - desiredClientPosition;
    viewport.scrollTop =
      anchor.crossAxisProgress *
      Math.max(0, viewport.scrollHeight - viewport.clientHeight);
    return true;
  }

  const targetClientPosition =
    timelineRect.top +
    TIMELINE_HEADER_HEIGHT +
    mapYearToPosition(
      anchor.year,
      yearRange,
      contentSize,
      layoutConfig.yearScale
    );
  const desiredClientPosition = viewportRect.top + anchor.axisViewportOffset;
  viewport.scrollTop += targetClientPosition - desiredClientPosition;
  viewport.scrollLeft =
    anchor.crossAxisProgress *
    Math.max(0, viewport.scrollWidth - viewport.clientWidth);
  return true;
}
