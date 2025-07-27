import React, { useRef, useEffect, useState, useCallback } from 'react';
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
  const [scrollPosition, setScrollPosition] = useState(0);
  const timelineRef = useRef<HTMLDivElement>(null);

  // 動的高さを使用（レイアウト設定から取得、フォールバックあり）
  const timelineHeight = layoutConfig.timelineHeight || Math.max(800, (yearRange.max - yearRange.min) * 8);
  const { yearAxisWidth, totalWidth } = layoutConfig;

  // 年軸のヘッダー高さを考慮した位置計算
  const headerHeight = 60;
  const contentHeight = timelineHeight - headerHeight;

  // スクロールハンドラー
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollPosition(scrollTop);
  }, []);

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
        overflow: 'auto',
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
      onScroll={handleScroll}
    >
      {/* 年軸ラベル - 固定位置に変更 */}
              <Box
          data-year-axis="true"
          sx={{
            position: 'sticky',
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
            // NOTE: PDFエクスポート時も`sticky`を維持しておくことで、
            // 年代ヘッダーが左上に固定されるようにする。
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
            zIndex: 25, // レーンラベルより低いが、他の要素より高い
            willChange: 'transform',
            transform: 'translateZ(0)', // ハードウェアアクセラレーション
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
            // PDF エクスポート時に確実に左上へ配置
            '.pdf-export &': {
              position: 'absolute',
              top: 0,
              left: 0,
              transform: 'none'
            }
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

        {/* 年代軸のコンテンツエリア */}
        <Box
          sx={{
            position: 'relative',
            height: `calc(${timelineHeight}px - ${headerHeight}px)`,
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

            // エクスポート時はスクロール位置を無視し、常に見えるようにする
            const adjustedY = isExporting ? y : y - scrollPosition;
            // PDFエクスポート時は常に表示、通常時は可視範囲内のみ表示
            const isVisible = isExporting ? true : (adjustedY >= -50 && adjustedY <= contentHeight + 50);

            console.log('Year label visibility:', {
              year,
              y,
              adjustedY,
              isExporting,
              isVisible,
              scrollPosition,
              contentHeight
            });

            if (!isVisible) {
              return null;
            }

            return (
              <Box
                key={year}
                sx={{
                  position: 'absolute',
                  left: 0,
                  top: adjustedY,
                  width: '100%',
                  height: 2,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  // PDFエクスポート時に確実に表示されるようにする
                  '.pdf-export &': {
                    position: 'absolute',
                    display: 'flex',
                    zIndex: 100
                  }
                }}
              >
                <Typography
                  data-year-label="true"
                  variant="body2"
                  sx={{
                    color: '#212121',
                    fontWeight: 'bold',
                    fontSize: '0.75rem',
                    backgroundColor: 'rgba(255,255,255,0.95)',
                    px: 0.5,
                    borderRadius: 1,
                    minWidth: 'fit-content',
                    textAlign: 'center',
                    // PDFエクスポート時に確実に表示されるようにする
                    '.pdf-export &': {
                      backgroundColor: 'rgba(255,255,255,1)',
                      color: '#000000',
                      fontWeight: 'bold',
                      fontSize: '0.8rem'
                    }
                  }}
                >
                  {year}
                </Typography>
              </Box>
            );
          })}
        </Box>
      </Box>

      {/* レーン */}
      <Box
        sx={{
          display: 'flex',
          flex: 1,
          height: timelineHeight
          // overflow: 'hidden' を削除してsticky要素が正しく動作するようにする
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
            scrollPosition={scrollPosition}
          />
        ))}
      </Box>
    </Box>
  );
}