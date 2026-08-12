import { scaleLinear } from 'd3-scale';
import type {
  Event,
  TimelineData,
  PositionedEvent,
  DynamicLayoutConfig,
  TimelineOrientation,
  AdaptiveYearScale,
} from './types';

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
const YEAR_BAND_EDGE_PADDING = 4;
const TEXT_WIDTH_SAFETY_PADDING = 8;
const SINGLE_YEAR_CONTEXT_SPAN = 10;
const MAX_ADAPTIVE_FEEDBACK_PASSES = 8;

export const TIMELINE_HEADER_HEIGHT = 52;

/** EventItem の期間バー幅（細い線。縦labelボックスと区別する） */
export const RANGE_BAR_WIDTH_PX = 2;
export const RANGE_BAR_WIDTH_VERTICAL_PX = 2;
/** この高さ以上で縦書き（layout / EventItem 共通） */
export const VERTICAL_RANGE_HEIGHT_THRESHOLD = 72;

/** G列画像の固定表示枠（実寸に依存せずレイアウトを安定させる） */
export const EVENT_IMAGE_MAX_WIDTH = 72;
export const EVENT_IMAGE_MAX_HEIGHT = 54;
export const EVENT_IMAGE_GAP = 4;

type Rect = { x: number; y: number; width: number; height: number };

/**
 * 画像スロットをサイズに足す。
 * beside: 横に並べる / below: 下に積む
 * expandPrimary: true なら主軸も画像枠に合わせて広げる（点イベント向け）。
 * false なら期間バー寸法を保ち、画像分だけ副軸を伸ばす。
 */
export function applyImageSlot(
  size: { width: number; height: number },
  hasImage: boolean,
  placement: 'beside' | 'below' = 'beside',
  expandPrimary = true
): { width: number; height: number } {
  if (!hasImage) return size;
  if (placement === 'below') {
    return {
      width: expandPrimary ? Math.max(size.width, EVENT_IMAGE_MAX_WIDTH) : size.width,
      height: size.height + EVENT_IMAGE_GAP + EVENT_IMAGE_MAX_HEIGHT,
    };
  }
  return {
    width: size.width + EVENT_IMAGE_GAP + EVENT_IMAGE_MAX_WIDTH,
    height: expandPrimary ? Math.max(size.height, EVENT_IMAGE_MAX_HEIGHT) : size.height,
  };
}

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

