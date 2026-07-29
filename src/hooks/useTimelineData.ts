import { useState, useMemo } from 'react';
import { TimelineData, PositionedEvent } from '../lib/types';
import { computeLayout, calculateTimelineHeight, calculateTimelineWidth } from '../lib/computeLayout';
import { chronologyLaneBackgrounds } from '../lib/colorPalette';

export function useTimelineData(data: TimelineData | null) {
  const [yearHeight, setYearHeight] = useState(24);

  const layoutResult = useMemo(() => {
    if (!data) {
      return {
        positionedEvents: [] as PositionedEvent[][],
        layoutConfig: {
          laneWidths: [],
          laneWidthByName: {},
          yearAxisWidth: 56,
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
      map[lane.name] = chronologyLaneBackgrounds[index % chronologyLaneBackgrounds.length];
    });
    return map;
  }, [data]);

  const eventColorByName = useMemo(() => {
    const map: Record<string, string> = {};
    data?.forEach((lane) => {
      // テンプレート未指定時のフォールバックは黒（イベント個別 color が優先）
      map[lane.name] = '#000000';
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
