import React from 'react';
import { Box, Typography } from '@mui/material';
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
  return (
    <Box
      sx={{
        display: 'flex',
        position: 'sticky',
        top: 0,
        zIndex: 150,
        backgroundColor: '#FFFEFA',
        borderBottom: '1px solid rgba(0,0,0,0.18)',
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
            borderRight: '1px solid rgba(0,0,0,0.12)',
            backgroundColor: laneColors[index] || '#FFFEFA',
            px: 1,
          }}
        >
          <Typography
            sx={{
              color: '#212121',
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
