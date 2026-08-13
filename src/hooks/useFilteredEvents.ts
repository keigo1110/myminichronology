import { useMemo } from 'react';
import type {
  TimelineData,
  PositionedEvent,
  LayoutMode,
  DynamicLayoutConfig,
  TimelineOrientation,
  EventLabelOrientation,
} from '../lib/types';
import { computeLayout, layoutOccupancyEnd } from '../lib/computeLayout';

export interface FilterState {
  yearRange: [number, number];
}

export interface FilteredEventsResult {
  filteredData: TimelineData | null;
  filteredPositionedEvents: PositionedEvent[][];
  layoutConfig?: DynamicLayoutConfig;
  yearRange: { min: number; max: number };
}

export function useFilteredEvents(
  data: TimelineData | null,
  _positionedEvents: PositionedEvent[][],
  filters: FilterState,
  selectedLanes: string[],
  layoutMode: LayoutMode = 'zoom',
  yearHeightScale: number = 1,
  baseYearRange: { min: number; max: number } = { min: 0, max: 0 },
  orientation: TimelineOrientation = 'vertical',
  labelOrientation: EventLabelOrientation = 'vertical',
  baseLayoutConfig?: DynamicLayoutConfig
): FilteredEventsResult {
  const [filterStart, filterEnd] = filters.yearRange;
  const { min: baseMinYear, max: baseMaxYear } = baseYearRange;
  // レーン名自体に区切り文字が含まれても依存キーが衝突しない形式にする。
  const selectedLanesKey = JSON.stringify(selectedLanes);

  return useMemo(() => {
    if (!data) {
      return {
        filteredData: null,
        filteredPositionedEvents: [],
        yearRange: { min: baseMinYear, max: baseMaxYear },
      };
    }

    const selectedLaneSet = new Set<string>(JSON.parse(selectedLanesKey));
    const coversFullRange =
      baseMaxYear > baseMinYear &&
      filterStart <= baseMinYear &&
      filterEnd >= baseMaxYear;
    const includesEveryLane =
      selectedLaneSet.size === data.length &&
      data.every((lane) => selectedLaneSet.has(lane.name));

    // 通常表示では useTimelineData の結果を再利用し、500件超の配置計算を二重にしない。
    if (
      baseLayoutConfig &&
      coversFullRange &&
      includesEveryLane &&
      _positionedEvents.length === data.length
    ) {
      return {
        filteredData: data,
        filteredPositionedEvents: _positionedEvents,
        layoutConfig: baseLayoutConfig,
        yearRange: { min: baseMinYear, max: baseMaxYear },
      };
    }

    const filteredData: TimelineData = [];

    data.forEach((lane) => {
      if (!selectedLaneSet.has(lane.name)) {
        return;
      }

      const filteredLaneEvents = lane.events.filter((event) => {
        const eventStart = event.start;
        // label は表示上ポイントなので、C列の終了年だけを理由に残さない。
        const eventEnd = layoutOccupancyEnd(event);
        return !(eventEnd < filterStart || eventStart > filterEnd);
      });

      if (filteredLaneEvents.length > 0) {
        filteredData.push({
          name: lane.name,
          events: filteredLaneEvents,
        });
      }
    });

    if (filteredData.length === 0) {
      return {
        filteredData,
        filteredPositionedEvents: [],
        yearRange: { min: baseMinYear, max: baseMaxYear },
      };
    }

    // zoom: 選択年レンジで再レイアウト
    // filter: 全体年レンジを維持しつつ可視イベントだけで再配置（隙間・重なりを解消）
    const overrideRange =
      layoutMode === 'zoom'
        ? {
            min: Math.floor(filterStart / 10) * 10,
            max: Math.ceil(filterEnd / 10) * 10,
          }
        : baseMinYear > 0 && baseMaxYear > 0
          ? { min: baseMinYear, max: baseMaxYear }
          : undefined;

    const {
      positionedEvents: recomputedEvents,
      layoutConfig: recomputedLayout,
      yearRange: recomputedYearRange,
    } = computeLayout(
      filteredData,
      yearHeightScale,
      overrideRange,
      orientation,
      labelOrientation
    );

    return {
      filteredData,
      filteredPositionedEvents: recomputedEvents,
      layoutConfig: recomputedLayout,
      yearRange:
        layoutMode === 'zoom'
          ? recomputedYearRange
          : baseMinYear > 0
            ? { min: baseMinYear, max: baseMaxYear }
            : recomputedYearRange,
    };
  }, [
    data,
    filterStart,
    filterEnd,
    selectedLanesKey,
    layoutMode,
    yearHeightScale,
    baseMinYear,
    baseMaxYear,
    orientation,
    labelOrientation,
    _positionedEvents,
    baseLayoutConfig,
  ]);
}
