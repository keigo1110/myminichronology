import { scaleLinear } from 'd3-scale';
import { TimelineData, PositionedEvent, DynamicLayoutConfig } from './types';

const MIN_LANE_WIDTH = 300;
const MAX_LANE_WIDTH = 500;
const TIMELINE_PADDING = 4;
const EVENT_VERTICAL_SPACING = 4;
const MIN_EVENT_HEIGHT = 12;
const MIN_YEAR_HEIGHT = 24;

function estimateTextWidth(text: string): number {
  // 日本語・全角文字は英数字の約2倍幅として計算
  const wideCharCount = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEF]/g) || []).length;
  const otherCharCount = text.length - wideCharCount;
  return wideCharCount * 10 + otherCharCount * 8;
}

function calculateOptimalLaneWidth(events: { start: number; end?: number; label: string }[]): number {
  let maxTextWidth = 0;

  events.forEach((event) => {
    const eventLabel = event.end
      ? `${event.start}年-${event.end}年：${event.label}`
      : `${event.start}年：${event.label}`;
    maxTextWidth = Math.max(maxTextWidth, estimateTextWidth(eventLabel));
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

function resolveEventCollisions(
  events: PositionedEvent[],
  contentHeight: number,
  yearHeightScale: number = 1
): PositionedEvent[] {
  const sortedEvents = [...events].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (a.end || a.start) - (b.end || b.start);
  });

  const resolvedEvents: PositionedEvent[] = [];
  const yearSlots = new Map<number, number[]>();
  const minGap = (MIN_EVENT_HEIGHT + EVENT_VERTICAL_SPACING) * yearHeightScale;

  sortedEvents.forEach((event) => {
    const startYear = event.start;
    const endYear = event.end || event.start;

    let bestY = event.y;
    let conflictFound = true;
    let attempts = 0;

    while (conflictFound && attempts < 20) {
      conflictFound = false;

      for (let year = startYear; year <= endYear; year++) {
        const slots = yearSlots.get(year) || [];
        for (const usedY of slots) {
          if (Math.abs(bestY - usedY) < minGap) {
            conflictFound = true;
            bestY = usedY + minGap;
            break;
          }
        }
        if (conflictFound) break;
      }

      attempts++;
    }

    // コンテナ外にはみ出さないようクランプ
    const maxY = Math.max(0, contentHeight - event.height);
    bestY = Math.min(Math.max(0, bestY), maxY);

    for (let year = startYear; year <= endYear; year++) {
      if (!yearSlots.has(year)) {
        yearSlots.set(year, []);
      }
      yearSlots.get(year)!.push(bestY);
    }

    resolvedEvents.push({ ...event, y: bestY });
  });

  return resolvedEvents;
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
  const yearAxisWidth = Math.min(200, Math.max(60, maxLaneWidth * 0.1));
  const totalWidth = yearAxisWidth + laneWidths.reduce((sum, width) => sum + width, 0);

  const timelineHeight = calculateDynamicHeight(data, yearRange, yearHeightScale);
  const headerHeight = 60;
  const contentHeight = timelineHeight - headerHeight;

  const yScale = scaleLinear()
    .domain([yearRange.min, yearRange.max])
    .range([0, contentHeight]);

  const positionedEvents: PositionedEvent[][] = [];
  let currentX = 0;

  data.forEach((lane, laneIndex) => {
    const laneWidth = laneWidths[laneIndex];
    const laneEvents: PositionedEvent[] = [];

    lane.events.forEach((event) => {
      const y = yScale(event.start);

      if (event.end) {
        const endY = yScale(event.end);
        laneEvents.push({
          ...event,
          x: currentX + TIMELINE_PADDING,
          y,
          width: laneWidth - TIMELINE_PADDING * 2,
          height: Math.max(MIN_EVENT_HEIGHT * yearHeightScale, endY - y),
        });
      } else {
        laneEvents.push({
          ...event,
          x: currentX + TIMELINE_PADDING,
          y,
          width: laneWidth - TIMELINE_PADDING * 2,
          height: MIN_EVENT_HEIGHT * yearHeightScale,
        });
      }
    });

    positionedEvents.push(resolveEventCollisions(laneEvents, contentHeight, yearHeightScale));
    currentX += laneWidth;
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
  const yearAxisWidth = Math.min(200, Math.max(60, maxLaneWidth * 0.1));

  return yearAxisWidth + laneWidths.reduce((sum, width) => sum + width, 0);
}

export { deriveYearRange };
