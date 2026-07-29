import { scaleLinear } from 'd3-scale';
import { Event, TimelineData, PositionedEvent, DynamicLayoutConfig } from './types';

const MIN_LANE_WIDTH = 280;
const MAX_LANE_WIDTH = 640;
const TIMELINE_PADDING = 4;
const EVENT_VERTICAL_SPACING = 4;
const EVENT_COLUMN_GAP = 6;
const MIN_EVENT_HEIGHT = 22;
const MIN_YEAR_HEIGHT = 24;
const FONT_LINE_HEIGHT = 1.25;
const FONT_HEIGHT_PADDING = 6;
const LABEL_HEIGHT_PADDING = 12;
const COLLISION_MAX_ATTEMPTS = 80;

export const TIMELINE_HEADER_HEIGHT = 52;

/** EventItem の期間バー幅（細い線。縦labelボックスと区別する） */
export const RANGE_BAR_WIDTH_PX = 2;
export const RANGE_BAR_WIDTH_VERTICAL_PX = 2;
/** この高さ以上で縦書き（layout / EventItem 共通） */
export const VERTICAL_RANGE_HEIGHT_THRESHOLD = 72;

type Rect = { x: number; y: number; width: number; height: number };

/** label は表示上ポイント扱い（C列の期間はサイズ・密度に使わない） */
export function layoutOccupancyEnd(event: Event): number {
  if (event.displayStyle === 'label') return event.start;
  return event.end ?? event.start;
}

/** フォントが切れない最低高さ */
export function minHeightForFont(fontSizePx: number, yearHeightScale = 1): number {
  const textHeight = Math.ceil(fontSizePx * FONT_LINE_HEIGHT) + FONT_HEIGHT_PADDING;
  return Math.max(MIN_EVENT_HEIGHT * yearHeightScale, textHeight);
}

function estimateTextWidth(text: string, fontSizePx = 11): number {
  const wideCharCount = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\uFF00-\uFFEF]/g) || []).length;
  const otherCharCount = text.length - wideCharCount;
  const wide = fontSizePx * 1.05;
  const narrow = fontSizePx * 0.62;
  return wideCharCount * wide + otherCharCount * narrow;
}

/** label スタイル: 期間ではなく文字サイズでボックス寸法を決める（縦書き1列） */
export function estimateLabelBoxDimensions(event: {
  label: string;
  fontSize?: number;
}): { width: number; height: number } {
  const fontSize = event.fontSize ?? 12;
  const lineHeight = fontSize * FONT_LINE_HEIGHT;
  const charCount = Math.max(1, event.label.length);
  return {
    width: Math.max(MIN_EVENT_HEIGHT, fontSize + 10, fontSize * 1.35 + 8),
    height: Math.max(MIN_EVENT_HEIGHT, charCount * lineHeight + LABEL_HEIGHT_PADDING),
  };
}

function defaultFontSize(event: Event, forVertical = false): number {
  if (event.fontSize != null) return event.fontSize;
  if (event.displayStyle === 'label' || forVertical) return 12;
  return 11;
}

/**
 * イベントの表示サイズ（衝突判定・描画で共通）。
 * yearPxPerYear が分かっているときは期間イベントの高さを年スケールで決める。
 */
export function measureEventSize(
  event: Event,
  options: {
    yearPxPerYear?: number;
    yearHeightScale?: number;
    provisionalRangeHeight?: number;
  } = {}
): { width: number; height: number } {
  const yearHeightScale = options.yearHeightScale ?? 1;

  if (event.displayStyle === 'label') {
    return estimateLabelBoxDimensions(event);
  }

  const fontSize = defaultFontSize(event);
  const minH = minHeightForFont(fontSize, yearHeightScale);

  if (event.end != null) {
    const spanYears = Math.max(0, event.end - event.start);
    const rangeHeight =
      options.provisionalRangeHeight ??
      (options.yearPxPerYear != null
        ? Math.max(minH, spanYears * options.yearPxPerYear)
        : minH);
    const height = Math.max(minH, rangeHeight);
    // 期間は常に細い線＋テキスト幅（縦でも線のまま）
    const width = RANGE_BAR_WIDTH_PX + 6 + estimateTextWidth(event.label, fontSize) + 8;
    return { width, height };
  }

  return {
    width: estimateTextWidth(event.label, fontSize) + 12,
    height: minH,
  };
}

function estimateMaxSimultaneousColumns(events: Event[]): number {
  if (events.length === 0) return 1;

  type Edge = { year: number; delta: number };
  const edges: Edge[] = [];

  events.forEach((event) => {
    const start = event.start;
    const end = layoutOccupancyEnd(event);
    edges.push({ year: start, delta: 1 });
    edges.push({ year: end + 1, delta: -1 });
  });

  edges.sort((a, b) => a.year - b.year || a.delta - b.delta);

  let active = 0;
  let maxActive = 0;
  for (const edge of edges) {
    active += edge.delta;
    maxActive = Math.max(maxActive, active);
  }
  return Math.max(1, maxActive);
}

