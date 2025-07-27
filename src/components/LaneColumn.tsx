import React from 'react';
import { Box, Typography } from '@mui/material';
import { Lane, PositionedEvent } from '../lib/types';
import { EventItem } from './EventItem';

interface LaneColumnProps {
  lane: Lane;
  events: PositionedEvent[];
  color: string;
  laneWidth: number;
  onEventClick?: (event: PositionedEvent) => void;
  yearRange: { min: number; max: number };
  timelineHeight: number;
  scrollPosition: number;
}

export function LaneColumn({
  lane,
  events,
  color,
  laneWidth,
  onEventClick,
  yearRange,
  timelineHeight,
  scrollPosition
}: LaneColumnProps) {
  // 年軸のヘッダー高さを考慮した位置計算
  const headerHeight = 100;
  const contentHeight = timelineHeight - headerHeight;

  return (
    <Box
      sx={{
        position: 'relative',
        width: laneWidth,
        height: timelineHeight,
        backgroundColor: color,
        borderRight: '1px solid rgba(0,0,0,0.1)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* レーンタイトル（縦書き） */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          backgroundColor: color,
          borderBottom: '2px solid rgba(0,0,0,0.2)',
          p: 1.5,
          height: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 'bold',
            color: '#212121',
            writingMode: 'vertical-rl',
            textOrientation: 'mixed',
            fontSize: '1.25rem',
            lineHeight: 1.2,
            textAlign: 'center',
            letterSpacing: '0.1em'
          }}
        >
          {lane.name}
        </Typography>
      </Box>

      {/* グリッド線とイベントの統合エリア */}
      <Box
        sx={{
          position: 'relative',
          height: `calc(${timelineHeight}px - 100px)`,
          overflow: 'hidden'
        }}
      >
        {/* 10年ごとのグリッド線 - 座標系を年代軸と完全に一致させる */}
        {Array.from({ length: Math.floor((yearRange.max - yearRange.min) / 10) + 1 }, (_, i) => {
          const year = yearRange.min + i * 10;
          // 年代軸と同じ座標計算を使用
          const y = ((year - yearRange.min) / (yearRange.max - yearRange.min)) * contentHeight;
          // グリッド線はレーンのコンテンツエリア内なので、headerHeightのオフセットは不要
          const adjustedY = y - scrollPosition;

          // グリッド線が表示範囲内にあるかチェック
          const isVisible = adjustedY >= -50 && adjustedY <= contentHeight + 50;

          if (!isVisible) {
            return null;
          }

          return (
            <Box
              key={`grid-${year}`}
              sx={{
                position: 'absolute',
                left: 0,
                top: adjustedY,
                width: '100%',
                height: '1px',
                backgroundColor: 'rgba(0,0,0,0.2)',
                zIndex: 1
              }}
            />
          );
        })}

        {events.map((event, index) => (
          <EventItem
            key={`${event.start}-${event.end}-${index}`}
            event={event}
            color={color}
            onClick={() => onEventClick?.(event)}
            yearRange={yearRange}
            timelineHeight={timelineHeight}
            scrollPosition={scrollPosition}
          />
        ))}
      </Box>
    </Box>
  );
}