function fitPointEventToWidth(
  event: Event,
  size: { width: number; height: number },
  maxWidth: number,
  yearHeightScale: number
): { width: number; height: number } {
  if (event.displayStyle === 'label' || event.end != null || size.width <= maxWidth) {
    return size;
  }

  const fontSize = defaultFontSize(event);
  const imageWidth = event.imageUrl ? EVENT_IMAGE_MAX_WIDTH + EVENT_IMAGE_GAP : 0;
  const textWidth = estimateTextWidth(event.label, fontSize) + 12;
  const availableTextWidth = Math.max(24, maxWidth - imageWidth - 12);
  const lineCount = Math.max(1, Math.ceil(textWidth / availableTextWidth));
  const wrappedTextHeight =
    Math.ceil(lineCount * fontSize * FONT_LINE_HEIGHT) + FONT_HEIGHT_PADDING;

  return {
    width: maxWidth,
    height: Math.max(
      size.height,
      minHeightForFont(fontSize, yearHeightScale),
      lineCount > 1 ? 40 : 0,
      wrappedTextHeight
    ),
  };
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
    /** 画像を下に積む（横型の期間イベント向け） */
    imagePlacement?: 'beside' | 'below';
    /** 期間ラベルを縦書きとして幅を狭く測る */
    preferVerticalLabel?: boolean;
  } = {}
): { width: number; height: number } {
  const yearHeightScale = options.yearHeightScale ?? 1;
  const hasImage = Boolean(event.imageUrl);
  const imagePlacement = options.imagePlacement ?? 'beside';

  if (event.displayStyle === 'label') {
    return applyImageSlot(estimateLabelBoxDimensions(event), hasImage, 'beside');
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
    const useVertical =
      options.preferVerticalLabel ?? height >= VERTICAL_RANGE_HEIGHT_THRESHOLD;
    const textWidth = useVertical
      ? fontSize + 2
      : estimateTextWidth(event.label, fontSize);
    const width = RANGE_BAR_WIDTH_PX + 6 + textWidth + 8;
    // 期間バーの見た目寸法は崩さない
    return applyImageSlot({ width, height }, hasImage, imagePlacement, false);
  }

  return applyImageSlot(
    {
      // ブラウザの太字・字間の差を吸収し、数pxだけ隣イベントへ描画されるのを防ぐ
      width: estimateTextWidth(event.label, fontSize) + 12 + TEXT_WIDTH_SAFETY_PADDING,
      height: minH,
    },
    hasImage,
    imagePlacement,
    true
  );
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
 * 同じ年から始まるイベントを、実際のレーン幅へ横詰めしたときに必要な高さ。
 * この高さを年バンドへ先に確保することで、衝突解決が後年へ食い込むのを防ぐ。
 */
function calculateStartYearBandHeight(
  events: Event[],
  laneWidth: number,
  yearHeightScale: number
): number {
  if (events.length === 0) {
    return MIN_YEAR_HEIGHT * yearHeightScale;
  }

  const usableWidth = Math.max(40, laneWidth - TIMELINE_PADDING * 2);
  const rows: Array<{ usedWidth: number; height: number }> = [];
  const sizes = events
    .map((event) => {
      const fontSize = defaultFontSize(event);
      const size = measureEventSize(event, {
        yearHeightScale,
        provisionalRangeHeight:
          event.displayStyle !== 'label' && event.end != null
            ? minHeightForFont(fontSize, yearHeightScale)
            : undefined,
        preferVerticalLabel: false,
      });
      return fitPointEventToWidth(event, size, usableWidth, yearHeightScale);
    })
    .sort((a, b) => b.height - a.height || b.width - a.width);

  for (const size of sizes) {
    const width = Math.min(size.width, usableWidth);
    let targetRow = rows.find(
      (row) => row.usedWidth + EVENT_COLUMN_GAP + width <= usableWidth
    );

    if (!targetRow) {
      targetRow = { usedWidth: 0, height: 0 };
      rows.push(targetRow);
    }

    targetRow.usedWidth += (targetRow.usedWidth > 0 ? EVENT_COLUMN_GAP : 0) + width;
    targetRow.height = Math.max(targetRow.height, size.height);
  }

  const packedHeight = rows.reduce((sum, row) => sum + row.height, 0);
  return (
    TIMELINE_PADDING * 2 +
    packedHeight +
    Math.max(0, rows.length - 1) * EVENT_VERTICAL_SPACING
  );
}

/**
 * 年ごとの描画予算から、密度連動の単調な年→pxスケールを構築する。
 * 通常年はスライダー値を保ち、縦 label や同一年の密集年だけ局所的に広げる。
 */
function createAdaptiveYearScale(
  data: TimelineData,
  laneWidths: number[],
  yearRange: { min: number; max: number },
  yearHeightScale: number = 1
): AdaptiveYearScale {
  const minYear = Math.floor(yearRange.min);
  const maxYear = Math.ceil(yearRange.max);
  const bandCount = Math.max(1, maxYear - minYear + 1);
  const minimumContentHeight = 800 - TIMELINE_HEADER_HEIGHT;
  const baseBandHeight = Math.max(
    1,
    MIN_YEAR_HEIGHT * yearHeightScale,
    (minimumContentHeight - YEAR_BAND_EDGE_PADDING * 2) / bandCount
  );
  const yearBudgets = Array.from({ length: bandCount }, () => baseBandHeight);

  data.forEach((lane, laneIndex) => {
    const eventsByStartYear = new Map<number, Event[]>();
    for (const event of lane.events) {
      const startYear = Math.trunc(event.start);
      if (startYear < minYear || startYear > maxYear) continue;
      const group = eventsByStartYear.get(startYear);
      if (group) {
        group.push(event);
      } else {
        eventsByStartYear.set(startYear, [event]);
      }
    }

    for (const [year, events] of eventsByStartYear) {
      const index = year - minYear;
      yearBudgets[index] = Math.max(
        yearBudgets[index],
        calculateStartYearBandHeight(events, laneWidths[laneIndex], yearHeightScale)
      );
    }
  });

  const positions = [YEAR_BAND_EDGE_PADDING];
  for (const budget of yearBudgets) {
    positions.push(positions[positions.length - 1] + budget);
  }

  const contentSize = Math.max(
    minimumContentHeight,
    positions[positions.length - 1] + YEAR_BAND_EDGE_PADDING
  );

  return { minYear, maxYear, positions, contentSize };
}

/** 年を描画位置へ変換する。adaptiveScale がなければ従来どおり線形。 */
export function mapYearToPosition(
  year: number,
  yearRange: { min: number; max: number },
  contentSize: number,
  adaptiveScale?: AdaptiveYearScale
): number {
  if (
    adaptiveScale &&
    adaptiveScale.positions.length >= 2 &&
    Number.isFinite(year)
  ) {
    const min = adaptiveScale.minYear;
    const maxBoundary = adaptiveScale.maxYear + 1;
    const clampedYear = Math.max(min, Math.min(maxBoundary, year));
    const offset = clampedYear - min;
    const lowerIndex = Math.min(
      adaptiveScale.positions.length - 2,
      Math.max(0, Math.floor(offset))
    );
    const fraction = Math.max(0, Math.min(1, offset - lowerIndex));
    const start = adaptiveScale.positions[lowerIndex];
    const end = adaptiveScale.positions[lowerIndex + 1];
    return start + (end - start) * fraction;
  }

  const yearSpan = Math.max(1, yearRange.max - yearRange.min);
  return ((year - yearRange.min) / yearSpan) * contentSize;
}

function layoutSortKey(event: Event): { start: number; duration: number; label: string } {
  const end = layoutOccupancyEnd(event);
  return {
    start: event.start,
    duration: end - event.start,
    label: event.label,
  };
}

function findAvailableX(
  resolved: PositionedEvent[],
  y: number,
  width: number,
  height: number,
  rightBoundary: number
): number | null {
  const occupied = resolved
    .filter(
      (other) => !(y + height <= other.y || other.y + other.height <= y)
    )
    .map((other) => ({ left: other.x, right: other.x + other.width }))
    .sort((a, b) => a.left - b.left || a.right - b.right);

  let x = TIMELINE_PADDING;
  for (const interval of occupied) {
    if (interval.right <= x) continue;
    if (x + width + EVENT_COLUMN_GAP <= interval.left) return x;
    x = Math.max(x, interval.right + EVENT_COLUMN_GAP);
    if (x + width > rightBoundary) return null;
  }

  return x + width <= rightBoundary ? x : null;
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
    // 年バンドの事前見積もりと同じ順に大きい矩形から置き、不要な段増加を防ぐ。
    if (a.height !== b.height) return b.height - a.height;
    if (a.width !== b.width) return b.width - a.width;
    return ka.label.localeCompare(kb.label);
  });

  const resolved: PositionedEvent[] = [];
  const usableWidth = Math.max(40, laneWidth - TIMELINE_PADDING);

  sortedEvents.forEach((event) => {
    const width = Math.min(event.width, usableWidth - TIMELINE_PADDING);
    const height = Math.min(Math.max(event.height, MIN_EVENT_HEIGHT), contentHeight);
    const maxY = Math.max(0, contentHeight - height);
    const desiredY = Math.max(0, Math.min(event.y, maxY));
    const candidateYs = new Set<number>([desiredY]);
    for (const other of resolved) {
      const nextY = other.y + other.height + EVENT_VERTICAL_SPACING;
      if (nextY >= desiredY && nextY <= maxY) candidateYs.add(nextY);
    }

    let finalRect: Rect | null = null;
    for (const y of [...candidateYs].sort((a, b) => a - b)) {
      const x = findAvailableX(resolved, y, width, height, usableWidth);
      if (x != null) {
        finalRect = { x, y, width, height };
        break;
      }
    }

    // 通常は年バンド内で必ず見つかる。入力が想定以上でも重ねず末尾へ退避する。
    if (!finalRect) {
      const maxBottom = resolved.reduce(
        (max, other) => Math.max(max, other.y + other.height),
        0
      );
      finalRect = {
        x: TIMELINE_PADDING,
        y: Math.max(desiredY, maxBottom + EVENT_VERTICAL_SPACING),
        width,
        height,
      };
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

  return normalizeYearRange({
    min: Math.floor(minYear / 10) * 10,
    max: Math.ceil(maxYear / 10) * 10,
  });
}

function normalizeYearRange(range: { min: number; max: number }): {
  min: number;
  max: number;
} {
  const min = Math.min(range.min, range.max);
  const max = Math.max(range.min, range.max);
  return max > min ? { min, max } : { min, max: min + SINGLE_YEAR_CONTEXT_SPAN };
}

function positionVerticalEvents(
  data: TimelineData,
  laneWidths: number[],
  yearRange: { min: number; max: number },
  yearScale: AdaptiveYearScale,
  yearHeightScale: number
): PositionedEvent[][] {
  const contentHeight = yearScale.contentSize;
  const yScale = (year: number) =>
    mapYearToPosition(year, yearRange, contentHeight, yearScale);

  return data.map((lane, laneIndex) => {
    const laneWidth = laneWidths[laneIndex];
    const laneEvents = lane.events.map((event): PositionedEvent => {
      const y = yScale(event.start);
      let size: { width: number; height: number };

      if (event.displayStyle === 'label') {
        size = measureEventSize(event, { yearHeightScale });
      } else if (event.end != null) {
        const endY = yScale(event.end);
        const rangeHeight = Math.max(
          minHeightForFont(defaultFontSize(event), yearHeightScale),
          endY - y
        );
        size = measureEventSize(event, {
          yearHeightScale,
          provisionalRangeHeight: rangeHeight,
          preferVerticalLabel: rangeHeight >= VERTICAL_RANGE_HEIGHT_THRESHOLD,
        });
        // 期間の高さは年スケール優先。画像は副軸方向にのみ加算済み
        size = { ...size, height: Math.max(size.height, rangeHeight) };
      } else {
        size = measureEventSize(event, { yearHeightScale });
      }

      size = fitPointEventToWidth(
        event,
        size,
        Math.max(24, laneWidth - TIMELINE_PADDING * 2),
        yearHeightScale
      );

      return {
        ...event,
        x: TIMELINE_PADDING,
        y,
        width: Math.min(size.width, Math.max(24, laneWidth - TIMELINE_PADDING * 2)),
        height: size.height,
      };
    });

    return resolveEventCollisions(laneEvents, laneWidth, contentHeight);
  });
}

/**
 * 実配置で開始年バンドを越えた点・label の不足量を軸へ戻す。
 * 事前見積もりだけでは、前の年から伸びる縦 label との干渉を予測できないため。
 */
function expandScaleForPointSpills(
  scale: AdaptiveYearScale,
  positionedEvents: PositionedEvent[][]
): AdaptiveYearScale | null {
  const additions = Array.from({ length: scale.positions.length - 1 }, () => 0);

  for (const events of positionedEvents) {
    for (const event of events) {
      if (layoutOccupancyEnd(event) !== event.start) continue;
      const yearIndex = Math.trunc(event.start) - scale.minYear;
      if (yearIndex < 0 || yearIndex >= additions.length) continue;
      const nextYearPosition = scale.positions[yearIndex + 1];
      const spill = event.y + event.height - nextYearPosition;
      if (spill > 0.01) {
        additions[yearIndex] = Math.max(
          additions[yearIndex],
          spill + EVENT_VERTICAL_SPACING
        );
      }
    }
  }

  if (additions.every((amount) => amount === 0)) return null;

  const positions = [scale.positions[0]];
  for (let index = 0; index < additions.length; index += 1) {
    const currentBudget = scale.positions[index + 1] - scale.positions[index];
    positions.push(positions[index] + currentBudget + additions[index]);
  }

  return {
    ...scale,
    positions,
    contentSize: Math.max(scale.contentSize, positions[positions.length - 1] + YEAR_BAND_EDGE_PADDING),
  };
}

export function computeLayout(
  data: TimelineData,
  yearHeightScale: number = 1,
  yearRangeOverride?: { min: number; max: number },
  orientation: TimelineOrientation = 'vertical'
): {
  positionedEvents: PositionedEvent[][];
  layoutConfig: DynamicLayoutConfig;
  yearRange: { min: number; max: number };
} {
  if (orientation === 'horizontal') {
    return computeLayoutHorizontal(data, yearHeightScale, yearRangeOverride);
  }
  return computeLayoutVertical(data, yearHeightScale, yearRangeOverride);
}

function computeLayoutVertical(
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
        orientation: 'vertical',
      },
      yearRange: { min: 0, max: 0 },
    };
  }

  const yearRange = normalizeYearRange(yearRangeOverride ?? deriveYearRange(data));
  const laneWidths = data.map((lane) => calculateOptimalLaneWidth(lane.events));
  const laneWidthByName: Record<string, number> = {};
  data.forEach((lane, index) => {
    laneWidthByName[lane.name] = laneWidths[index];
  });

  const maxLaneWidth = Math.max(...laneWidths);
  const yearAxisWidth = Math.min(72, Math.max(48, maxLaneWidth * 0.08));
  const totalWidth = yearAxisWidth * 2 + laneWidths.reduce((sum, width) => sum + width, 0);

  let yearScale = createAdaptiveYearScale(
    data,
    laneWidths,
    yearRange,
    yearHeightScale
  );
  let positionedEvents = positionVerticalEvents(
    data,
    laneWidths,
    yearRange,
    yearScale,
    yearHeightScale
  );

  // 通常1回で収束する。異常入力でも再配置ループがブラウザを占有しないよう上限を持つ。
  for (let pass = 0; pass < MAX_ADAPTIVE_FEEDBACK_PASSES; pass += 1) {
    const expandedScale = expandScaleForPointSpills(yearScale, positionedEvents);
    if (!expandedScale) break;
    yearScale = expandedScale;
    positionedEvents = positionVerticalEvents(
      data,
      laneWidths,
      yearRange,
      yearScale,
      yearHeightScale
    );
  }

  const contentHeight = yearScale.contentSize;
  const timelineHeight = contentHeight + TIMELINE_HEADER_HEIGHT;

  return {
    positionedEvents,
    layoutConfig: {
      laneWidths,
      laneWidthByName,
      yearAxisWidth,
      totalWidth,
      timelineHeight,
      orientation: 'vertical',
      yearScale,
    },
    yearRange,
  };
}

