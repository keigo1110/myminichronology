'use client';

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { TimelineData } from '../lib/types';
import { laneOverlayColors } from '../lib/colorPalette';

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
      {data.map((lane, index) => {
        const laneBg = laneColors[index] || sheet;
        const overlay = laneOverlayColors(laneBg);

        return (
          <Box
            key={lane.name}
            sx={{
              width: laneWidths[index] || 300,
              height: headerHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRight: `1px solid ${overlay.hairline}`,
              backgroundColor: laneBg,
              px: 1,
            }}
          >
            <Typography
              component="span"
              sx={{
                color: overlay.ink,
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
        );
      })}
    </Box>
  );
}
