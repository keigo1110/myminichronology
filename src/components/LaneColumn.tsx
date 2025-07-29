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
  showHeader?: boolean; // ヘッダー表示制御
}

export function LaneColumn({
  lane,
  events,
  color,
  laneWidth,
  onEventClick,
  yearRange,
  timelineHeight,
  scrollPosition,
  showHeader = true // デフォルトはヘッダー表示
}: LaneColumnProps) {
  // 年軸のヘッダー高さを考慮した位置計算
  const headerHeight = 60;

  return (
    <Box
      sx={{
        position: 'relative',
        width: laneWidth,
        minHeight: timelineHeight, // minHeightに変更
        backgroundColor: color,
        borderRight: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* レーンタイトル（条件付き表示） */}
      {showHeader && (
        <Box
          data-lane-title="true"
          sx={{
            position: 'sticky', // stickyで固定
            top: 0,
            left: 0,
            width: '100%',
            height: headerHeight,
            zIndex: 99, // 年代軸より少し低く
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderBottom: '2px solid rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
      )}

      {/* イベントコンテンツエリア */}
      <Box
        sx={{
          position: 'relative',
          flex: 1, // flexで残り全体を占有
          minHeight: timelineHeight, // 最小高さを保証
        }}
      >
        {/* グリッド線の描画 */}
        {Array.from({ length: Math.floor((yearRange.max - yearRange.min) / 10) + 1 }, (_, i) => {
          const year = yearRange.min + i * 10;
          const y = ((year - yearRange.min) / (yearRange.max - yearRange.min)) * timelineHeight;

          return (
            <Box
              key={`grid-${year}`}
              sx={{
                position: 'absolute',
                left: 0,
                top: `${y}px`,
                width: '100%',
                height: '1px',
                backgroundColor: 'rgba(0,0,0,0.1)',
                zIndex: 1
              }}
            />
          );
        })}

        {/* イベントの描画 */}
        {events.map((event, index) => {
          // スクロール位置の影響を削除（固定位置で表示）
          const eventTop = event.y;
          const eventHeight = event.height;

          return (
            <EventItem
              key={`${event.label}-${index}`}
              event={event}
              color={color}
              onClick={onEventClick}
              style={{
                position: 'absolute',
                top: `${eventTop}px`,
                left: '4px',
                right: '4px',
                height: `${eventHeight}px`,
                zIndex: 5
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}