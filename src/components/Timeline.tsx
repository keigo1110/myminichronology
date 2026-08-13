'use client';

import React from 'react';
import { Box, useTheme } from '@mui/material';
import type {
  TimelineData,
  PositionedEvent,
  DynamicLayoutConfig,
  TimelineOrientation,
  EventLabelOrientation,
} from '../lib/types';
import { LaneColumn } from './LaneColumn';
import { LaneHeaderRow } from './LaneHeaderRow';
import { YearAxis } from './YearAxis';
import {
  TIMELINE_HEADER_HEIGHT,
  YEAR_AXIS_HEIGHT_HORIZONTAL,
  LANE_LABEL_WIDTH_HORIZONTAL,
  MIN_LANE_ROW_HEIGHT,
  mapYearToPosition,
} from '../lib/computeLayout';
import { getYearTicksForPositions } from '../lib/yearTicks';

interface TimelineProps {
  data: TimelineData;
  positionedEvents: PositionedEvent[][];
  layoutConfig: DynamicLayoutConfig;
  laneColorByName: Record<string, string>;
  eventColorByName: Record<string, string>;
  yearRange: { min: number; max: number };
  onEventClick?: (event: PositionedEvent) => void;
  highlightedEventId?: string | null;
  orientation?: TimelineOrientation;
  labelOrientation?: EventLabelOrientation;
  pdfExporting?: boolean;
}

/**
 * html2canvas は要素全体を描画しても sticky の基準を画面幅のまま扱う。
 * PDF 書き出し中だけ軸を通常の flex 配置へ戻し、途中のレーンへ重ならないようにする。
 */
const PDF_AXIS_RESET_STYLES = {
  '&.pdf-export [data-year-axis]': {
    position: 'relative',
    top: 'auto',
    right: 'auto',
    bottom: 'auto',
    left: 'auto',
  },
  // モバイル幅から書き出しても、印刷版では右軸を年表の実端へ復元する。
  '&.pdf-export [data-year-axis="right"]': {
    display: 'flex',
  },
} as const;

