import { scaleLinear } from 'd3-scale';
import { TimelineData, PositionedEvent, DynamicLayoutConfig } from './types';

const MIN_LANE_WIDTH = 300;
const MAX_LANE_WIDTH = 500;
const TIMELINE_PADDING = 4;
const EVENT_VERTICAL_SPACING = 4;
const EVENT_COLUMN_GAP = 6;
const MIN_EVENT_HEIGHT = 22;
const MIN_YEAR_HEIGHT = 24;
export const TIMELINE_HEADER_HEIGHT = 52;

/** EventItem の期間バー幅と揃える */
export const RANGE_BAR_WIDTH_PX = 6;
export const RANGE_BAR_WIDTH_VERTICAL_PX = 14;
const VERTICAL_RANGE_HEIGHT_THRESHOLD = 72;

function estimateTextWidth(text: string, fontSizePx = 11): number {
  const wideCharCount = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEF]/g) || []).length;
  const otherCharCount = text.length - wideCharCount;
  const wide = fontSizePx * 1.05;
  const narrow = fontSizePx * 0.62;
  return wideCharCount * wide + otherCharCount * narrow;
}

function calculateOptimalLaneWidth(events: { start: number; end?: number; label: string; fontSize?: number }[]): number {
  let maxTextWidth = 0;

  events.forEach((event) => {
    const fontSize = event.fontSize ?? 11;
    maxTextWidth = Math.max(maxTextWidth, estimateTextWidth(event.label, fontSize) + 40);
  });

  const requiredWidth = maxTextWidth + 80;
  return Math.min(MAX_LANE_WIDTH, Math.max(MIN_LANE_WIDTH, requiredWidth));
}

function analyzeEventDensity(data: TimelineData, yearRange: { min: number; max: number }) {
  const yearEventCounts = new Map<number, number>();
  const yearMaxEventsPerLane = new Map<number, number>();

  for (let year = yearRange.min; year <= yearRange.max; year++) {
    yearEventCounts.set(year, 0);
    yearMaxEventsPerLane.set(year, 0);
  }

  data.forEach((lane) => {
    const laneYearCounts = new Map<number, number>();

    lane.events.forEach((event) => {
      const startYear = event.start;
      const endYear = event.end || event.start;

      for (let year = startYear; year <= endYear; year++) {
        if (year < yearRange.min || year > yearRange.max) continue;
        yearEventCounts.set(year, (yearEventCounts.get(year) || 0) + 1);
        laneYearCounts.set(year, (laneYearCounts.get(year) || 0) + 1);
      }
    });

    laneYearCounts.forEach((count, year) => {
      yearMaxEventsPerLane.set(year, Math.max(yearMaxEventsPerLane.get(year) || 0, count));
    });
  });

  return { yearEventCounts, yearMaxEventsPerLane };
}

function calculateDynamicHeight(
  data: TimelineData,
  yearRange: { min: number; max: number },
  yearHeightScale: number = 1
): number {
  const { yearMaxEventsPerLane } = analyzeEventDensity(data, yearRange);
  let totalRequiredHeight = 0;

  for (let year = yearRange.min; year <= yearRange.max; year++) {
    const maxEventsInYear = yearMaxEventsPerLane.get(year) || 0;
    const yearHeight = Math.max(
      MIN_YEAR_HEIGHT * yearHeightScale,
      (MIN_EVENT_HEIGHT + Math.max(0, maxEventsInYear - 1) * (MIN_EVENT_HEIGHT + EVENT_VERTICAL_SPACING)) *
        yearHeightScale
    );
    totalRequiredHeight += yearHeight;
  }

  return Math.max(800, totalRequiredHeight + TIMELINE_PADDING * 2);
}

function timeRangesOverlap(a: PositionedEvent, b: PositionedEvent): boolean {
  const aEnd = a.end ?? a.start;
  const bEnd = b.end ?? b.start;
  return a.start <= bEnd && b.start <= aEnd;
}

function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number }
): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function estimateEventVisualWidth(event: PositionedEvent, laneWidth: number): number {
  const fontSize = event.fontSize ?? 11;
  const maxWidth = Math.max(40, laneWidth - TIMELINE_PADDING * 2);

  if (event.end) {
    if (event.height >= VERTICAL_RANGE_HEIGHT_THRESHOLD) {
      // バー + 縦書き1列
      return Math.min(maxWidth, RANGE_BAR_WIDTH_VERTICAL_PX + 4 + fontSize + 8);
    }
    return Math.min(
      maxWidth,
      RANGE_BAR_WIDTH_PX + 6 + estimateTextWidth(event.label, fontSize) + 8
    );
  }

  return Math.min(maxWidth, estimateTextWidth(event.label, fontSize) + 12);
}

/**
 * レーン内で期間が重なるイベントを横に並べ、必要なら縦にもずらす。
 * x はレーン相対座標。
 */
