import React from 'react';
import { Box, Typography } from '@mui/material';
import { formatYearLabel, getYearTickInterval, getYearTicks } from '../lib/yearTicks';

interface YearAxisProps {
  yearRange: { min: number; max: number };
  timelineHeight: number;
  contentHeight: number;
  headerHeight: number;
  width: number;
  side: 'left' | 'right';
}

export function YearAxis({
  yearRange,
  timelineHeight,
  contentHeight,
  headerHeight,
  width,
  side,
}: YearAxisProps) {
  const yearSpan = Math.max(1, yearRange.max - yearRange.min);
  const interval = getYearTickInterval(yearRange.min, yearRange.max);
  const ticks = getYearTicks(yearRange.min, yearRange.max);
  const stickySide = side === 'left' ? { left: 0 } : { right: 0 };

  return (
    <Box
      data-year-axis={side}
      sx={{
        position: 'sticky',
        ...stickySide,
        top: 0,
        width,
        minHeight: timelineHeight,
        backgroundColor: '#FFFEFA',
        borderRight: side === 'left' ? '1px solid rgba(0,0,0,0.18)' : undefined,
        borderLeft: side === 'right' ? '1px solid rgba(0,0,0,0.18)' : undefined,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          height: headerHeight,
          backgroundColor: '#FFFEFA',
          borderBottom: '1px solid rgba(0,0,0,0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 201,
        }}
      >
        <Typography
          sx={{
            color: '#212121',
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '0.04em',
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
          const isEmphasized = year % 10 === 0 || interval >= 10;
          const label = formatYearLabel(year, interval);

          return (
            <Box
              key={`${side}-${year}`}
              data-year-label="true"
              sx={{
                position: 'absolute',
                left: 4,
                right: 4,
                top: `${y - 8}px`,
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
                fontSize: isEmphasized ? '0.72rem' : '0.62rem',
                fontWeight: isEmphasized ? 700 : 500,
                color: isEmphasized ? '#212121' : '#666',
                zIndex: 15,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