function calculateOptimalLaneWidth(events: Event[]): number {
  let maxItemWidth = 0;
  events.forEach((event) => {
    const size = measureEventSize(event, { yearHeightScale: 1, provisionalRangeHeight: VERTICAL_RANGE_HEIGHT_THRESHOLD });
    maxItemWidth = Math.max(maxItemWidth, size.width);
  });

  const columns = estimateMaxSimultaneousColumns(events);
  // 横に並ぶ想定幅 + 余白。上限内で可能な限り確保
  const packedWidth =
    TIMELINE_PADDING * 2 +
    columns * maxItemWidth +
    Math.max(0, columns - 1) * EVENT_COLUMN_GAP +
    24;

  const textDriven = maxItemWidth + 80;
  const requiredWidth = Math.max(textDriven, packedWidth);
  return Math.min(MAX_LANE_WIDTH, Math.max(MIN_LANE_WIDTH, requiredWidth));
}

/**
 * 年ごとの必要高さ: その年に「視覚的に掛かる」イベントの最大高さを考慮。
 * label は開始年付近のみ（期間は無視）。
 */
function calculateDynamicHeight(
  data: TimelineData,
  yearRange: { min: number; max: number },
  yearHeightScale: number = 1
): number {
  const yearCount = Math.max(1, yearRange.max - yearRange.min);
  // 暫定: 均等配分で yearPx を見積もり、視覚高さを年バケットに分配
  const provisionalContent = Math.max(
    800 - TIMELINE_HEADER_HEIGHT,
    yearCount * MIN_YEAR_HEIGHT * yearHeightScale
  );
  const yearPxPerYear = provisionalContent / yearCount;

  const yearBudgets = new Map<number, number>();
  for (let year = yearRange.min; year <= yearRange.max; year++) {
    yearBudgets.set(year, MIN_YEAR_HEIGHT * yearHeightScale);
  }

  data.forEach((lane) => {
    lane.events.forEach((event) => {
      const size = measureEventSize(event, { yearPxPerYear, yearHeightScale });
      const start = event.start;
      const end = layoutOccupancyEnd(event);

      if (event.displayStyle === 'label' || event.end == null) {
        // ポイント的: 開始年を中心に高さを配分
        const coverYears = Math.max(1, Math.ceil(size.height / Math.max(yearPxPerYear, 1)));
        for (let i = 0; i < coverYears; i++) {
          const year = start + i;
          if (year < yearRange.min || year > yearRange.max) continue;
          const share = size.height / coverYears;
          yearBudgets.set(year, Math.max(yearBudgets.get(year) || 0, share));
        }
      } else {
        for (let year = start; year <= end; year++) {
          if (year < yearRange.min || year > yearRange.max) continue;
          // 期間バーは年あたり yearPx。フォント最低高さも確保
          yearBudgets.set(
            year,
            Math.max(yearBudgets.get(year) || 0, Math.max(MIN_YEAR_HEIGHT * yearHeightScale, yearPxPerYear))
          );
        }
        // 短い期間でもフォント分は開始年に確保
        const fontSize = defaultFontSize(event);
        yearBudgets.set(
          start,
          Math.max(yearBudgets.get(start) || 0, minHeightForFont(fontSize, yearHeightScale))
        );
      }
    });
  });

  let total = 0;
  for (let year = yearRange.min; year <= yearRange.max; year++) {
    total += yearBudgets.get(year) || MIN_YEAR_HEIGHT * yearHeightScale;
  }

  // ヘッダー分を足したうえでコンテンツが足りるよう
  return Math.max(800, total + TIMELINE_PADDING * 2 + TIMELINE_HEADER_HEIGHT);
}

function boxesOverlap(a: Rect, b: Rect): boolean {
  return !(
    a.x + a.width <= b.x ||
    b.x + b.width <= a.x ||
    a.y + a.height <= b.y ||
    b.y + b.height <= a.y
  );
}

function layoutSortKey(event: Event): { start: number; duration: number; label: string } {
  const end = layoutOccupancyEnd(event);
  return {
    start: event.start,
    duration: end - event.start,
    label: event.label,
  };
}

/**
 * レーン内で矩形が重なるイベントを横に並べ、収まらなければ下へ退避。
 * x はレーン相対座標。
 */
