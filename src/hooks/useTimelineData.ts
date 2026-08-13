import { useState, useMemo } from 'react';
import type {
  TimelineData,
  PositionedEvent,
  TimelineOrientation,
  EventLabelOrientation,
} from '../lib/types';
import { computeLayout, calculateTimelineHeight, calculateTimelineWidth } from '../lib/computeLayout';
import { chronologyLaneBackgrounds } from '../lib/colorPalette';

export function useTimelineData(
  data: TimelineData | null,
  orientation: TimelineOrientation = 'vertical',
  labelOrientation: EventLabelOrientation = 'vertical'
) {
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
          orientation,
        },
        yearRange: { min: 0, max: 0 },
      };
    }
    const yearHeightScale = yearHeight / 24;
    return computeLayout(
      data,
      yearHeightScale,
      undefined,
      orientation,
      labelOrientation
    );
  }, [data, yearHeight, orientation, labelOrientation]);

  const { positionedEvents, layoutConfig, yearRange } = layoutResult;

  const timelineHeight = useMemo(() => {
    if (!data) return 800;
    return (
      layoutConfig.timelineHeight ||
      calculateTimelineHeight(data, yearHeight / 24, labelOrientation)
    );
  }, [data, labelOrientation, layoutConfig.timelineHeight, yearHeight]);

  const timelineWidth = useMemo(() => {
    if (!data) return 120;
    return layoutConfig.totalWidth || calculateTimelineWidth(data, labelOrientation);
  }, [data, labelOrientation, layoutConfig.totalWidth]);

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
      // テンプレート未指定時のフォールバック文字色は黒（イベント個別 color が優先）
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
