import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { PositionedEvent } from '../lib/types';

interface EventItemProps {
  event: PositionedEvent;
  color: string;
  onClick?: () => void;
  yearRange: { min: number; max: number };
  timelineHeight: number;
  scrollPosition: number;
}

export function EventItem({ event, color, onClick, yearRange, timelineHeight, scrollPosition }: EventItemProps) {
  const isPointEvent = !event.end;

  // 年軸のヘッダー高さを考慮した位置計算
  const headerHeight = 60;
  const contentHeight = timelineHeight - headerHeight;

  // 重複解消済みのY位置を使用（computeLayoutで計算済み）
  const adjustedY = event.y - scrollPosition;

  // イベントラベルに年代を追加
  const eventLabel = isPointEvent
    ? `${event.start}年：${event.label}`
    : `${event.start}年-${event.end}年：${event.label}`;

  // イベントが表示範囲内にあるかチェック
  const isVisible = adjustedY >= -50 && adjustedY <= contentHeight + 50;

  if (!isVisible) {
    return null;
  }

  return (
    <Tooltip title={eventLabel} placement="top">
      <Box
        sx={{
          position: 'absolute',
          left: 10,
          top: adjustedY,
          right: 20,
          cursor: 'pointer',
          zIndex: 5,
          '&:hover': {
            opacity: 0.8,
            transform: 'scale(1.02)',
            transition: 'all 0.2s ease'
          }
        }}
        onClick={onClick}
      >
        {isPointEvent ? (
          // 点イベント（円）
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minHeight: event.height,
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 0.5,
              p: 0.25,
              border: `1px solid ${color}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Box
              sx={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid #fff',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                flexShrink: 0
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: '#212121',
                fontSize: '0.875rem',
                lineHeight: 1.3,
                fontWeight: 500,
                flex: 1
              }}
            >
              {eventLabel}
            </Typography>
          </Box>
        ) : (
          // 期間イベント（縦バー）
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              minHeight: event.height,
              backgroundColor: 'rgba(255,255,255,0.8)',
              borderRadius: 0.5,
              p: 0.25,
              border: `1px solid ${color}`,
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            <Box
              sx={{
                width: 6,
                backgroundColor: color,
                borderRadius: 3,
                flexShrink: 0,
                position: 'relative',
                alignSelf: 'stretch',
                minHeight: Math.max(20, event.height - 8),
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: '100%',
                  background: 'linear-gradient(180deg, transparent, rgba(255,255,255,0.3), transparent)',
                  borderRadius: 3
                }
              }}
            />
            <Typography
              variant="body2"
              sx={{
                color: '#212121',
                fontSize: '0.875rem',
                lineHeight: 1.3,
                fontWeight: 500,
                flex: 1,
                alignSelf: 'center'
              }}
            >
              {eventLabel}
            </Typography>
          </Box>
        )}
      </Box>
    </Tooltip>
  );
}