export function resolveEventCollisions(
  events: PositionedEvent[],
  laneWidth: number,
  contentHeight: number
): PositionedEvent[] {
  const sortedEvents = [...events].sort((a, b) => {
    const ka = layoutSortKey(a);
    const kb = layoutSortKey(b);
    if (ka.start !== kb.start) return ka.start - kb.start;
    if (ka.duration !== kb.duration) return kb.duration - ka.duration;
    // 期間バーを左、点・label を右寄りに
    const aIsRange = a.displayStyle !== 'label' && a.end != null;
    const bIsRange = b.displayStyle !== 'label' && b.end != null;
    if (aIsRange !== bIsRange) return aIsRange ? -1 : 1;
    return ka.label.localeCompare(kb.label);
  });

  const resolved: PositionedEvent[] = [];
  const usableWidth = Math.max(40, laneWidth - TIMELINE_PADDING);

  sortedEvents.forEach((event) => {
    const width = Math.min(event.width, usableWidth - TIMELINE_PADDING);
    const height = Math.min(Math.max(event.height, MIN_EVENT_HEIGHT), contentHeight);
    let bestX = TIMELINE_PADDING;
    let bestY = Math.max(0, Math.min(event.y, Math.max(0, contentHeight - height)));

    let placed = false;
    for (let attempt = 0; attempt < COLLISION_MAX_ATTEMPTS && !placed; attempt++) {
      const candidate: Rect = { x: bestX, y: bestY, width, height };
      let blocker: PositionedEvent | null = null;

      for (const other of resolved) {
        if (boxesOverlap(candidate, other)) {
          blocker = other;
          break;
        }
      }

      if (!blocker) {
        placed = true;
        break;
      }

      // 右へずらす
      const nextX = blocker.x + blocker.width + EVENT_COLUMN_GAP;
      if (nextX + width <= usableWidth) {
        bestX = nextX;
        continue;
      }

      // レーン幅に収まらない → 衝突している全矩形の下端の下へ
      bestX = TIMELINE_PADDING;
      let clearY = blocker.y + blocker.height + EVENT_VERTICAL_SPACING;
      for (const other of resolved) {
        const sameBand = !(
          bestY + height <= other.y ||
          other.y + other.height <= bestY
        );
        // 現在行付近と重なり得るものも考慮して下端を取る
        if (boxesOverlap({ x: bestX, y: bestY, width: usableWidth, height }, other) || sameBand) {
          clearY = Math.max(clearY, other.y + other.height + EVENT_VERTICAL_SPACING);
        }
      }
      bestY = Math.min(clearY, Math.max(0, contentHeight - height));

      // これ以上下がれない場合は右端寄せで最小重なりを試す
      if (bestY === Math.max(0, contentHeight - height) && clearY > bestY) {
        bestX = Math.max(TIMELINE_PADDING, usableWidth - width);
      }
    }

    // 最終位置でも重なりがあれば、全 resolved の最大下端へ強制退避
    let finalRect: Rect = { x: bestX, y: bestY, width, height };
    const stillOverlapping = resolved.some((other) => boxesOverlap(finalRect, other));
    if (stillOverlapping) {
      const maxBottom = resolved.reduce(
        (max, other) => Math.max(max, other.y + other.height),
        0
      );
      bestX = TIMELINE_PADDING;
      bestY = Math.min(maxBottom + EVENT_VERTICAL_SPACING, Math.max(0, contentHeight - height));
      finalRect = { x: bestX, y: bestY, width, height };
    }

    resolved.push({
      ...event,
      x: finalRect.x,
      y: finalRect.y,
      width: finalRect.width,
      height: finalRect.height,
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
      // 年レンジには end を含める（フィルタ用）。label でもデータ上の end は残す
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
  const contentHeight = Math.max(100, timelineHeight - TIMELINE_HEADER_HEIGHT);
  const yearSpan = Math.max(1, yearRange.max - yearRange.min);
  const yearPxPerYear = contentHeight / yearSpan;

  const yScale = scaleLinear()
    .domain([yearRange.min, yearRange.max])
    .range([0, contentHeight]);

  const positionedEvents: PositionedEvent[][] = [];

  data.forEach((lane, laneIndex) => {
    const laneWidth = laneWidths[laneIndex];
    const laneEvents: PositionedEvent[] = [];

    lane.events.forEach((event) => {
      const y = yScale(event.start);
      let size: { width: number; height: number };

      if (event.displayStyle === 'label') {
        size = estimateLabelBoxDimensions(event);
      } else if (event.end != null) {
        // 期間の高さ = 開始〜終了の年スケール差（最低でもフォント分）
        const endY = yScale(event.end);
        const rangeHeight = Math.max(
          minHeightForFont(defaultFontSize(event), yearHeightScale),
          Math.max(endY - y, yearPxPerYear * Math.max(0.5, event.end - event.start))
        );
        size = measureEventSize(event, {
          yearHeightScale,
          provisionalRangeHeight: rangeHeight,
        });
        size = { ...size, height: rangeHeight };
      } else {
        size = measureEventSize(event, { yearHeightScale });
      }

      laneEvents.push({
        ...event,
        x: TIMELINE_PADDING,
        y,
        width: Math.min(size.width, Math.max(24, laneWidth - TIMELINE_PADDING * 2)),
        height: size.height,
      });
    });

    positionedEvents.push(resolveEventCollisions(laneEvents, laneWidth, contentHeight));
  });

  // 衝突退避で content 下端を超えた分があれば timeline を伸ばす余地は描画側の overflow に任せる
  // （年位置の意味を保つため、ここでは y を年スケール優先で維持し collision のみ微調整）

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
