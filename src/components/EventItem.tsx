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
  const isInteractive = Boolean(onClick);

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
          cursor: isInteractive ? 'pointer' : 'default',
          outline: 'none',
          '&:hover': isInteractive
            ? {
                opacity: 0.8,
                transform: 'scale(1.02)',
                transition: 'all 0.2s ease',
              }
            : undefined,
          '&:focus-visible': {
            boxShadow: '0 0 0 2px #1976d2',
            borderRadius: 1,
          },
        }}
        onClick={() => onClick?.(event)}
        onKeyDown={handleKeyDown}
      >
        {isPointEvent ? (
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
              zIndex: 10,
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              backgroundColor: color,
              borderRadius: 1,
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          />
        )}

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
            pointerEvents: 'none',
          }}
        >
          {event.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
