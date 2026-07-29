import { useMemo } from 'react';
import { TimelineData, PositionedEvent, LayoutMode, DynamicLayoutConfig } from '../lib/types';
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
  positionedEvents: PositionedEvent[][],
  filters: FilterState,
  selectedLanes: string[],
  layoutMode: LayoutMode = 'zoom',
  yearHeightScale: number = 1,
  baseYearRange: { min: number; max: number } = { min: 0, max: 0 }
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
    const filteredPositionedEvents: PositionedEvent[][] = [];

    data.forEach((lane, laneIndex) => {
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

        const filteredPositioned =
          positionedEvents[laneIndex]?.filter((pe) =>
            filteredLaneEvents.some(
              (e) => e.start === pe.start && e.end === pe.end && e.label === pe.label
            )
          ) || [];
        filteredPositionedEvents.push(filteredPositioned);
      }
    });

    if (layoutMode === 'zoom' && filteredData.length > 0) {
      const overrideRange = {
        min: Math.floor(filters.yearRange[0] / 10) * 10,
        max: Math.ceil(filters.yearRange[1] / 10) * 10,
      };

      const {
        positionedEvents: recomputedEvents,
        layoutConfig: recomputedLayout,
        yearRange: recomputedYearRange,
      } = computeLayout(filteredData, yearHeightScale, overrideRange);

      return {
        filteredData,
        filteredPositionedEvents: recomputedEvents,
        layoutConfig: recomputedLayout,
        yearRange: recomputedYearRange,
      };
    }

    return {
      filteredData,
      filteredPositionedEvents,
      layoutConfig: undefined,
      yearRange: baseYearRange,
    };
    // yearRangeKey / selectedLanesKey で filters・配列の参照変化を安定化
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, positionedEvents, yearRangeKey, selectedLanesKey, layoutMode, yearHeightScale, baseYearRange.min, baseYearRange.max]);
}