function resolveEventCollisions(
  events: PositionedEvent[],
  laneWidth: number,
  contentHeight: number,
  yearHeightScale: number = 1
): PositionedEvent[] {
  const sortedEvents = [...events].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    const aDur = (a.end ?? a.start) - a.start;
    const bDur = (b.end ?? b.start) - b.start;
    if (aDur !== bDur) return bDur - aDur; // 長い期間を左に
    return a.label.localeCompare(b.label);
  });

  const resolved: PositionedEvent[] = [];
  const minYGap = (MIN_EVENT_HEIGHT + EVENT_VERTICAL_SPACING) * yearHeightScale;
  const usableWidth = Math.max(40, laneWidth - TIMELINE_PADDING);

  sortedEvents.forEach((event) => {
    const visualWidth = estimateEventVisualWidth(event, laneWidth);
    let bestX = TIMELINE_PADDING;
    let bestY = event.y;
    const height = Math.min(event.height, contentHeight);

    const overlapping = resolved.filter((placed) => timeRangesOverlap(event, placed));

    let placed = false;
    for (let attempt = 0; attempt < 40 && !placed; attempt++) {
      let conflict = false;
      const candidate = { x: bestX, y: bestY, width: visualWidth, height };

      for (const other of overlapping) {
        if (boxesOverlap(candidate, other)) {
          conflict = true;
          bestX = other.x + other.width + EVENT_COLUMN_GAP;
          if (bestX + visualWidth > usableWidth) {
            bestX = TIMELINE_PADDING;
            bestY = Math.max(bestY, other.y + Math.min(other.height, minYGap * 2)) + minYGap * 0.25;
            // 点イベント同士の軽い縦ずらし
            if (!event.end) {
              bestY = other.y + minYGap;
            }
          }
          break;
        }
      }

      if (!conflict) {
        placed = true;
      }
    }

    bestX = Math.min(bestX, Math.max(TIMELINE_PADDING, usableWidth - visualWidth));
    bestY = Math.min(Math.max(0, bestY), Math.max(0, contentHeight - height));

    resolved.push({
      ...event,
      x: bestX,
      y: bestY,
      width: visualWidth,
      height,
    });
  });

  return resolved;
}

function deriveYearRange(data: TimelineData): { min: number; max: number } {
  let minYear = Infinity;
  let maxYear = -Infinity;

  data.forEach((lane) => {
    lane.events.forEach((event) => {
      minYear = Math.min(minYear, event.start);
      maxYear = Math.max(maxYear, event.end ?? event.start);
    });
  });

  if (!Number.isFinite(minYear) || !Number.isFinite(maxYear)) {
    return { min: 0, max: 0 };
  }

  return {
    min: Math.floor(minYear / 10) * 10,
    max: Math.ceil(maxYear / 10) * 10,
  };
}

export function computeLayout(
  data: TimelineData,
  yearHeightScale: number = 1,
  yearRangeOverride?: { min: number; max: number }
): {
  positionedEvents: PositionedEvent[][];
  layoutConfig: DynamicLayoutConfig;
  yearRange: { min: number; max: number };
} {
  if (data.length === 0) {
    return {
      positionedEvents: [],
      layoutConfig: {
        laneWidths: [],
        laneWidthByName: {},
        yearAxisWidth: 60,
        totalWidth: 120,
      },
      yearRange: { min: 0, max: 0 },
    };
  }

  const yearRange = yearRangeOverride ?? deriveYearRange(data);
  const laneWidths = data.map((lane) => calculateOptimalLaneWidth(lane.events));
  const laneWidthByName: Record<string, number> = {};
  data.forEach((lane, index) => {
    laneWidthByName[lane.name] = laneWidths[index];
  });

  const maxLaneWidth = Math.max(...laneWidths);
  const yearAxisWidth = Math.min(72, Math.max(48, maxLaneWidth * 0.08));
  const totalWidth = yearAxisWidth * 2 + laneWidths.reduce((sum, width) => sum + width, 0);

  const timelineHeight = calculateDynamicHeight(data, yearRange, yearHeightScale);
  const contentHeight = timelineHeight - TIMELINE_HEADER_HEIGHT;

  const yScale = scaleLinear()
    .domain([yearRange.min, yearRange.max])
    .range([0, contentHeight]);

  const positionedEvents: PositionedEvent[][] = [];

  data.forEach((lane, laneIndex) => {
    const laneWidth = laneWidths[laneIndex];
    const laneEvents: PositionedEvent[] = [];

    lane.events.forEach((event) => {
      const y = yScale(event.start);

      if (event.end) {
        const endY = yScale(event.end);
        laneEvents.push({
          ...event,
          x: TIMELINE_PADDING,
          y,
          width: laneWidth - TIMELINE_PADDING * 2,
          height: Math.max(MIN_EVENT_HEIGHT * yearHeightScale, endY - y),
        });
      } else {
        laneEvents.push({
          ...event,
          x: TIMELINE_PADDING,
          y,
          width: laneWidth - TIMELINE_PADDING * 2,
          height: MIN_EVENT_HEIGHT * yearHeightScale,
        });
      }
    });

    positionedEvents.push(
      resolveEventCollisions(laneEvents, laneWidth, contentHeight, yearHeightScale)
    );
  });

  return {
    positionedEvents,
    layoutConfig: {
      laneWidths,
      laneWidthByName,
      yearAxisWidth,
      totalWidth,
      timelineHeight,
    },
    yearRange,
  };
}

export function calculateTimelineHeight(data: TimelineData, yearHeightScale: number = 1): number {
  if (data.length === 0) return 800;
  const yearRange = deriveYearRange(data);
  return calculateDynamicHeight(data, yearRange, yearHeightScale);
}

export function calculateTimelineWidth(data: TimelineData): number {
  if (data.length === 0) return 120;

  const laneWidths = data.map((lane) => calculateOptimalLaneWidth(lane.events));
  const maxLaneWidth = Math.max(...laneWidths);
  const yearAxisWidth = Math.min(72, Math.max(48, maxLaneWidth * 0.08));

  return yearAxisWidth * 2 + laneWidths.reduce((sum, width) => sum + width, 0);
}

export { deriveYearRange };