export function Timeline({
  data,
  positionedEvents,
  layoutConfig,
  laneColorByName,
  eventColorByName,
  yearRange,
  onEventClick,
  highlightedEventId = null,
  orientation = 'vertical',
  labelOrientation = 'vertical',
  pdfExporting = false,
}: TimelineProps) {
  const theme = useTheme();
  const sheet = theme.palette.chronology.sheet;
  const border = theme.palette.chronology.hairlineStrong;
  const isHorizontal = orientation === 'horizontal';

  const timelineHeight =
    layoutConfig.timelineHeight || Math.max(800, (yearRange.max - yearRange.min) * 8);
  const {
    yearAxisWidth,
    yearAxisHeight = YEAR_AXIS_HEIGHT_HORIZONTAL,
    laneLabelWidth = LANE_LABEL_WIDTH_HORIZONTAL,
    totalWidth,
    laneWidthByName,
    laneWidths,
    laneHeightByName,
    laneHeights,
    yearContentWidth: configuredYearContentWidth,
  } = layoutConfig;

  const headerHeight = TIMELINE_HEADER_HEIGHT;
  const contentHeight = isHorizontal
    ? timelineHeight - yearAxisHeight * 2
    : timelineHeight - headerHeight;
  const resolvedLaneWidths = data.map(
    (lane, index) => laneWidthByName[lane.name] ?? laneWidths[index] ?? 300
  );
  const resolvedLaneHeights = data.map(
    (lane, index) =>
      laneHeightByName?.[lane.name] ?? laneHeights?.[index] ?? MIN_LANE_ROW_HEIGHT
  );
  const laneColors = data.map((lane) => laneColorByName[lane.name] || '#E3EEF7');
  const contentWidth = resolvedLaneWidths[0] ?? Math.max(640, totalWidth - laneLabelWidth);
  const yearContentWidth = configuredYearContentWidth ?? contentWidth;
  const yearScale = isHorizontal ? undefined : layoutConfig.yearScale;
  const axisContentSize = isHorizontal ? yearContentWidth : contentHeight;
  const mobileTimelineWidth = Math.max(0, totalWidth - yearAxisWidth);
  const minYear = yearRange.min;
  const maxYear = yearRange.max;
  const yearTicks = React.useMemo(
    () => {
      const activeRange = { min: minYear, max: maxYear };
      return getYearTicksForPositions(
        minYear,
        maxYear,
        (year) => mapYearToPosition(year, activeRange, axisContentSize, yearScale),
        isHorizontal ? 64 : 30
      );
    },
    [axisContentSize, isHorizontal, maxYear, minYear, yearScale]
  );

  if (isHorizontal) {
    return (
      <Box
        id="timelineRoot"
        className={pdfExporting ? 'pdf-export' : undefined}
        data-event-label-orientation={labelOrientation}
        sx={{
          width: `${totalWidth}px`,
          minHeight: timelineHeight,
          backgroundColor: sheet,
          borderRadius: 0,
          border: `1px solid ${border}`,
          overflow: 'visible',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxShadow:
            theme.palette.mode === 'dark'
              ? '0 1px 0 rgba(255,255,255,0.04)'
              : '0 1px 4px rgba(0,0,0,0.06)',
          margin: '0 auto',
          '&.pdf-export': {
            overflow: 'visible',
            height: 'auto',
            maxHeight: 'none',
            width: `${totalWidth}px`,
          },
          ...PDF_AXIS_RESET_STYLES,
        }}
      >
        <YearAxis
          side="top"
          orientation="horizontal"
          yearRange={yearRange}
          contentSize={yearContentWidth}
          thickness={yearAxisHeight}
          trackSize={totalWidth}
          labelOffset={laneLabelWidth}
          ticks={yearTicks}
        />

        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            minHeight: contentHeight,
          }}
        >
          {data.map((lane, index) => (
            <LaneColumn
              key={lane.name}
              lane={lane}
              events={positionedEvents[index] || []}
              laneColor={laneColorByName[lane.name] || '#E3EEF7'}
              eventColor={eventColorByName[lane.name] || '#1565C0'}
              laneWidth={resolvedLaneWidths[index]}
              laneHeight={resolvedLaneHeights[index]}
              onEventClick={onEventClick}
              yearRange={yearRange}
              timelineHeight={resolvedLaneHeights[index]}
              highlightedEventId={highlightedEventId}
              orientation="horizontal"
              labelOrientation={labelOrientation}
              showLaneLabel
              laneLabelWidth={laneLabelWidth}
              yearTicks={yearTicks}
              yearContentWidth={yearContentWidth}
            />
          ))}
        </Box>

        <YearAxis
          side="bottom"
          orientation="horizontal"
          yearRange={yearRange}
          contentSize={yearContentWidth}
          thickness={yearAxisHeight}
          trackSize={totalWidth}
          labelOffset={laneLabelWidth}
          ticks={yearTicks}
        />
      </Box>
    );
  }

  return (
    <Box
      id="timelineRoot"
      className={pdfExporting ? 'pdf-export' : undefined}
      data-event-label-orientation={labelOrientation}
      sx={{
        // 600px 未満では重複する右軸を隠し、その分の空白も残さない。
        width: { xs: `${mobileTimelineWidth}px`, sm: `${totalWidth}px` },
        minHeight: timelineHeight,
        backgroundColor: sheet,
        borderRadius: 0,
        border: `1px solid ${border}`,
        overflow: 'visible',
        position: 'relative',
        display: 'flex',
        boxShadow:
          theme.palette.mode === 'dark'
            ? '0 1px 0 rgba(255,255,255,0.04)'
            : '0 1px 4px rgba(0,0,0,0.06)',
        margin: '0 auto',
        '&.pdf-export': {
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none',
          width: `${totalWidth}px`,
        },
        ...PDF_AXIS_RESET_STYLES,
      }}
    >
      <YearAxis
        side="left"
        yearRange={yearRange}
        contentSize={contentHeight}
        headerHeight={headerHeight}
        thickness={yearAxisWidth}
        trackSize={timelineHeight}
        ticks={yearTicks}
        yearScale={yearScale}
      />

      <Box
        sx={{
          flex: 1,
          minHeight: timelineHeight,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 150,
          }}
        >
          <LaneHeaderRow
            data={data}
            laneWidths={resolvedLaneWidths}
            headerHeight={headerHeight}
            laneColors={laneColors}
          />
        </Box>

        <Box
          sx={{
            display: 'flex',
            flex: 1,
            minHeight: contentHeight,
          }}
        >
          {data.map((lane, index) => (
            <LaneColumn
              key={lane.name}
              lane={lane}
              events={positionedEvents[index] || []}
              laneColor={laneColorByName[lane.name] || '#E3EEF7'}
              eventColor={eventColorByName[lane.name] || '#1565C0'}
              laneWidth={resolvedLaneWidths[index]}
              onEventClick={onEventClick}
              yearRange={yearRange}
              timelineHeight={contentHeight}
              highlightedEventId={highlightedEventId}
              orientation="vertical"
              labelOrientation={labelOrientation}
              yearTicks={yearTicks}
              yearScale={yearScale}
            />
          ))}
        </Box>
      </Box>

      <YearAxis
        side="right"
        yearRange={yearRange}
        contentSize={contentHeight}
        headerHeight={headerHeight}
        thickness={yearAxisWidth}
        trackSize={timelineHeight}
        ticks={yearTicks}
        yearScale={yearScale}
      />
    </Box>
  );
}
