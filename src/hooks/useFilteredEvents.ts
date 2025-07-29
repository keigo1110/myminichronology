import { useMemo } from 'react';
import { TimelineData, PositionedEvent } from '../lib/types';

export interface FilterState {
  yearRange: [number, number];
}

export function useFilteredEvents(
  data: TimelineData | null,
  positionedEvents: PositionedEvent[][],
  filters: FilterState,
  selectedLanes: string[]
) {
  return useMemo(() => {
    if (!data) return { filteredData: null, filteredPositionedEvents: [] };

    const filteredData: TimelineData = [];
    const filteredPositionedEvents: PositionedEvent[][] = [];

    data.forEach((lane, laneIndex) => {
      // レーンフィルター
      if (!selectedLanes.includes(lane.name)) {
        return;
      }

      const filteredLaneEvents = lane.events.filter(event => {
        // 年代フィルター
        const eventStart = event.start;
        const eventEnd = event.end || event.start;
        if (eventEnd < filters.yearRange[0] || eventStart > filters.yearRange[1]) {
          return false;
        }

        return true;
      });

      if (filteredLaneEvents.length > 0) {
        filteredData.push({
          name: lane.name,
          events: filteredLaneEvents
        });

        const filteredPositioned = positionedEvents[laneIndex]?.filter(pe =>
          filteredLaneEvents.some(e =>
            e.start === pe.start &&
            e.end === pe.end &&
            e.label === pe.label
          )
        ) || [];
        filteredPositionedEvents.push(filteredPositioned);
      }
    });

    return { filteredData, filteredPositionedEvents };
  }, [data, positionedEvents, filters, selectedLanes]);
}