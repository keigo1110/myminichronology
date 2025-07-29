import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { TimelineData, PositionedEvent, DynamicLayoutConfig } from '../lib/types';
import { LaneColumn } from './LaneColumn';

interface TimelineProps {
  data: TimelineData;
  positionedEvents: PositionedEvent[][];
  layoutConfig: DynamicLayoutConfig;
  laneColors: string[];
  yearRange: { min: number; max: number };
  onEventClick?: (event: PositionedEvent) => void;
}

export function Timeline({
  data,
  positionedEvents,
  layoutConfig,
  laneColors,
  yearRange,
  onEventClick
}: TimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // 動的高さを使用（レイアウト設定から取得、フォールバックあり）
  const timelineHeight = layoutConfig.timelineHeight || Math.max(800, (yearRange.max - yearRange.min) * 8);
  const { yearAxisWidth, totalWidth } = layoutConfig;

  // 年軸のヘッダー高さを考慮した位置計算
  const headerHeight = 60;
  const contentHeight = timelineHeight - headerHeight;

  return (
    <Box
      id="timelineRoot"
      ref={timelineRef}
      sx={{
        width: `${totalWidth}px`,
        height: timelineHeight,
        backgroundColor: '#F7F7F7',
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.1)',
        overflow: 'hidden', // スクロールバーを削除
        position: 'relative',
        display: 'flex',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '100%',
        maxHeight: '100%',
        // PDFエクスポート用のスタイル
        '&.pdf-export': {
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none',
        },
      }}
    >
      {/* 年軸ラベル - 固定位置に変更 */}
      <Box
        data-year-axis="true"
        sx={{
          position: 'absolute', // stickyから絶対位置に変更
          left: 0,
          top: 0,
          width: yearAxisWidth,
          height: timelineHeight,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRight: '2px solid rgba(0,0,0,0.2)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          minWidth: '60px',
        }}
      >
        {/* 年代軸ヘッダー */}
        <Box
          sx={{
            height: headerHeight,
            backgroundColor: 'rgba(255,255,255,0.95)',
            borderBottom: '2px solid rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'absolute', // stickyから絶対位置に変更
            top: 0,
            left: 0,
            width: '100%',
            zIndex: 25,
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: '#212121',
              fontWeight: 'bold',
              fontSize: '1rem'
            }}
          >
            年代
          </Typography>
        </Box>

        <Box
          sx={{
            position: 'relative',
            height: `calc(${timelineHeight}px - ${headerHeight}px)`,
            marginTop: `${headerHeight}px`, // ヘッダー分のマージンを追加
            overflow: 'hidden',
            // PDFエクスポート時に全ラベルを表示
            '.pdf-export &' : {
              overflow: 'visible',
              height: 'auto',
              maxHeight: 'none'
            }
          }}
        >
          {Array.from({ length: Math.floor((yearRange.max - yearRange.min) / 10) + 1 }, (_, i) => {
            const year = yearRange.min + i * 10;
            const y = ((year - yearRange.min) / (yearRange.max - yearRange.min)) * contentHeight;

            // PDFエクスポート時の判定を改善
            const isExporting = timelineRef.current?.classList.contains('pdf-export');

            // ラベルを固定位置に配置（スクロール位置に影響されない）
            const adjustedY = y;
            const isVisible = isExporting ? true : (adjustedY >= 0 && adjustedY <= contentHeight);

            if (!isVisible) {
              return null;
            }

            return (
              <Box
                key={year}
                sx={{
                  position: 'absolute',
                  left: '8px',
                  top: `${adjustedY}px`,
                  width: 'calc(100% - 16px)',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 'bold',
                  color: '#666',
                  backgroundColor: 'rgba(255,255,255,0.9)',
                  borderRadius: '2px',
                  paddingLeft: '4px',
                  zIndex: 15,
                }}
              >
                {year}
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* レーンコンテンツ */}
      <Box
        sx={{
          position: 'absolute',
          left: yearAxisWidth,
          top: 0,
          width: `calc(100% - ${yearAxisWidth}px)`,
          height: timelineHeight,
          display: 'flex',
          overflow: 'hidden'
        }}
      >
        {data.map((lane, index) => (
          <LaneColumn
            key={lane.name}
            lane={lane}
            events={positionedEvents[index] || []}
            color={laneColors[index]}
            laneWidth={layoutConfig.laneWidths[index] || 300}
            onEventClick={onEventClick}
            yearRange={yearRange}
            timelineHeight={timelineHeight}
            scrollPosition={0} // スクロール位置は固定
          />
        ))}
      </Box>
    </Box>
  );
}