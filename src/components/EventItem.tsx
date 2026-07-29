'use client';

import React from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { PositionedEvent } from '../lib/types';
import { DEFAULT_EVENT_COLOR } from '../lib/parseExcel';
import { pickReadableTextColor } from '../lib/colorPalette';
import {
  RANGE_BAR_WIDTH_PX,
  VERTICAL_RANGE_HEIGHT_THRESHOLD,
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
  eventId?: string;
  highlighted?: boolean;
}

function parseStyleHeight(style?: React.CSSProperties): number {
  if (!style?.height) return 0;
  if (typeof style.height === 'number') return style.height;
  return parseFloat(String(style.height)) || 0;
}

function parseStyleWidth(style?: React.CSSProperties): number {
  if (!style?.width) return 0;
  if (typeof style.width === 'number') return style.width;
  return parseFloat(String(style.width)) || 0;
}

export function EventItem({
  event,
  color,
  onClick,
  style,
  eventId,
  highlighted = false,
}: EventItemProps) {
  const theme = useTheme();
  const isPointEvent = !event.end;
  const isRangeEvent = !isPointEvent && event.displayStyle !== 'label';
  const isLabelStyle = event.displayStyle === 'label';
  const isInteractive = Boolean(onClick);

  const layoutHeight = Math.max(parseStyleHeight(style), EVENT_ITEM_MIN_HEIGHT);
  const width = Math.max(parseStyleWidth(style), isLabelStyle ? EVENT_ITEM_MIN_HEIGHT : 0);

  const fontSizePx =
    event.fontSize ??
    (isLabelStyle || layoutHeight >= VERTICAL_RANGE_HEIGHT_THRESHOLD
      ? DEFAULT_VERTICAL_FONT_SIZE_PX
      : DEFAULT_FONT_SIZE_PX);

  const height = Math.max(layoutHeight, Math.ceil(fontSizePx * 1.25) + 6);
  const useVertical = isLabelStyle || (isRangeEvent && height >= VERTICAL_RANGE_HEIGHT_THRESHOLD);
  const isCompact = !useVertical && height < 40;

  const accentColor = event.color || color || DEFAULT_EVENT_COLOR;
  const fillColor = isLabelStyle ? accentColor : 'transparent';
  const textColor = isLabelStyle ? pickReadableTextColor(accentColor) : accentColor;
  const highlight = theme.palette.chronology.highlight;
  const highlightRing = theme.palette.chronology.highlightRing;

  const eventLabel =
    isPointEvent || isLabelStyle
      ? `${event.start}年：${event.label}`
      : `${event.start}年-${event.end}年：${event.label}`;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(event);
    }
  };

  const labelTextWidth =
    isLabelStyle && useVertical
      ? Math.max(fontSizePx, width > 0 ? width - 8 : fontSizePx + 2)
      : useVertical
        ? `${fontSizePx + 2}px`
        : 'auto';

  return (
    <Tooltip title={eventLabel} placement="top">
      <Box
        id={eventId}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={eventLabel}
        aria-current={highlighted ? 'true' : undefined}
        data-event-label={event.label}
        sx={{
          ...style,
          width: width > 0 ? `${width}px` : style?.width,
          height: `${height}px`,
          boxSizing: 'border-box',
          backgroundColor: fillColor,
          border: highlighted
            ? `2px solid ${highlight}`
            : isLabelStyle
              ? `1px solid ${theme.palette.chronology.hairline}`
              : 'none',
          borderRadius: isLabelStyle || highlighted ? '2px' : 0,
          boxShadow: highlighted ? `0 0 0 3px ${highlightRing}` : 'none',
          display: 'flex',
          flexDirection: 'row',
          alignItems: isLabelStyle ? 'center' : useVertical ? 'flex-start' : 'center',
          justifyContent: isLabelStyle ? 'center' : 'flex-start',
          gap: !isLabelStyle && isRangeEvent ? '4px' : 0,
          px: isLabelStyle ? 0.4 : 0,
          py: isLabelStyle ? 0.5 : 0,
          overflow: isLabelStyle ? 'hidden' : 'visible',
          cursor: isInteractive ? 'pointer' : 'default',
          outline: 'none',
          zIndex: highlighted ? 20 : undefined,
          scrollMarginTop: 'var(--app-chrome-height, 120px)',
          transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
          '&:hover': isInteractive
            ? {
                opacity: 0.85,
                filter: isLabelStyle ? 'brightness(0.97)' : undefined,
              }
            : undefined,
          '&:focus-visible': {
            boxShadow: `0 0 0 2px ${highlight}`,
            borderRadius: '2px',
          },
        }}
        onClick={() => onClick?.(event)}
        onKeyDown={handleKeyDown}
      >
        {!isLabelStyle && isRangeEvent && (
          <Box
            aria-hidden
            sx={{
              width: RANGE_BAR_WIDTH_PX,
              flexShrink: 0,
              alignSelf: 'stretch',
              height: '100%',
              backgroundColor: accentColor,
              borderRadius: '1px',
            }}
          />
        )}

        <Typography
          component="span"
          sx={{
            color: textColor,
            fontWeight: 700,
            fontSize: `${fontSizePx}px`,
            lineHeight: 1.25,
            letterSpacing: useVertical ? '0.1em' : '0.01em',
            writingMode: useVertical ? 'vertical-rl' : 'horizontal-tb',
            textOrientation: 'mixed',
            whiteSpace: useVertical || isCompact ? 'nowrap' : 'normal',
            overflow: 'visible',
            display: 'block',
            wordBreak: 'break-word',
            flex: isLabelStyle && useVertical ? '1 1 auto' : '0 0 auto',
            width: labelTextWidth,
            maxWidth: isLabelStyle ? '100%' : useVertical ? `${fontSizePx + 2}px` : '100%',
            height: useVertical ? '100%' : 'auto',
            m: 0,
            paddingTop: useVertical ? '2px' : 0,
            pointerEvents: 'none',
          }}
        >
          {event.label}
        </Typography>
      </Box>
    </Tooltip>
  );
}
