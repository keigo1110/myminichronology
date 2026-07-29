import React from 'react';
import { Box } from '@mui/material';
import { Lane, PositionedEvent } from '../lib/types';
import { EventItem, EVENT_ITEM_MIN_HEIGHT } from './EventItem';
import { getYearTicks } from '../lib/yearTicks';
import { DEFAULT_EVENT_COLOR } from '../lib/parseExcel';

interface LaneColumnProps {
  lane: Lane;
  events: PositionedEvent[];
  laneColor: string;
  eventColor: string;
  laneWidth: number;
  onEventClick?: (event: PositionedEvent) => void;
  yearRange: { min: number; max: number };
  timelineHeight: number;
}

export function LaneColumn({
  lane,
  events,
  laneColor,
  eventColor,
  laneWidth,
  onEventClick,
  yearRange,
  timelineHeight,
}: LaneColumnProps) {
  const yearSpan = Math.max(1, yearRange.max - yearRange.min);
  const ticks = getYearTicks(yearRange.min, yearRange.max);

  return (
    <Box
      sx={{
        position: 'relative',
        width: laneWidth,
        minHeight: timelineHeight,
        backgroundColor: laneColor,
        borderRight: '1px solid rgba(0,0,0,0.12)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: timelineHeight,
        }}
      >
        {ticks.map((year) => {
          const y = ((year - yearRange.min) / yearSpan) * timelineHeight;
          const isDecade = year % 10 === 0;

          return (
            <Box
              key={`grid-${lane.name}-${year}`}
              sx={{
                position: 'absolute',
                left: 0,
                top: `${y}px`,
                width: '100%',
                height: '1px',
                backgroundColor: isDecade ? 'rgba(0,0,0,0.18)' : 'rgba(0,0,0,0.08)',
                zIndex: 1,
              }}
            />
          );
        })}

        {events.map((event, index) => {
          const color = event.color || eventColor || DEFAULT_EVENT_COLOR;

          return (
            <EventItem
              key={`${lane.name}-${event.label}-${event.start}-${index}`}
              event={event}
              color={color}
              onClick={onEventClick}
              style={{
                position: 'absolute',
                top: `${event.y}px`,
                left: '3px',
                right: '3px',
                height: `${Math.max(event.height, EVENT_ITEM_MIN_HEIGHT)}px`,
                zIndex: 5,
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
