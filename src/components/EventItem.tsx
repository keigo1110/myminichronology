'use client';

import React, { useState } from 'react';
import { Box, Typography, Tooltip, useTheme } from '@mui/material';
import {
  PositionedEvent,
  TimelineOrientation,
  EventLabelOrientation,
} from '../lib/types';
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
  labelOrientation?: EventLabelOrientation;
  positioned?: boolean;
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

  return (
    <Box
      aria-hidden={failed}
      data-image-status={failed ? 'failed' : 'ready'}
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

export const EventItem = React.memo(function EventItem({
  event,
  color,
  onClick,
  style,
  eventId,
  highlighted = false,
  orientation = 'vertical',
  labelOrientation = 'vertical',
  positioned = false,
}: EventItemProps) {
  const theme = useTheme();
  const t = useT();
  const isHorizontal = orientation === 'horizontal';
  const isPointEvent = event.end == null;
  const isRangeEvent = !isPointEvent && event.displayStyle !== 'label';
  const isLabelStyle = event.displayStyle === 'label';
  const isInteractive = Boolean(onClick);
  const hasImage = Boolean(event.imageUrl);

  const layoutHeight = Math.max(positioned ? event.height : parseStyleHeight(style), EVENT_ITEM_MIN_HEIGHT);
  const width = Math.max(positioned ? event.width : parseStyleWidth(style), isLabelStyle ? EVENT_ITEM_MIN_HEIGHT : 0);
  const allowsVerticalLabels = labelOrientation === 'vertical';
  const usesLargerDefaultFont =
    isLabelStyle ||
    (allowsVerticalLabels &&
      !isHorizontal &&
      layoutHeight >= VERTICAL_RANGE_HEIGHT_THRESHOLD);

  const fontSizePx =
    event.fontSize ??
    (usesLargerDefaultFont
      ? DEFAULT_VERTICAL_FONT_SIZE_PX
      : DEFAULT_FONT_SIZE_PX);

  const height = Math.max(layoutHeight, Math.ceil(fontSizePx * 1.25) + 6);
  const useVertical =
    allowsVerticalLabels &&
    (isLabelStyle ||
      (!isHorizontal && isRangeEvent && height >= VERTICAL_RANGE_HEIGHT_THRESHOLD));
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

  // 縦書きは「1文字分の幅」が必要。ボックス全幅にすると flex/% 連鎖で潰れることがある
  const verticalTextWidthPx = fontSizePx + (isLabelStyle ? 4 : 2);
  const labelTextWidth = useVertical ? `${verticalTextWidthPx}px` : 'auto';

  const showHorizontalRangeBar = isHorizontal && isRangeEvent;
  const showVerticalRangeBar = !isHorizontal && isRangeEvent;
  const rangeLength = event.rangeLength == null ? undefined : Math.max(RANGE_BAR_WIDTH_PX, event.rangeLength);
  /** 横型期間は画像を下に、それ以外はテキスト横 */
  const imageBelow = isHorizontal && isRangeEvent && hasImage;
  /** 画像ありのときだけ内側ラッパーを使う（label 縦書きは外側 flex に直接置く） */
  const wrapWithImageRow = hasImage && !imageBelow && !isLabelStyle;
  const wrapWithImageColumn = imageBelow;

  const labelTypography = (
    <Typography
      component="span"
      sx={{
        // label 塗り背景上ではテーマ色継承で文字が消えることがある
        color: isLabelStyle ? `${textColor} !important` : textColor,
        fontWeight: 700,
        fontSize: `${fontSizePx}px`,
        lineHeight: 1.25,
        letterSpacing: useVertical ? '0.1em' : '0.01em',
        writingMode: useVertical ? 'vertical-rl' : 'horizontal-tb',
        textOrientation: useVertical && isLabelStyle ? 'upright' : 'mixed',
        whiteSpace: useVertical || isCompact ? 'nowrap' : 'normal',
        overflow: 'hidden',
        textOverflow: isCompact ? 'ellipsis' : 'clip',
        display: 'block',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
        flex: useVertical ? '0 0 auto' : '1 1 auto',
        width: labelTextWidth,
        minWidth: useVertical ? `${verticalTextWidthPx}px` : 0,
        maxWidth: useVertical ? `${verticalTextWidthPx}px` : '100%',
        alignSelf: useVertical ? 'stretch' : undefined,
        height: useVertical ? '100%' : 'auto',
        m: 0,
        paddingTop: useVertical ? '2px' : 0,
        paddingLeft: showHorizontalRangeBar ? '2px' : 0,
        pointerEvents: 'none',
      }}
    >
      {event.label}
    </Typography>
  );

  return (
    <Tooltip title={eventLabel} placement="top">
      <Box
        id={eventId}
        role={isInteractive ? 'button' : undefined}
        tabIndex={isInteractive ? 0 : undefined}
        aria-label={eventLabel}
        aria-current={highlighted ? 'true' : undefined}
        data-event-label={event.label}
        data-event-label-orientation={useVertical ? 'vertical' : 'horizontal'}
        sx={{
          ...style,
          ...(positioned ? { position: 'absolute', top: event.y, left: event.x } : {}),
          width: width > 0 ? `${width}px` : style?.width,
          height: `${height}px`,
          boxSizing: 'border-box',
          backgroundColor: fillColor,
          border: isLabelStyle
              ? `1px solid ${theme.palette.chronology.hairline}`
              : 'none',
          borderRadius: isLabelStyle || highlighted ? '2px' : 0,
          boxShadow: highlighted ? `0 0 0 2px ${highlight}, 0 0 0 5px ${highlightRing}` : 'none',
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
          overflow: 'hidden',
          cursor: isInteractive ? 'pointer' : 'default',
          outline: 'none',
          zIndex: highlighted ? 20 : positioned ? event.displayStyle === 'label' ? 7 : event.end ? 4 : 6 : style?.zIndex,
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
            data-range-bar="vertical"
            sx={{
              width: RANGE_BAR_WIDTH_PX,
              flexShrink: 0,
              alignSelf: rangeLength == null ? 'stretch' : 'flex-start',
              height: rangeLength == null ? '100%' : `${rangeLength}px`,
              backgroundColor: accentColor,
              borderRadius: '1px',
            }}
          />
        )}

        {showHorizontalRangeBar && (
          <Box
            aria-hidden
            data-range-bar="horizontal"
            sx={{
              height: RANGE_BAR_WIDTH_PX,
              flexShrink: 0,
              width: rangeLength == null ? '100%' : `${rangeLength}px`,
              backgroundColor: accentColor,
              borderRadius: '1px',
            }}
          />
        )}

        {isLabelStyle && hasImage && event.imageUrl && (
          <EventImageThumb key={event.imageUrl} src={event.imageUrl} alt="" />
        )}

        {wrapWithImageRow || wrapWithImageColumn ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: imageBelow ? 'column' : 'row',
              alignItems: imageBelow ? 'flex-start' : useVertical ? 'flex-start' : 'center',
              gap: hasImage ? '4px' : 0,
              minWidth: useVertical ? 'min-content' : 0,
              flex: imageBelow ? '1 1 auto' : undefined,
              height: showVerticalRangeBar ? '100%' : undefined,
            }}
          >
            {hasImage && event.imageUrl && !imageBelow && (
              <EventImageThumb key={event.imageUrl} src={event.imageUrl} alt="" />
            )}
            {labelTypography}
            {hasImage && event.imageUrl && imageBelow && (
              <EventImageThumb key={event.imageUrl} src={event.imageUrl} alt="" />
            )}
          </Box>
        ) : (
          labelTypography
        )}
      </Box>
    </Tooltip>
  );
});
