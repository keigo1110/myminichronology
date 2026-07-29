import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { PositionedEvent } from '../lib/types';
import { pickReadableTextColor } from '../lib/colorPalette';

/** 1行テキスト + 枠線が収まる最小表示高さ */
export const EVENT_ITEM_MIN_HEIGHT = 22;

interface EventItemProps {
  event: PositionedEvent;
  color: string;
  onClick?: (event: PositionedEvent) => void;
  style?: React.CSSProperties;
}

function parseStyleHeight(style?: React.CSSProperties): number {
  if (!style?.height) return 0;
  if (typeof style.height === 'number') return style.height;
  return parseFloat(String(style.height)) || 0;
}

export function EventItem({ event, color, onClick, style }: EventItemProps) {
  const isPointEvent = !event.end;
  const isInteractive = Boolean(onClick);
  const height = Math.max(parseStyleHeight(style), EVENT_ITEM_MIN_HEIGHT);
  const useVertical = !isPointEvent && height >= 72;
  const isCompact = !useVertical && height < 40;
  const textColor = pickReadableTextColor(color);

  const eventLabel = isPointEvent
    ? `${event.start}年：${event.label}`
    : `${event.start}年-${event.end}年：${event.label}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(event);
    }
  };

  return (
    <Tooltip title={eventLabel} placement="top">
      <Box
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={eventLabel}
        sx={{
          ...style,
          height: `${height}px`,
          boxSizing: 'border-box',
          backgroundColor: color,
          borderRadius: '2px',
          border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: useVertical ? 'center' : 'flex-start',
          px: useVertical ? 0.4 : 0.7,
          // コンパクト時は上下パディングを付けず、中央揃えで下端欠けを防ぐ
          py: useVertical ? 0.6 : isCompact ? 0 : 0.5,
          overflow: 'hidden',
          cursor: isInteractive ? 'pointer' : 'default',
          outline: 'none',
          '&:hover': isInteractive
            ? {
                filter: 'brightness(0.96)',
              }
            : undefined,
          '&:focus-visible': {
            boxShadow: '0 0 0 2px #1976d2',
          },
        }}
        onClick={() => onClick?.(event)}
        onKeyDown={handleKeyDown}
      >
        <Typography
          component="span"
          sx={{
            color: textColor,
            fontWeight: 700,
            fontSize: useVertical ? '0.74rem' : '0.68rem',
            lineHeight: isCompact ? '1.2' : 1.35,
            letterSpacing: useVertical ? '0.06em' : '0.01em',
            writingMode: useVertical ? 'vertical-rl' : 'horizontal-tb',
            textOrientation: 'mixed',
            whiteSpace: useVertical || isCompact ? 'nowrap' : 'normal',
            overflow: 'hidden',
            textOverflow: useVertical || isCompact ? 'ellipsis' : undefined,
            display: useVertical ? 'block' : isCompact ? 'block' : '-webkit-box',
            WebkitLineClamp: useVertical || isCompact ? undefined : 4,
            WebkitBoxOrient: useVertical || isCompact ? undefined : 'vertical',
            wordBreak: 'break-word',
            maxWidth: '100%',
            m: 0,
            // ベースライン下の見切れを避ける（日本語・ラテン共通）
            paddingTop: isCompact ? '1px' : 0,
            paddingBottom: isCompact ? '2px' : 0,
            pointerEvents: 'none',
          }}
        >
          {event.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
