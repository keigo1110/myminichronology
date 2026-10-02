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
import { hasYearRange } from '../lib/yearRange';

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

    if (layoutMode === 'filter') {
      const base = baseLayoutConfig && _positionedEvents.length === data.length
        ? { layoutConfig: baseLayoutConfig, positionedEvents: _positionedEvents, yearRange: { min: baseMinYear, max: baseMaxYear } }
        : computeLayout(data, yearHeightScale,
            hasYearRange({ min: baseMinYear, max: baseMaxYear }) ? { min: baseMinYear, max: baseMaxYear } : undefined,
            orientation, labelOrientation);
      const widths = filteredData.map((lane) => base.layoutConfig.laneWidthByName[lane.name]);
      const heights = filteredData.map((lane) => base.layoutConfig.laneHeightByName?.[lane.name] ?? 0);
      return {
        filteredData,
        filteredPositionedEvents: filteredData.map((lane) => {
          const index = data.findIndex((original) => original.name === lane.name);
          return base.positionedEvents[index].filter((event) =>
            layoutOccupancyEnd(event) >= filterStart && event.start <= filterEnd);
        }),
        layoutConfig: {
          ...base.layoutConfig,
          laneWidths: widths,
          laneHeights: orientation === 'horizontal' ? heights : undefined,
          totalWidth: orientation === 'horizontal' ? base.layoutConfig.totalWidth
            : widths.reduce((sum, width) => sum + width, 0) + base.layoutConfig.yearAxisWidth * 2,
          timelineHeight: orientation === 'horizontal'
            ? heights.reduce((sum, height) => sum + height, 0) + (base.layoutConfig.yearAxisHeight ?? 44) * 2
            : base.layoutConfig.timelineHeight,
        },
        yearRange: base.yearRange,
      };
    }

    // zoom: 選択年レンジで再レイアウト
    const overrideRange = {
      min: Math.floor(filterStart / 10) * 10,
      max: Math.ceil(filterEnd / 10) * 10,
    };

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
      yearRange: recomputedYearRange,
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
