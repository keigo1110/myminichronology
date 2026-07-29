'use client';

import React from 'react';
import { Box, useTheme } from '@mui/material';
import { Lane, PositionedEvent } from '../lib/types';
import { EventItem, EVENT_ITEM_MIN_HEIGHT } from './EventItem';
import { getYearTicks } from '../lib/yearTicks';
import { DEFAULT_EVENT_COLOR } from '../lib/parseExcel';
import { getEventDomId } from '../lib/eventDomId';

interface LaneColumnProps {
  lane: Lane;
  events: PositionedEvent[];
  laneColor: string;
  eventColor: string;
  laneWidth: number;
  onEventClick?: (event: PositionedEvent) => void;
  yearRange: { min: number; max: number };
  timelineHeight: number;
  highlightedEventId?: string | null;
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
  highlightedEventId = null,
}: LaneColumnProps) {
  const theme = useTheme();
  const yearSpan = Math.max(1, yearRange.max - yearRange.min);
  const ticks = getYearTicks(yearRange.min, yearRange.max);

  return (
    <Box
      sx={{
        position: 'relative',
        width: laneWidth,
        minHeight: timelineHeight,
        backgroundColor: laneColor,
        borderRight: `1px solid ${theme.palette.chronology.hairline}`,
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
                backgroundColor: isDecade
                  ? theme.palette.chronology.gridDecade
                  : theme.palette.chronology.grid,
                zIndex: 1,
              }}
            />
          );
        })}

        {events.map((event, index) => {
          const color = event.color || eventColor || DEFAULT_EVENT_COLOR;
          const eventId = getEventDomId(lane.name, event, index);

          return (
            <EventItem
              key={eventId}
              eventId={eventId}
              event={event}
              color={color}
              onClick={onEventClick}
              highlighted={highlightedEventId === eventId}
              style={{
                position: 'absolute',
                top: `${event.y}px`,
                left: `${event.x}px`,
                width: `${Math.max(event.width, 1)}px`,
                height: `${Math.max(event.height, EVENT_ITEM_MIN_HEIGHT)}px`,
                zIndex: event.displayStyle === 'label' ? 7 : event.end ? 4 : 6,
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}
