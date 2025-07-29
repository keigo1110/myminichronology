import React from 'react';
import { Box, Typography } from '@mui/material';
import { TimelineData } from '../lib/types';

interface LaneHeaderRowProps {
  data: TimelineData;
  laneWidths: number[];
  headerHeight: number;
}

export function LaneHeaderRow({ data, laneWidths, headerHeight }: LaneHeaderRowProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        position: 'sticky',
        top: 0,
        zIndex: 150,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderBottom: '1px solid rgba(0,0,0,0.1)', // 1pxに統一
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
            borderRight: '1px solid rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            variant="body1"
            sx={{
              color: '#212121',
              fontWeight: 'bold',
              fontSize: '0.9rem',
              textAlign: 'center',
              maxWidth: '90%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {lane.name}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}