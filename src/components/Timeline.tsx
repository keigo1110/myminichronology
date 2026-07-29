import React from 'react';
import { Box, Typography } from '@mui/material';
import { TimelineData, PositionedEvent, DynamicLayoutConfig } from '../lib/types';
import { LaneColumn } from './LaneColumn';
import { LaneHeaderRow } from './LaneHeaderRow';
import { getYearTicks } from '../lib/yearTicks';

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

  const headerHeight = 60;
  const contentHeight = timelineHeight - headerHeight;
  const yearSpan = Math.max(1, yearRange.max - yearRange.min);
  const ticks = getYearTicks(yearRange.min, yearRange.max);

  return (
    <Box
      id="timelineRoot"
      sx={{
        width: `${totalWidth}px`,
        minHeight: timelineHeight,
        backgroundColor: '#F7F7F7',
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.1)',
        overflow: 'visible',
        position: 'relative',
        display: 'flex',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        margin: '0 auto',
        '&.pdf-export': {
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none',
        },
      }}
    >
      <Box
        data-year-axis="true"
        sx={{
          position: 'sticky',
          left: 0,
          top: 0,
          width: yearAxisWidth,
          minHeight: timelineHeight,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRight: '1px solid rgba(0,0,0,0.1)',
          zIndex: 200,
          display: 'flex',
          flexDirection: 'column',
          minWidth: '60px',
        }}
      >
        <Box
          sx={{
            height: headerHeight,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderBottom: '1px solid rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'sticky',
            top: 0,
            zIndex: 201,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#212121',
              fontWeight: 'bold',
              fontSize: '1rem',
            }}
          >
            年代
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: contentHeight,
          }}
        >
          {ticks.map((year) => {
            const y = ((year - yearRange.min) / yearSpan) * contentHeight;

            return (
              <Box
                key={year}
                data-year-label="true"
                sx={{
                  position: 'absolute',
                  left: '8px',
                  top: `${y - 10}px`,
                  width: 'calc(100% - 16px)',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#666',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '2px',
                  paddingLeft: '4px',
                  zIndex: 15,
                }}
              >
                {year}
              </Box>
            );
          })}
        </Box>
      </Box>

      <Box
        sx={{
          flex: 1,
          minHeight: timelineHeight,
          display: 'flex',
          flexDirection: 'column',
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
            laneWidths={data.map(
              (lane, index) => laneWidthByName[lane.name] ?? laneWidths[index] ?? 300
            )}
            headerHeight={headerHeight}
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
              laneColor={laneColorByName[lane.name] || '#E3F2FD'}
              eventColor={eventColorByName[lane.name] || '#1565C0'}
              laneWidth={laneWidthByName[lane.name] ?? laneWidths[index] ?? 300}
              onEventClick={onEventClick}
              yearRange={yearRange}
              timelineHeight={contentHeight}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}
