import React, { useRef } from 'react';
import { Box, Typography } from '@mui/material';
import { TimelineData, PositionedEvent, DynamicLayoutConfig } from '../lib/types';
import { LaneColumn } from './LaneColumn';
import { LaneHeaderRow } from './LaneHeaderRow';

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
  const { yearAxisWidth, totalWidth, laneWidths } = layoutConfig;

  // 年軸のヘッダー高さを考慮した位置計算
  const headerHeight = 60;
  const contentHeight = timelineHeight - headerHeight;

  return (
    <Box
      id="timelineRoot"
      ref={timelineRef}
      sx={{
        width: `${totalWidth}px`,
        minHeight: timelineHeight,
        backgroundColor: '#F7F7F7',
        borderRadius: 1,
        border: '1px solid rgba(0,0,0,0.1)',
        overflow: 'visible', // 内部スクロール削除
        position: 'relative',
        display: 'flex',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        maxWidth: '100%',
        // PDFエクスポート用のスタイル
        '&.pdf-export': {
          overflow: 'visible',
          height: 'auto',
          maxHeight: 'none',
        },
      }}
    >
      {/* 固定年代軸 - ページスクロールでも固定 */}
      <Box
        data-year-axis="true"
        sx={{
          position: 'sticky', // ページスクロールでも固定
          left: 0,
          top: 0,
          width: yearAxisWidth,
          minHeight: timelineHeight,
          backgroundColor: 'rgba(255,255,255,0.95)',
          borderRight: '2px solid rgba(0,0,0,0.2)',
          zIndex: 200,
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
            position: 'sticky',
            top: 0,
            zIndex: 201,
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

        {/* 固定年代ラベル */}
        <Box
          sx={{
            position: 'relative',
            flex: 1,
            minHeight: contentHeight,
          }}
        >
          {Array.from({ length: Math.floor((yearRange.max - yearRange.min) / 10) + 1 }, (_, i) => {
            const year = yearRange.min + i * 10;
            const y = ((year - yearRange.min) / (yearRange.max - yearRange.min)) * contentHeight;

            return (
              <Box
                key={year}
                sx={{
                  position: 'absolute',
                  left: '8px',
                  top: `${y}px`,
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

      {/* メインコンテンツ領域 */}
      <Box
        sx={{
          flex: 1,
          minHeight: timelineHeight,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* 固定レーンヘッダー - ページスクロールでも固定 */}
        <Box
          sx={{
            position: 'sticky',
            top: 0,
            zIndex: 150,
          }}
        >
          <LaneHeaderRow
            data={data}
            laneWidths={laneWidths}
            headerHeight={headerHeight}
          />
        </Box>

        {/* イベント表示領域 - スクロール無し */}
        <Box
          sx={{
            display: 'flex',
            flex: 1,
            minHeight: contentHeight,
          }}
        >
          {data.map((lane, index) => (
            <LaneColumn
              key={lane.name}
              lane={lane}
              events={positionedEvents[index] || []}
              color={laneColors[index]}
              laneWidth={laneWidths[index] || 300}
              onEventClick={onEventClick}
              yearRange={yearRange}
              timelineHeight={contentHeight} // ヘッダーを除いた高さ
              scrollPosition={0} // スクロール位置は使用しない
              showHeader={false} // ヘッダーは表示しない
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
}