'use client';

import React, { useEffect, useState } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import { PositionedEvent, TimelineOrientation } from '../lib/types';
import { DEFAULT_EVENT_COLOR } from '../lib/parseExcel';
import { pickReadableTextColor } from '../lib/colorPalette';
import {
  RANGE_BAR_WIDTH_PX,
  VERTICAL_RANGE_HEIGHT_THRESHOLD,
  EVENT_IMAGE_MAX_WIDTH,
  EVENT_IMAGE_MAX_HEIGHT,
} from '../lib/computeLayout';
import { useT } from '../i18n/LocaleProvider';

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
  orientation?: TimelineOrientation;
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

function EventImageThumb({
  src,
  alt,
}: {
  src: string;
  alt: string;
}) {
  const theme = useTheme();
  const t = useT();
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <Box
      aria-hidden={failed}
      sx={{
        width: EVENT_IMAGE_MAX_WIDTH,
        height: EVENT_IMAGE_MAX_HEIGHT,
        flexShrink: 0,
        overflow: 'hidden',
        border: `1px solid ${theme.palette.chronology.hairline}`,
        backgroundColor:
          theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '2px',
      }}
    >
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt}
          referrerPolicy="no-referrer"
          loading="lazy"
          onError={() => setFailed(true)}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            display: 'block',
          }}
        />
      ) : (
        <Typography
          component="span"
          sx={{
            fontSize: '0.65rem',
            color: 'text.disabled',
            px: 0.5,
            textAlign: 'center',
            lineHeight: 1.2,
          }}
        >
          {t('event.noImage')}
        </Typography>
      )}
    </Box>
  );
}

export function EventItem({
  event,
  color,
  onClick,
  style,
  eventId,
  highlighted = false,
  orientation = 'vertical',
}: EventItemProps) {
  const theme = useTheme();
  const t = useT();
  const isHorizontal = orientation === 'horizontal';
  const isPointEvent = !event.end;
  const isRangeEvent = !isPointEvent && event.displayStyle !== 'label';
  const isLabelStyle = event.displayStyle === 'label';
  const isInteractive = Boolean(onClick);
  const hasImage = Boolean(event.imageUrl);

  const layoutHeight = Math.max(parseStyleHeight(style), EVENT_ITEM_MIN_HEIGHT);
  const width = Math.max(parseStyleWidth(style), isLabelStyle ? EVENT_ITEM_MIN_HEIGHT : 0);

  const fontSizePx =
    event.fontSize ??
    (isLabelStyle || (!isHorizontal && layoutHeight >= VERTICAL_RANGE_HEIGHT_THRESHOLD)
      ? DEFAULT_VERTICAL_FONT_SIZE_PX
      : DEFAULT_FONT_SIZE_PX);

  const height = Math.max(layoutHeight, Math.ceil(fontSizePx * 1.25) + 6);
  const useVertical =
    isLabelStyle ||
    (!isHorizontal && isRangeEvent && height >= VERTICAL_RANGE_HEIGHT_THRESHOLD);
  const isCompact = !useVertical && height < 40;

  const accentColor = event.color || color || DEFAULT_EVENT_COLOR;
  const fillColor = isLabelStyle ? accentColor : 'transparent';
  const textColor = isLabelStyle ? pickReadableTextColor(accentColor) : accentColor;
  const highlight = theme.palette.chronology.highlight;
  const highlightRing = theme.palette.chronology.highlightRing;

  const eventLabel =
    isPointEvent || isLabelStyle
      ? t('event.pointLabel', { year: event.start, label: event.label })
      : t('event.rangeLabel', {
          start: event.start,
          end: event.end as number,
          label: event.label,
        });
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!onClick) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick(event);
    }
  };

  const labelTextWidth =
    isLabelStyle && useVertical
      ? Math.max(fontSizePx, width > 0 ? width - 8 - (hasImage ? EVENT_IMAGE_MAX_WIDTH + 4 : 0) : fontSizePx + 2)
      : useVertical
        ? `${fontSizePx + 2}px`
        : 'auto';

  const showHorizontalRangeBar = isHorizontal && isRangeEvent;
  const showVerticalRangeBar = !isHorizontal && isRangeEvent;
  /** 横型期間は画像を下に、それ以外はテキスト横 */
  const imageBelow = isHorizontal && isRangeEvent && hasImage;

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
          flexDirection: showHorizontalRangeBar || imageBelow ? 'column' : 'row',
          alignItems: isLabelStyle
            ? 'center'
            : showHorizontalRangeBar || imageBelow
              ? 'stretch'
              : useVertical
                ? 'flex-start'
                : 'center',
          justifyContent: isLabelStyle ? 'center' : 'flex-start',
          gap: !isLabelStyle && isRangeEvent ? (showHorizontalRangeBar ? '2px' : '4px') : hasImage ? '4px' : 0,
          px: isLabelStyle ? 0.4 : 0,
          py: isLabelStyle ? 0.5 : 0,
          overflow: isLabelStyle ? 'hidden' : 'visible',
          cursor: isInteractive ? 'pointer' : 'default',
          outline: 'none',
          zIndex: highlighted ? 20 : undefined,
          scrollMarginTop: 'var(--app-chrome-height, 120px)',
          scrollMarginLeft: isHorizontal ? '120px' : undefined,
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
        {showVerticalRangeBar && (
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

        {showHorizontalRangeBar && (
          <Box
            aria-hidden
            sx={{
              height: RANGE_BAR_WIDTH_PX,
              flexShrink: 0,
              width: '100%',
              backgroundColor: accentColor,
              borderRadius: '1px',
            }}
          />
        )}

        <Box
          sx={{
            display: 'flex',
            flexDirection: imageBelow ? 'column' : 'row',
            alignItems: imageBelow ? 'flex-start' : useVertical || isLabelStyle ? 'center' : 'center',
            gap: hasImage ? '4px' : 0,
            minWidth: 0,
            flex: imageBelow ? '1 1 auto' : undefined,
            height: showVerticalRangeBar ? '100%' : undefined,
          }}
        >
          {hasImage && event.imageUrl && !imageBelow && (
            <EventImageThumb src={event.imageUrl} alt="" />
          )}

          <Typography
            component="span"
            sx={{
              // label 塗り背景の上ではテーマ色継承で淡色文字になると読めない
              color: isLabelStyle ? `${textColor} !important` : textColor,
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
              maxWidth: isLabelStyle
                ? '100%'
                : useVertical
                  ? `${fontSizePx + 2}px`
                  : '100%',
              height: useVertical ? '100%' : 'auto',
              m: 0,
              paddingTop: useVertical ? '2px' : 0,
              paddingLeft: showHorizontalRangeBar ? '2px' : 0,
              pointerEvents: 'none',
            }}
          >
            {event.label}
          </Typography>

          {hasImage && event.imageUrl && imageBelow && (
            <EventImageThumb src={event.imageUrl} alt="" />
          )}
        </Box>
      </Box>
    </Tooltip>
  );
}
