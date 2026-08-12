'use client';

import React from 'react';
import { Box, Typography, useTheme } from '@mui/material';
import { formatYearLabel, getYearTickInterval, getYearTicks } from '../lib/yearTicks';
import { TimelineOrientation } from '../lib/types';
import { useT } from '../i18n/LocaleProvider';

interface YearAxisProps {
  yearRange: { min: number; max: number };
  /** vertical: コンテンツ縦幅 / horizontal: コンテンツ横幅 */
  contentSize: number;
  /** vertical のみ: レーンヘッダー高さ */
  headerHeight?: number;
  /** vertical: 軸の幅 / horizontal: 軸の高さ */
  thickness: number;
  /** 年表全体のもう一方の辺（vertical=総高さ, horizontal=総幅）— sticky 領域用 */
  trackSize: number;
  side: 'left' | 'right' | 'top' | 'bottom';
  orientation?: TimelineOrientation;
  /** horizontal 時: 左レーン名レール分のオフセット */
  labelOffset?: number;
}

export function YearAxis({
  yearRange,
  contentSize,
  headerHeight = 0,
  thickness,
  trackSize,
  side,
  orientation = 'vertical',
  labelOffset = 0,
}: YearAxisProps) {
  const theme = useTheme();
  const t = useT();
  const sheet = theme.palette.chronology.sheet;
  const border = theme.palette.chronology.hairlineStrong;
  const ink = theme.palette.text.primary;
  const muted = theme.palette.chronology.axisMuted;

  const yearSpan = Math.max(1, yearRange.max - yearRange.min);
  const interval = getYearTickInterval(yearRange.min, yearRange.max);
  const ticks = getYearTicks(yearRange.min, yearRange.max);
  const isHorizontal = orientation === 'horizontal';

  if (isHorizontal) {
    const stickyEdge = side === 'top' ? { top: 0 } : { bottom: 0 };

    return (
      <Box
        data-year-axis={side}
        sx={{
          position: 'sticky',
          ...stickyEdge,
          left: 0,
          width: trackSize,
          height: thickness,
          backgroundColor: sheet,
          borderBottom: side === 'top' ? `1px solid ${border}` : undefined,
          borderTop: side === 'bottom' ? `1px solid ${border}` : undefined,
          zIndex: 200,
          display: 'flex',
          flexDirection: 'row',
          flexShrink: 0,
        }}
      >
        <Box
          sx={{
            width: labelOffset,
            flexShrink: 0,
            backgroundColor: sheet,
            borderRight: `1px solid ${border}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'sticky',
            left: 0,
            zIndex: 201,
          }}
        >
          <Typography
            sx={{
              color: ink,
              fontWeight: 700,
              fontSize: '0.75rem',
              letterSpacing: '0.04em',
            }}
          >
            {t('axis.years')}
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minWidth: contentSize,
            height: '100%',
          }}
        >
          {ticks.map((year) => {
            const x = ((year - yearRange.min) / yearSpan) * contentSize;
            const isEmphasized = year % 10 === 0 || interval >= 10;
            const label = formatYearLabel(year, interval);

            return (
              <Box
                key={`${side}-${year}`}
                data-year-label="true"
                sx={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: `${x - 20}px`,
                  width: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: isEmphasized ? '0.72rem' : '0.62rem',
                  fontWeight: isEmphasized ? 700 : 500,
                  color: isEmphasized ? ink : muted,
                  zIndex: 15,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {label}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  }

  const stickySide = side === 'left' ? { left: 0 } : { right: 0 };

  return (
    <Box
      data-year-axis={side}
      sx={{
        position: 'sticky',
        ...stickySide,
        top: 0,
        width: thickness,
        minHeight: trackSize,
        backgroundColor: sheet,
        borderRight: side === 'left' ? `1px solid ${border}` : undefined,
        borderLeft: side === 'right' ? `1px solid ${border}` : undefined,
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
      }}
    >
      <Box
        sx={{
          height: headerHeight,
          backgroundColor: sheet,
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 201,
        }}
      >
        <Typography
          sx={{
            color: ink,
            fontWeight: 700,
            fontSize: '0.8rem',
            letterSpacing: '0.04em',
          }}
        >
          {t('axis.years')}
        </Typography>
      </Box>

      <Box
        sx={{
          position: 'relative',
          flex: 1,
          minHeight: contentSize,
        }}
      >
        {ticks.map((year) => {
          const y = ((year - yearRange.min) / yearSpan) * contentSize;
          const isEmphasized = year % 10 === 0 || interval >= 10;
          const label = formatYearLabel(year, interval);

          return (
            <Box
              key={`${side}-${year}`}
              data-year-label="true"
              sx={{
                position: 'absolute',
                left: 4,
                right: 4,
                top: `${y - 8}px`,
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: side === 'left' ? 'flex-end' : 'flex-start',
                fontSize: isEmphasized ? '0.72rem' : '0.62rem',
                fontWeight: isEmphasized ? 700 : 500,
                color: isEmphasized ? ink : muted,
                zIndex: 15,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {label}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
