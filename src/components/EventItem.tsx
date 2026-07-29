import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { PositionedEvent } from '../lib/types';
import { DEFAULT_EVENT_COLOR } from '../lib/parseExcel';
import {
  RANGE_BAR_WIDTH_PX,
  RANGE_BAR_WIDTH_VERTICAL_PX,
} from '../lib/computeLayout';

/** 1行テキストが収まる最小表示高さ */
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
  const isRangeEvent = !isPointEvent;
  const isInteractive = Boolean(onClick);
  const height = Math.max(parseStyleHeight(style), EVENT_ITEM_MIN_HEIGHT);
  const useVertical = isRangeEvent && height >= 72;
  const isCompact = !useVertical && height < 40;

  const accentColor = event.color || color || DEFAULT_EVENT_COLOR;
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
          backgroundColor: 'transparent',
          border: 'none',
          boxShadow: 'none',
          display: 'flex',
          flexDirection: 'row',
          alignItems: useVertical ? 'flex-start' : 'center',
          justifyContent: 'flex-start',
          gap: isRangeEvent ? '4px' : 0,
          px: 0,
          py: 0,
          overflow: 'hidden',
          cursor: isInteractive ? 'pointer' : 'default',
          outline: 'none',
          '&:hover': isInteractive
            ? {
                opacity: 0.75,
              }
            : undefined,
          '&:focus-visible': {
            boxShadow: '0 0 0 2px #1976d2',
            borderRadius: '2px',
          },
        }}
        onClick={() => onClick?.(event)}
        onKeyDown={handleKeyDown}
      >
        {isRangeEvent && (
          <Box
            aria-hidden
            sx={{
              width: useVertical ? RANGE_BAR_WIDTH_VERTICAL_PX : RANGE_BAR_WIDTH_PX,
              flexShrink: 0,
              height: '100%',
              backgroundColor: accentColor,
              borderRadius: '2px',
              boxShadow: `inset 0 2px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(0,0,0,0.15)`,
            }}
          />
        )}

        <Typography
          component="span"
          sx={{
            color: accentColor,
            fontWeight: 700,
            fontSize: `${fontSizePx}px`,
            lineHeight: isCompact ? '1.2' : 1.25,
            letterSpacing: useVertical ? '0.08em' : '0.01em',
            writingMode: useVertical ? 'vertical-rl' : 'horizontal-tb',
            textOrientation: 'mixed',
            whiteSpace: useVertical || isCompact ? 'nowrap' : 'normal',
            overflow: 'hidden',
            textOverflow: useVertical || isCompact ? 'ellipsis' : undefined,
            display: 'block',
            wordBreak: 'break-word',
            // 縦書きをバー直後に密着（flex:1 禁止 = 右端への離れを防ぐ）
            flex: '0 0 auto',
            width: useVertical ? `${fontSizePx + 2}px` : 'auto',
            maxWidth: useVertical ? `${fontSizePx + 2}px` : '100%',
            height: useVertical ? '100%' : 'auto',
            m: 0,
            paddingTop: useVertical ? '2px' : isCompact ? '1px' : 0,
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
