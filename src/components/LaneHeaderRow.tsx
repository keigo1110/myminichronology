'use client';

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { TimelineData } from '../lib/types';

interface LaneHeaderRowProps {
  data: TimelineData;
  laneWidths: number[];
  headerHeight: number;
  laneColors?: string[];
}

export function LaneHeaderRow({
  data,
  laneWidths,
  headerHeight,
  laneColors = [],
}: LaneHeaderRowProps) {
  const theme = useTheme();
  const sheet = theme.palette.chronology.sheet;
  const border = theme.palette.chronology.hairlineStrong;
  const laneBorder = theme.palette.chronology.hairline;

  return (
    <Box
      sx={{
        display: 'flex',
        position: 'sticky',
        top: 0,
        zIndex: 150,
        backgroundColor: sheet,
        borderBottom: `1px solid ${border}`,
      }}
    >
      {data.map((lane, index) => (
        <Box
          key={lane.name}
          sx={{
            width: laneWidths[index] || 300,
            height: headerHeight,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRight: `1px solid ${laneBorder}`,
            backgroundColor: laneColors[index] || sheet,
            px: 1,
          }}
        >
          <Typography
            sx={{
              color: theme.palette.text.primary,
              fontWeight: 700,
              fontSize: '0.85rem',
              textAlign: 'center',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              letterSpacing: '0.02em',
            }}
          >
            {lane.name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}