const MIN_LANE_ROW_HEIGHT = 88;
export { MIN_LANE_ROW_HEIGHT };
/** 横型のテーマ名レール（縦書き1列分） */
export const LANE_LABEL_WIDTH_HORIZONTAL = 44;
const LANE_LABEL_FONT_PX = 13;
/** 縦書きテーマ名が行高を押し上げる上限（超えたら2列幅にする） */
const MAX_VERTICAL_LABEL_ROW_HEIGHT = 200;
export const YEAR_AXIS_HEIGHT_HORIZONTAL = 44;

/** 縦書きテーマ名が切れない最低行高（columns 列に折り返す想定） */
export function minHeightForVerticalLaneLabel(name: string, columns = 1): number {
  const charCount = Math.max(1, name.length);
  const charsPerCol = Math.ceil(charCount / Math.max(1, columns));
  return Math.ceil(charsPerCol * LANE_LABEL_FONT_PX * 1.28) + 20;
}

function resolveHorizontalLaneLabelWidth(data: TimelineData): {
  laneLabelWidth: number;
  labelColumns: number;
} {
  const singleColHeights = data.map((lane) => minHeightForVerticalLaneLabel(lane.name, 1));
  const needsTwoCols = singleColHeights.some((h) => h > MAX_VERTICAL_LABEL_ROW_HEIGHT);
  const labelColumns = needsTwoCols ? 2 : 1;
  return {
    laneLabelWidth: LANE_LABEL_WIDTH_HORIZONTAL * labelColumns,
    labelColumns,
  };
}

