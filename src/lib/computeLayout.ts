import { scaleLinear } from 'd3-scale';
import { TimelineData, PositionedEvent, DynamicLayoutConfig } from './types';

const MIN_LANE_WIDTH = 300;
const MAX_LANE_WIDTH = 500;
const TIMELINE_PADDING = 4;  // 余白を最小化
const EVENT_VERTICAL_SPACING = 4;  // イベント間の最小垂直間隔
const MIN_EVENT_HEIGHT = 12; // 最小イベント高さ
const MIN_YEAR_HEIGHT = 24; // 1年あたりの最小高さ

// テキストの幅を推定する関数（文字数ベース）
function estimateTextWidth(text: string): number {
  // 日本語文字は英数字の約2倍の幅として計算
  const japaneseCharCount = (text.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;
  const otherCharCount = text.length - japaneseCharCount;
  return japaneseCharCount * 10 + otherCharCount * 8; // 日本語10px、英数字8px
}

// レーンの最適な幅を計算
function calculateOptimalLaneWidth(events: { start: number; end?: number; label: string }[]): number {
  let maxTextWidth = 0;

  events.forEach(event => {
    const eventLabel = event.end
      ? `${event.start}年-${event.end}年：${event.label}`
      : `${event.start}年：${event.label}`;
    const textWidth = estimateTextWidth(eventLabel);
    maxTextWidth = Math.max(maxTextWidth, textWidth);
  });

  // パディングとアイコン幅を考慮
  const requiredWidth = maxTextWidth + 80; // 左右パディング + アイコン幅
  return Math.min(MAX_LANE_WIDTH, Math.max(MIN_LANE_WIDTH, requiredWidth));
}

// 年代ごとのイベント密度を分析
function analyzeEventDensity(data: TimelineData, yearRange: { min: number; max: number }) {
  const yearEventCounts = new Map<number, number>();
  const yearMaxEventsPerLane = new Map<number, number>();

  // 各年代のイベント数をカウント
  for (let year = yearRange.min; year <= yearRange.max; year++) {
    yearEventCounts.set(year, 0);
    yearMaxEventsPerLane.set(year, 0);
  }

  data.forEach((lane) => {
    const laneYearCounts = new Map<number, number>();

    lane.events.forEach(event => {
      const startYear = event.start;
      const endYear = event.end || event.start;

      // 期間イベントの場合、各年にカウント
      for (let year = startYear; year <= endYear; year++) {
        const currentCount = yearEventCounts.get(year) || 0;
        yearEventCounts.set(year, currentCount + 1);

        const laneCount = laneYearCounts.get(year) || 0;
        laneYearCounts.set(year, laneCount + 1);
      }
    });

    // このレーンでの最大重複数を記録
    laneYearCounts.forEach((count, year) => {
      const currentMax = yearMaxEventsPerLane.get(year) || 0;
      yearMaxEventsPerLane.set(year, Math.max(currentMax, count));
    });
  });

  return { yearEventCounts, yearMaxEventsPerLane };
}

// 動的高さ計算
function calculateDynamicHeight(data: TimelineData, yearRange: { min: number; max: number }, yearHeightScale: number = 1): number {
  const { yearMaxEventsPerLane } = analyzeEventDensity(data, yearRange);

  let totalRequiredHeight = 0;
  const yearSpan = yearRange.max - yearRange.min;

  for (let year = yearRange.min; year <= yearRange.max; year++) {
    const maxEventsInYear = yearMaxEventsPerLane.get(year) || 0;

    // この年に必要な高さ = 基本高さ + (重複イベント数 × スペーシング)
    const yearHeight = Math.max(
      MIN_YEAR_HEIGHT * yearHeightScale,
      (MIN_EVENT_HEIGHT + (maxEventsInYear - 1) * (MIN_EVENT_HEIGHT + EVENT_VERTICAL_SPACING)) * yearHeightScale
    );

    totalRequiredHeight += yearHeight;
  }

  // 最小高さを保証し、適度な余白を追加
  const calculatedHeight = totalRequiredHeight + TIMELINE_PADDING * 2;
  return Math.max(800, calculatedHeight);
}

// 改良されたイベント配置システム
function resolveEventCollisions(events: PositionedEvent[], laneWidth: number, yearRange: { min: number; max: number }, contentHeight: number, yearHeightScale: number = 1): PositionedEvent[] {
  // 年代でソート
  const sortedEvents = [...events].sort((a, b) => {
    if (a.start !== b.start) return a.start - b.start;
    return (a.end || a.start) - (b.end || b.start);
  });

  const resolvedEvents: PositionedEvent[] = [];
  const yearSlots = new Map<number, number[]>(); // 年代ごとの使用済みY位置

  sortedEvents.forEach(event => {
    const startYear = event.start;
    const endYear = event.end || event.start;

    // この期間で使用可能な最初のスロットを見つける
    let bestY = event.y;
    let conflictFound = true;
    let attempts = 0;

    while (conflictFound && attempts < 20) {
      conflictFound = false;

      // 期間全体でチェック
      for (let year = startYear; year <= endYear; year++) {
        const slots = yearSlots.get(year) || [];

        for (const usedY of slots) {
          if (Math.abs(bestY - usedY) < (MIN_EVENT_HEIGHT + EVENT_VERTICAL_SPACING) * yearHeightScale) {
            conflictFound = true;
            bestY = usedY + (MIN_EVENT_HEIGHT + EVENT_VERTICAL_SPACING) * yearHeightScale;
            break;
          }
        }

        if (conflictFound) break;
      }

      attempts++;
    }

    // スロットを予約
    for (let year = startYear; year <= endYear; year++) {
      if (!yearSlots.has(year)) {
        yearSlots.set(year, []);
      }
      yearSlots.get(year)!.push(bestY);
    }

    resolvedEvents.push({
      ...event,
      y: bestY
    });
  });

  return resolvedEvents;
}

export function computeLayout(data: TimelineData, yearHeightScale: number = 1): {
  positionedEvents: PositionedEvent[][],
  layoutConfig: DynamicLayoutConfig
} {
  if (data.length === 0) {
    return {
      positionedEvents: [],
      layoutConfig: { laneWidths: [], yearAxisWidth: 120, totalWidth: 120 }
    };
  }

  // 全イベントから年範囲を計算
  let minYear = Infinity;
  let maxYear = -Infinity;

  data.forEach(lane => {
    lane.events.forEach(event => {
      minYear = Math.min(minYear, event.start);
      if (event.end) {
        maxYear = Math.max(maxYear, event.end);
      } else {
        maxYear = Math.max(maxYear, event.start);
      }
    });
  });

  // 年範囲を少し拡張
  minYear = Math.floor(minYear / 10) * 10;
  maxYear = Math.ceil(maxYear / 10) * 10;

  const yearRange = { min: minYear, max: maxYear };

  // 各レーンの最適な幅を計算
  const laneWidths = data.map(lane => calculateOptimalLaneWidth(lane.events));

  // 年代軸の幅を動的に調整（最小80px、最大180px）
  const maxLaneWidth = Math.max(...laneWidths);
  const yearAxisWidth = Math.min(180, Math.max(80, maxLaneWidth * 0.25));

  // 総幅を計算
  const totalWidth = yearAxisWidth + laneWidths.reduce((sum, width) => sum + width, 0);

  // 動的高さを計算（スケールファクター適用）
  const timelineHeight = calculateDynamicHeight(data, yearRange, yearHeightScale);
  const headerHeight = 60; // 余白削減
  const contentHeight = timelineHeight - headerHeight;

  // Y軸のスケールを作成（年 → ピクセル）
  const yScale = scaleLinear()
    .domain([minYear, maxYear])
    .range([0, contentHeight]);

  const positionedEvents: PositionedEvent[][] = [];
  let currentX = 0; // レーンの累積X位置

  data.forEach((lane, laneIndex) => {
    const laneWidth = laneWidths[laneIndex];
    const laneEvents: PositionedEvent[] = [];

    lane.events.forEach(event => {
      const y = yScale(event.start);

      if (event.end) {
        // 期間イベント（縦バー）
        const endY = yScale(event.end);
        laneEvents.push({
          ...event,
          x: currentX + TIMELINE_PADDING,
          y,
          width: laneWidth - TIMELINE_PADDING * 2,
          height: Math.max(MIN_EVENT_HEIGHT * yearHeightScale, endY - y)
        });
      } else {
        // 点イベント（円）
        laneEvents.push({
          ...event,
          x: currentX + TIMELINE_PADDING,
          y,
          width: laneWidth - TIMELINE_PADDING * 2,
          height: MIN_EVENT_HEIGHT * yearHeightScale
        });
      }
    });

    // 改良されたイベントの重複解決（スケールファクター適用）
    const resolvedEvents = resolveEventCollisions(laneEvents, laneWidth, yearRange, contentHeight, yearHeightScale);
    positionedEvents.push(resolvedEvents);

    currentX += laneWidth;
  });

  return {
    positionedEvents,
    layoutConfig: {
      laneWidths,
      yearAxisWidth,
      totalWidth,
      timelineHeight // 動的高さを追加
    }
  };
}

// 年表の高さを計算（動的レイアウト対応）
export function calculateTimelineHeight(data: TimelineData, yearHeightScale: number = 1): number {
  if (data.length === 0) return 800;

  let minYear = Infinity;
  let maxYear = -Infinity;

  data.forEach(lane => {
    lane.events.forEach(event => {
      minYear = Math.min(minYear, event.start);
      if (event.end) {
        maxYear = Math.max(maxYear, event.end);
      } else {
        maxYear = Math.max(maxYear, event.start);
      }
    });
  });

  minYear = Math.floor(minYear / 10) * 10;
  maxYear = Math.ceil(maxYear / 10) * 10;

  return calculateDynamicHeight(data, { min: minYear, max: maxYear }, yearHeightScale);
}

// 年表の幅を計算（動的レイアウト対応）
export function calculateTimelineWidth(data: TimelineData): number {
  if (data.length === 0) return 120;

  const laneWidths = data.map(lane => calculateOptimalLaneWidth(lane.events));
  const maxLaneWidth = Math.max(...laneWidths);
  const yearAxisWidth = Math.min(180, Math.max(80, maxLaneWidth * 0.25));

  return yearAxisWidth + laneWidths.reduce((sum, width) => sum + width, 0);
}