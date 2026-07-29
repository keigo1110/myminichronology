import React from 'react';
import { Box } from '@mui/material';
import { TimelineData, PositionedEvent, DynamicLayoutConfig } from '../lib/types';
import { LaneColumn } from './LaneColumn';
import { LaneHeaderRow } from './LaneHeaderRow';
import { YearAxis } from './YearAxis';
import { TIMELINE_HEADER_HEIGHT } from '../lib/computeLayout';

interface TimelineProps {
  data: TimelineData;
  positionedEvents: PositionedEvent[][];
  layoutConfig: DynamicLayoutConfig;
  laneColorByName: Record<string, string>;
  eventColorByName: Record<string, string>;
  yearRange: { min: number; max: number };
  onEventClick?: (event: PositionedEvent) => void;
}

export function Timeline({
  data,
  positionedEvents,
  layoutConfig,
  laneColorByName,
  eventColorByName,
  yearRange,
  onEventClick,
}: TimelineProps) {
  const timelineHeight =
    layoutConfig.timelineHeight || Math.max(800, (yearRange.max - yearRange.min) * 8);
  const { yearAxisWidth, totalWidth, laneWidthByName, laneWidths } = layoutConfig;

  const headerHeight = TIMELINE_HEADER_HEIGHT;
  const contentHeight = timelineHeight - headerHeight;
  const resolvedLaneWidths = data.map(
    (lane, index) => laneWidthByName[lane.name] ?? laneWidths[index] ?? 300
  );
  const laneColors = data.map((lane) => laneColorByName[lane.name] || '#E3EEF7');

  return (
    <Box
      id="timelineRoot"
      sx={{
        width: `${totalWidth}px`,
        minHeight: timelineHeight,
        backgroundColor: '#FFFEFA',
        borderRadius: 0,
        border: '1px solid rgba(0,0,0,0.18)',
        overflow: 'visible',
        position: 'relative',
        display: 'flex',
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        margin: '0 auto',
        '&.pdf-export': {
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none',
        },
      }}
    >
      <YearAxis
        side="left"
        yearRange={yearRange}
        timelineHeight={timelineHeight}
        contentHeight={contentHeight}
        headerHeight={headerHeight}
        width={yearAxisWidth}
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
            />
          ))}
        </Box>
      </Box>

      <YearAxis
        side="right"
        yearRange={yearRange}
        timelineHeight={timelineHeight}
        contentHeight={contentHeight}
        headerHeight={headerHeight}
        width={yearAxisWidth}
      />
    </Box>
  );
}
