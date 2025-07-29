import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { PositionedEvent } from '../lib/types';

interface EventItemProps {
  event: PositionedEvent;
  color: string;
  onClick?: (event: PositionedEvent) => void;
  style?: React.CSSProperties;
}

export function EventItem({ event, color, onClick, style }: EventItemProps) {
  const isPointEvent = !event.end;

  // イベントラベルに年代を追加
  const eventLabel = isPointEvent
    ? `${event.start}年：${event.label}`
    : `${event.start}年-${event.end}年：${event.label}`;

  return (
    <Tooltip title={eventLabel} placement="top">
      <Box
        sx={{
          ...style,
          cursor: 'pointer',
          '&:hover': {
            opacity: 0.8,
            transform: 'scale(1.02)',
            transition: 'all 0.2s ease'
          }
        }}
        onClick={() => onClick?.(event)}
      >
        {isPointEvent ? (
          // ポイントイベント（開始年のみ）
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '50%',
              backgroundColor: '#fff',
              border: `3px solid ${color}`,
              position: 'absolute',
              left: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
              zIndex: 10
            }}
          />
        ) : (
          // 期間イベント（開始年-終了年）
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: color,
              borderRadius: 1,
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
          />
        )}

        {/* イベントラベル */}
        <Typography
          variant="body2"
          sx={{
            position: 'absolute',
            left: isPointEvent ? 24 : 8,
            top: '50%',
            transform: 'translateY(-50%)',
            color: isPointEvent ? '#333' : '#fff',
            fontWeight: 'bold',
            fontSize: '0.7rem',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            maxWidth: isPointEvent ? 'calc(100% - 32px)' : 'calc(100% - 16px)',
            textShadow: isPointEvent ? 'none' : '1px 1px 2px rgba(0,0,0,0.5)',
            pointerEvents: 'none'
          }}
        >
          {event.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}