import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { PositionedEvent } from '../lib/types';
import { pickReadableTextColor } from '../lib/colorPalette';

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
  const height = parseStyleHeight(style);
  const useVertical = !isPointEvent && height >= 72;
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
          backgroundColor: color,
          borderRadius: '2px',
          border: '1px solid rgba(0,0,0,0.12)',
          boxShadow: 'none',
          display: 'flex',
          alignItems: useVertical ? 'center' : 'flex-start',
          justifyContent: useVertical ? 'center' : 'flex-start',
          px: useVertical ? 0.4 : 0.7,
          py: useVertical ? 0.6 : 0.35,
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
            lineHeight: 1.3,
            letterSpacing: useVertical ? '0.06em' : '0.01em',
            writingMode: useVertical ? 'vertical-rl' : 'horizontal-tb',
            textOrientation: 'mixed',
            whiteSpace: useVertical ? 'nowrap' : 'normal',
            overflow: 'hidden',
            display: useVertical ? 'block' : '-webkit-box',
            WebkitLineClamp: useVertical ? undefined : 4,
            WebkitBoxOrient: useVertical ? undefined : 'vertical',
            wordBreak: 'break-word',
            maxHeight: '100%',
            maxWidth: '100%',
            pointerEvents: 'none',
          }}
        >
          {event.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