/**
 * 横型: 横=年代（左が古・右が新）、縦=テーマ（レーン行）。
 */
function computeLayoutHorizontal(
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
        laneHeights: [],
        laneHeightByName: {},
        yearAxisWidth: 0,
        yearAxisHeight: YEAR_AXIS_HEIGHT_HORIZONTAL,
        laneLabelWidth: LANE_LABEL_WIDTH_HORIZONTAL,
        totalWidth: 120,
        timelineHeight: 200,
        orientation: 'horizontal',
      },
      yearRange: { min: 0, max: 0 },
    };
  }

  const yearRange = normalizeYearRange(yearRangeOverride ?? deriveYearRange(data));
  const yearSpan = Math.max(1, yearRange.max - yearRange.min);
  // 横型のスライダーは「年あたりの幅」のみ。イベント高さには使わない
  const yearPxPerYear = Math.max(8, 24 * yearHeightScale);
  const yearContentWidth = Math.max(640, yearSpan * yearPxPerYear);
  const yearAxisHeight = YEAR_AXIS_HEIGHT_HORIZONTAL;
  const { laneLabelWidth, labelColumns } = resolveHorizontalLaneLabelWidth(data);

  const xScale = scaleLinear()
    .domain([yearRange.min, yearRange.max])
    .range([0, yearContentWidth])
    .clamp(true);

  const measuredLaneEvents: PositionedEvent[][] = [];
  let trailingWidth = 0;

  data.forEach((lane) => {
    const laneEvents: PositionedEvent[] = [];

    lane.events.forEach((event) => {
      const x = xScale(event.start);
      let width: number;
      let height: number;

      if (event.displayStyle === 'label') {
        const size = measureEventSize(event, {
          yearHeightScale: 1,
          imagePlacement: 'beside',
        });
        width = size.width;
        height = size.height;
      } else if (event.end != null) {
        const endX = xScale(event.end);
        const fontSize = defaultFontSize(event);
        // zoom では範囲外部分を xScale が切るため、元の全期間幅を足し戻さない。
        const rangeWidth = Math.max(minHeightForFont(fontSize, 1), endX - x);
        const textHeight = minHeightForFont(fontSize, 1) + 6;
        const textWidth =
          estimateTextWidth(event.label, fontSize) + 12 + TEXT_WIDTH_SAFETY_PADDING;
        const contentBox = {
          width: Math.max(rangeWidth, textWidth),
          height: textHeight,
        };
        const sized = applyImageSlot(contentBox, Boolean(event.imageUrl), 'below', false);
        width = sized.width;
        height = sized.height;
      } else {
        const size = measureEventSize(event, {
          yearHeightScale: 1,
          imagePlacement: 'beside',
        });
        width = size.width;
        height = size.height;
      }

      trailingWidth = Math.max(
        trailingWidth,
        x + width + TIMELINE_PADDING - yearContentWidth
      );
      laneEvents.push({
        ...event,
        x,
        y: TIMELINE_PADDING,
        width,
        height,
      });
    });

    measuredLaneEvents.push(laneEvents);
  });

  // 最大年の目盛り位置は動かさず、その右側にラベルの描画余白だけを足す。
  const contentWidth = yearContentWidth + Math.max(0, trailingWidth);

  const positionedEvents: PositionedEvent[][] = [];
  const laneHeights: number[] = [];
  const laneHeightByName: Record<string, number> = {};
  const laneWidths: number[] = [];
  const laneWidthByName: Record<string, number> = {};

  data.forEach((lane, laneIndex) => {
    const laneEvents = measuredLaneEvents[laneIndex];
    const packed = resolveHorizontalCollisions(laneEvents, contentWidth);
    const maxBottom = packed.reduce(
      (max, e) => Math.max(max, e.y + e.height),
      TIMELINE_PADDING
    );
    const labelMin = Math.min(
      MAX_VERTICAL_LABEL_ROW_HEIGHT * labelColumns,
      minHeightForVerticalLaneLabel(lane.name, labelColumns)
    );
    const laneHeight = Math.max(
      MIN_LANE_ROW_HEIGHT,
      maxBottom + TIMELINE_PADDING + 8,
      labelMin
    );
    laneHeights.push(laneHeight);
    laneHeightByName[lane.name] = laneHeight;
    laneWidths.push(contentWidth);
    laneWidthByName[lane.name] = contentWidth;
    positionedEvents.push(packed);
  });

  const timelineHeight =
    yearAxisHeight * 2 + laneHeights.reduce((sum, h) => sum + h, 0);
  const totalWidth = laneLabelWidth + contentWidth;

  return {
    positionedEvents,
    layoutConfig: {
      laneWidths,
      laneWidthByName,
      laneHeights,
      laneHeightByName,
      yearAxisWidth: 0,
      yearAxisHeight,
      laneLabelWidth,
      yearContentWidth,
      totalWidth,
      timelineHeight,
      orientation: 'horizontal',
    },
    yearRange,
  };
}

