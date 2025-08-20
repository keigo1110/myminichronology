import { useMemo } from 'react';
import { TimelineData, PositionedEvent, LayoutMode, DynamicLayoutConfig } from '../lib/types';
import { computeLayout } from '../lib/computeLayout';

export interface FilterState {
  yearRange: [number, number];
}

export function useFilteredEvents(
  data: TimelineData | null,
  positionedEvents: PositionedEvent[][],
  filters: FilterState,
  selectedLanes: string[],
  layoutMode: LayoutMode = 'zoom',
  yearHeightScale: number = 1
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

    // レイアウトモードに応じた処理
    if (layoutMode === 'zoom' && filteredData.length > 0) {
      // ズームモード: フィルタ済みデータでレイアウトを再計算
      const { positionedEvents: recomputedEvents, layoutConfig: recomputedLayout } =
        computeLayout(filteredData, yearHeightScale);

      return {
        filteredData,
        filteredPositionedEvents: recomputedEvents,
        layoutConfig: recomputedLayout
      };
    } else {
      // フィルタモード: 元のレイアウトを維持
      return {
        filteredData,
        filteredPositionedEvents,
        layoutConfig: undefined
      };
    }
  }, [data, positionedEvents, filters, selectedLanes, layoutMode, yearHeightScale]);
}