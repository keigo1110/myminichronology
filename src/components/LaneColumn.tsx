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
  const headerHeight = 60;
  const contentHeight = timelineHeight - headerHeight;

  return (
    <Box
      sx={{
        position: 'relative',
        width: laneWidth,
        height: timelineHeight,
        backgroundColor: color,
        borderRight: '1px solid rgba(0,0,0,0.1)',
        // overflow: 'hidden' を削除してsticky要素が正しく動作するようにする
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* レーンタイトル（横書き） */}
      <Box
        data-lane-title="true"
        sx={{
          position: 'absolute', // stickyから絶対位置に変更
          top: 0,
          left: 0,
          width: '100%',
          height: headerHeight,
          zIndex: 30,
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

      {/* イベントコンテンツエリア */}
      <Box
        sx={{
          position: 'relative',
          height: `calc(100% - ${headerHeight}px)`,
          marginTop: `${headerHeight}px`, // ヘッダー分のマージンを追加
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

        {/* イベントの描画 */}
        {events.map((event, index) => {
          // スクロール位置の影響を削除
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