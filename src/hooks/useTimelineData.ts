import { useState, useMemo } from 'react';
import { TimelineData, PositionedEvent, DynamicLayoutConfig } from '../lib/types';
import { computeLayout, calculateTimelineHeight, calculateTimelineWidth } from '../lib/computeLayout';

export function useTimelineData(data: TimelineData | null) {
  const [selectedEvent, setSelectedEvent] = useState<PositionedEvent | null>(null);
  const [yearHeight, setYearHeight] = useState(24); // 年間高さの状態

  const layoutResult = useMemo(() => {
    if (!data) {
      return {
        positionedEvents: [],
        layoutConfig: { laneWidths: [], yearAxisWidth: 60, totalWidth: 120, timelineHeight: 800 }
      };
    }
    // 年間高さのスケールファクターを計算（基準値24pxに対する比率）
    const yearHeightScale = yearHeight / 24;
    return computeLayout(data, yearHeightScale);
  }, [data, yearHeight]);

  const { positionedEvents, layoutConfig } = layoutResult;

  const timelineHeight = useMemo(() => {
    if (!data) return 800;
    // layoutConfigから動的高さを使用、フォールバックとして計算関数を使用
    return layoutConfig.timelineHeight || calculateTimelineHeight(data);
  }, [data, layoutConfig.timelineHeight]);

  const timelineWidth = useMemo(() => {
    if (!data) return 120;
    return layoutConfig.totalWidth || calculateTimelineWidth(data);
  }, [data, layoutConfig.totalWidth]);

  const yearRange = useMemo(() => {
    if (!data || data.length === 0) return { min: 0, max: 0 };

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

    return {
      min: Math.floor(minYear / 10) * 10,
      max: Math.ceil(maxYear / 10) * 10
    };
  }, [data]);

  const laneColors = useMemo(() => {
    const colors = [
      '#E3F2FD', // 薄い青
      '#F3E5F5', // 薄い紫
      '#E8F5E8', // 薄い緑
      '#FFF8E1', // 薄い茶色系
      '#FCE4EC'  // 薄いピンク
    ];

    return colors.slice(0, data?.length || 0);
  }, [data]);

  // イベント用の濃い色パレット（WCAG 4.5:1準拠）
  const eventColors = useMemo(() => {
    const colors = [
      '#1565C0', // より濃い青（Blue 800）
      '#7B1FA2', // 濃い紫（Purple 700）
      '#2E7D32', // より濃い緑（Green 800）
      '#5D4037', // 濃い茶色（Brown 700）
      '#C2185B'  // 濃いピンク（Pink 700）
    ];

    return colors.slice(0, data?.length || 0);
  }, [data]);

  return {
    positionedEvents,
    layoutConfig,
    timelineHeight,
    timelineWidth,
    yearRange,
    laneColors,
    eventColors,
    selectedEvent,
    setSelectedEvent,
    yearHeight,
    setYearHeight
  };
}