/** 横型レーン内: 年位置を保ちつつ下へ積んで衝突回避 */
function resolveHorizontalCollisions(
  events: PositionedEvent[],
  contentWidth: number
): PositionedEvent[] {
  const sortedEvents = [...events].sort((a, b) => {
    const ka = layoutSortKey(a);
    const kb = layoutSortKey(b);
    if (ka.start !== kb.start) return ka.start - kb.start;
    if (ka.duration !== kb.duration) return kb.duration - ka.duration;
    const aIsRange = a.displayStyle !== 'label' && a.end != null;
    const bIsRange = b.displayStyle !== 'label' && b.end != null;
    if (aIsRange !== bIsRange) return aIsRange ? -1 : 1;
    return ka.label.localeCompare(kb.label);
  });

  const resolved: PositionedEvent[] = [];

  sortedEvents.forEach((event) => {
    const width = Math.min(event.width, Math.max(20, contentWidth - event.x - TIMELINE_PADDING));
    const height = Math.max(event.height, MIN_EVENT_HEIGHT);
    const bestX = Math.max(0, Math.min(event.x, Math.max(0, contentWidth - width)));
    const blockers = resolved
      .filter(
        (other) =>
          bestX < other.x + other.width && other.x < bestX + width
      )
      .sort((a, b) => a.y - b.y || a.x - b.x);
    let bestY = TIMELINE_PADDING;
    for (const blocker of blockers) {
      if (bestY + height <= blocker.y) break;
      if (bestY < blocker.y + blocker.height) {
        bestY = blocker.y + blocker.height + EVENT_VERTICAL_SPACING;
      }
    }

    resolved.push({
      ...event,
      x: bestX,
      y: bestY,
      width,
      height,
    });
  });

  return resolved;
}

export function calculateTimelineHeight(data: TimelineData, yearHeightScale: number = 1): number {
  if (data.length === 0) return 800;
  const yearRange = deriveYearRange(data);
  const laneWidths = data.map((lane) => calculateOptimalLaneWidth(lane.events));
  const yearScale = createAdaptiveYearScale(data, laneWidths, yearRange, yearHeightScale);
  return yearScale.contentSize + TIMELINE_HEADER_HEIGHT;
}

export function calculateTimelineWidth(data: TimelineData): number {
  if (data.length === 0) return 120;

  const laneWidths = data.map((lane) => calculateOptimalLaneWidth(lane.events));
  const maxLaneWidth = Math.max(...laneWidths);
  const yearAxisWidth = Math.min(72, Math.max(48, maxLaneWidth * 0.08));

  return yearAxisWidth * 2 + laneWidths.reduce((sum, width) => sum + width, 0);
}

export { deriveYearRange };
