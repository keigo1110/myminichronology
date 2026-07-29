import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { PositionedEvent } from '../lib/types';
import { pickReadableTextColor } from '../lib/colorPalette';
import { DEFAULT_EVENT_COLOR } from '../lib/parseExcel';

/** 1行テキスト + 枠線が収まる最小表示高さ */
export const EVENT_ITEM_MIN_HEIGHT = 22;

/** 横書き時のデフォルトフォントサイズ（現状相当 ≈ 0.68rem） */
export const DEFAULT_FONT_SIZE_PX = 11;
/** 縦書き時のデフォルト */
export const DEFAULT_VERTICAL_FONT_SIZE_PX = 12;

interface EventItemProps {
  event: PositionedEvent;
  color?: string;
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

  const fillColor = event.color || color || DEFAULT_EVENT_COLOR;
  const textColor = pickReadableTextColor(fillColor);
  const fontSizePx =
    event.fontSize ??
    (useVertical ? DEFAULT_VERTICAL_FONT_SIZE_PX : DEFAULT_FONT_SIZE_PX);

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
          backgroundColor: fillColor,
          borderRadius: '2px',
          border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: useVertical ? 'center' : 'flex-start',
          px: useVertical ? 0.4 : 0.7,
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
            fontSize: `${fontSizePx}px`,
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
