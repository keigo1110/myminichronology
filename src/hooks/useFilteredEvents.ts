import { useMemo } from 'react';
import {
  TimelineData,
  PositionedEvent,
  LayoutMode,
  DynamicLayoutConfig,
  TimelineOrientation,
} from '../lib/types';
import { computeLayout } from '../lib/computeLayout';

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
  orientation: TimelineOrientation = 'vertical'
): FilteredEventsResult {
  const yearRangeKey = `${filters.yearRange[0]}:${filters.yearRange[1]}`;
  const selectedLanesKey = selectedLanes.join('|');

  return useMemo(() => {
    if (!data) {
      return {
        filteredData: null,
        filteredPositionedEvents: [],
        yearRange: baseYearRange,
      };
    }

    const filteredData: TimelineData = [];

    data.forEach((lane) => {
      if (!selectedLanes.includes(lane.name)) {
        return;
      }

      const filteredLaneEvents = lane.events.filter((event) => {
        const eventStart = event.start;
        const eventEnd = event.end || event.start;
        return !(eventEnd < filters.yearRange[0] || eventStart > filters.yearRange[1]);
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
        yearRange: baseYearRange,
      };
    }

    // zoom: 選択年レンジで再レイアウト
    // filter: 全体年レンジを維持しつつ可視イベントだけで再配置（隙間・重なりを解消）
    const overrideRange =
      layoutMode === 'zoom'
        ? {
            min: Math.floor(filters.yearRange[0] / 10) * 10,
            max: Math.ceil(filters.yearRange[1] / 10) * 10,
          }
        : baseYearRange.min > 0 && baseYearRange.max > 0
          ? baseYearRange
          : undefined;

    const {
      positionedEvents: recomputedEvents,
      layoutConfig: recomputedLayout,
      yearRange: recomputedYearRange,
    } = computeLayout(filteredData, yearHeightScale, overrideRange, orientation);

    return {
      filteredData,
      filteredPositionedEvents: recomputedEvents,
      layoutConfig: recomputedLayout,
      yearRange: layoutMode === 'zoom' ? recomputedYearRange : (baseYearRange.min > 0 ? baseYearRange : recomputedYearRange),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, yearRangeKey, selectedLanesKey, layoutMode, yearHeightScale, baseYearRange.min, baseYearRange.max, orientation]);
}
