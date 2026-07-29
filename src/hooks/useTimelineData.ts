import { useState, useMemo } from 'react';
import { TimelineData, PositionedEvent } from '../lib/types';
import { computeLayout, calculateTimelineHeight, calculateTimelineWidth } from '../lib/computeLayout';

const LANE_COLORS = [
  '#E3F2FD',
  '#F3E5F5',
  '#E8F5E8',
  '#FFF8E1',
  '#FCE4EC',
] as const;

const EVENT_COLORS = [
  '#1565C0',
  '#7B1FA2',
  '#2E7D32',
  '#5D4037',
  '#C2185B',
] as const;

export function useTimelineData(data: TimelineData | null) {
  const [yearHeight, setYearHeight] = useState(24);

  const layoutResult = useMemo(() => {
    if (!data) {
      return {
        positionedEvents: [] as PositionedEvent[][],
        layoutConfig: {
          laneWidths: [],
          laneWidthByName: {},
          yearAxisWidth: 60,
          totalWidth: 120,
          timelineHeight: 800,
        },
        yearRange: { min: 0, max: 0 },
      };
    }
    const yearHeightScale = yearHeight / 24;
    return computeLayout(data, yearHeightScale);
  }, [data, yearHeight]);

  const { positionedEvents, layoutConfig, yearRange } = layoutResult;

  const timelineHeight = useMemo(() => {
    if (!data) return 800;
    return layoutConfig.timelineHeight || calculateTimelineHeight(data);
  }, [data, layoutConfig.timelineHeight]);

  const timelineWidth = useMemo(() => {
    if (!data) return 120;
    return layoutConfig.totalWidth || calculateTimelineWidth(data);
  }, [data, layoutConfig.totalWidth]);

  const laneColorByName = useMemo(() => {
    const map: Record<string, string> = {};
    data?.forEach((lane, index) => {
      map[lane.name] = LANE_COLORS[index % LANE_COLORS.length];
    });
    return map;
  }, [data]);

  const eventColorByName = useMemo(() => {
    const map: Record<string, string> = {};
    data?.forEach((lane, index) => {
      map[lane.name] = EVENT_COLORS[index % EVENT_COLORS.length];
    });
    return map;
  }, [data]);

  return {
    positionedEvents,
    layoutConfig,
    timelineHeight,
    timelineWidth,
    yearRange,
    laneColorByName,
    eventColorByName,
    yearHeight,
    setYearHeight,
  };
}
