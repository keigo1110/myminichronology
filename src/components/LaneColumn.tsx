'use client';

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { Lane, PositionedEvent, TimelineOrientation } from '../lib/types';
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
  laneHeight?: number;
  onEventClick?: (event: PositionedEvent) => void;
  yearRange: { min: number; max: number };
  timelineHeight: number;
  highlightedEventId?: string | null;
  orientation?: TimelineOrientation;
  showLaneLabel?: boolean;
  laneLabelWidth?: number;
}

export function LaneColumn({
  lane,
  events,
  laneColor,
  eventColor,
  laneWidth,
  laneHeight,
  onEventClick,
  yearRange,
  timelineHeight,
  highlightedEventId = null,
  orientation = 'vertical',
  showLaneLabel = false,
  laneLabelWidth = 108,
}: LaneColumnProps) {
  const theme = useTheme();
  const yearSpan = Math.max(1, yearRange.max - yearRange.min);
  const ticks = getYearTicks(yearRange.min, yearRange.max);
  const isHorizontal = orientation === 'horizontal';
  const rowHeight = isHorizontal ? laneHeight ?? timelineHeight : timelineHeight;

  return (
    <Box
      sx={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'row',
        width: isHorizontal ? laneLabelWidth + laneWidth : laneWidth,
        minHeight: rowHeight,
        height: isHorizontal ? rowHeight : undefined,
        borderRight: isHorizontal ? undefined : `1px solid ${theme.palette.chronology.hairline}`,
        borderBottom: isHorizontal ? `1px solid ${theme.palette.chronology.hairline}` : undefined,
      }}
    >
      {showLaneLabel && (
        <Box
          sx={{
            width: laneLabelWidth,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 1,
            backgroundColor: laneColor,
            borderRight: `1px solid ${theme.palette.chronology.hairlineStrong}`,
            position: 'sticky',
            left: 0,
            zIndex: 120,
          }}
        >
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '0.8rem',
              textAlign: 'center',
              color: theme.palette.text.primary,
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {lane.name}
          </Typography>
        </Box>
      )}

      <Box
        sx={{
          position: 'relative',
          flex: 1,
          width: laneWidth,
          minHeight: rowHeight,
          height: isHorizontal ? rowHeight : undefined,
          backgroundColor: laneColor,
        }}
      >
        {ticks.map((year) => {
          const pos = ((year - yearRange.min) / yearSpan) * (isHorizontal ? laneWidth : rowHeight);
          const isDecade = year % 10 === 0;

          return (
            <Box
              key={`grid-${lane.name}-${year}`}
              sx={{
                position: 'absolute',
                ...(isHorizontal
                  ? {
                      left: `${pos}px`,
                      top: 0,
                      width: '1px',
                      height: '100%',
                    }
                  : {
                      left: 0,
                      top: `${pos}px`,
                      width: '100%',
                      height: '1px',
                    }),
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
              orientation={orientation}
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
