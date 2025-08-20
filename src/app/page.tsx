'use client';

import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { Header } from '../components/Header';
import { Timeline } from '../components/Timeline';
import { useSheetLoader } from '../hooks/useSheetLoader';
import { useTimelineData } from '../hooks/useTimelineData';
import { useFilteredEvents } from '../hooks/useFilteredEvents';
import { usePdfExport } from '../hooks/usePdfExport';
import { PositionedEvent, LayoutMode } from '../lib/types';

export default function Home() {
  const { data, loading, error, loadExcelFile, clearData } = useSheetLoader();
  const { positionedEvents, layoutConfig, yearRange, laneColors, eventColors, setSelectedEvent, yearHeight, setYearHeight } = useTimelineData(data);
  const { exporting, exportError, exportToPdf, clearExportError } = usePdfExport();
  const [isDragOver, setIsDragOver] = useState(false);

  // レーン選択状態の管理
  const [selectedLanes, setSelectedLanes] = useState<string[]>(data?.map(lane => lane.name) || []);

  // レーン順序状態の管理
  const [laneOrder, setLaneOrder] = useState<string[]>(data?.map(lane => lane.name) || []);

  // 年代範囲フィルター状態の管理（yearRangeが有効な場合のみ初期化）
  const [yearRangeFilter, setYearRangeFilter] = useState<[number, number]>(
    yearRange.min > 0 && yearRange.max > 0 ? [yearRange.min, yearRange.max] : [1900, 2100]
  );

  // レイアウトモードの管理
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('zoom');

  // レーン順序に基づいてデータを並び替え
  const orderedData = React.useMemo(() => {
    if (!data || !laneOrder.length) return data;

    return laneOrder.map(laneName =>
      data.find(lane => lane.name === laneName)
    ).filter(Boolean) as typeof data;
  }, [data, laneOrder]);

  // レーン順序に基づいてpositionedEventsを並び替え
  const orderedPositionedEvents = React.useMemo(() => {
    if (!positionedEvents.length || !laneOrder.length) return positionedEvents;

    return laneOrder.map(laneName => {
      const laneIndex = data?.findIndex(lane => lane.name === laneName);
      return laneIndex !== undefined && laneIndex >= 0 ? positionedEvents[laneIndex] : [];
    }).filter(events => events.length > 0);
  }, [positionedEvents, laneOrder, data]);

  // フィルタリング適用（年代範囲のみ）
  const { filteredData, filteredPositionedEvents, layoutConfig: filteredLayoutConfig } = useFilteredEvents(
    orderedData,
    orderedPositionedEvents,
    { yearRange: yearRangeFilter },
    selectedLanes,
    layoutMode,
    yearHeight / 24
  );

  // データが変更されたときにフィルターをリセット
  React.useEffect(() => {
    if (data) {
      setSelectedLanes(data.map(lane => lane.name));
      setLaneOrder(data.map(lane => lane.name));
      // yearRangeが有効な場合のみ更新
      if (yearRange.min > 0 && yearRange.max > 0) {
        setYearRangeFilter([yearRange.min, yearRange.max]);
      }
    }
  }, [data, yearRange]);

  // グローバルエラーハンドラー
  React.useEffect(() => {
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled promise rejection:', event.reason);
      event.preventDefault();
    };

    const handleError = (event: ErrorEvent) => {
      console.error('Global error:', event.error);
      event.preventDefault();
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  const handleFileDrop = (file: File): string | null => {
    try {
      // ファイル形式チェック（大文字小文字を区別しない）
      if (!file.name.toLowerCase().endsWith('.xlsx')) {
        const errorMsg = 'Excelファイル（.xlsx）を選択してください';
        console.error(errorMsg);
        return errorMsg;
      }

      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        const errorMsg = 'ファイルサイズが大きすぎます（10MB以下にしてください）';
        console.error(errorMsg);
        return errorMsg;
      }

      clearData();
      loadExcelFile(file);
      setIsDragOver(false);
      return null; // 成功
    } catch (err) {
      const errorMsg = 'ファイルの処理中にエラーが発生しました';
      console.error('File drop error:', err);
      return errorMsg;
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    } catch (err) {
      console.error('Drag over error:', err);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    } catch (err) {
      console.error('Drag leave error:', err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);

      if (files.length === 0) {
        console.error('No files found in drop');
        return;
      }

      const excelFile = files.find(file => file.name.toLowerCase().endsWith('.xlsx'));

      if (!excelFile) {
        console.error('No Excel file (.xlsx) found in dropped files');
        return;
      }

      // handleFileDropで統一的なサイズ・形式検証を実行
      const error = handleFileDrop(excelFile);
      if (error) {
        console.error('Drop validation error:', error);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  };

  const handlePdfExport = () => {
    try {
      exportToPdf('timelineRoot');
    } catch (err) {
      console.error('PDF export error:', err);
    }
  };

  const handleEventClick = (event: PositionedEvent) => {
    try {
      setSelectedEvent(event);
    } catch (err) {
      console.error('Event click error:', err);
    }
  };

  const handleYearHeightChange = (height: number) => {
    try {
      setYearHeight(height);
    } catch (err) {
      console.error('Year height change error:', err);
    }
  };

  const handleLaneSelectionChange = (newSelectedLanes: string[]) => {
    setSelectedLanes(newSelectedLanes);
  };

  const handleLaneOrderChange = (newLaneOrder: string[]) => {
    setLaneOrder(newLaneOrder);
  };

  const handleYearRangeChange = (newYearRange: [number, number]) => {
    setYearRangeFilter(newYearRange);
  };

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* ヘッダー */}
      <Header
        onFileDrop={handleFileDrop}
        onPdfExport={handlePdfExport}
        onYearHeightChange={handleYearHeightChange}
        yearHeight={yearHeight}
        loading={loading}
        error={error}
        exporting={exporting}
        exportError={exportError}
        hasData={!!data}
        lanes={laneOrder.length > 0 ? laneOrder : data?.map(lane => lane.name) || []}
        selectedLanes={selectedLanes}
        onLaneSelectionChange={handleLaneSelectionChange}
        onLaneOrderChange={handleLaneOrderChange}
        yearRange={yearRange.min > 0 && yearRange.max > 0 ? yearRange : { min: 1900, max: 2100 }}
        onYearRangeChange={handleYearRangeChange}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
      />

      {/* メインコンテンツ - フルスクリーン */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {data ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            minHeight: 'calc(100vh - 80px)' // ヘッダーの高さを引く
          }}>
            {/* タイムライン */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flex: 1
            }}>
              <Timeline
                data={filteredData || orderedData || data}
                positionedEvents={filteredPositionedEvents.length > 0 ? filteredPositionedEvents : orderedPositionedEvents.length > 0 ? orderedPositionedEvents : positionedEvents}
                layoutConfig={filteredLayoutConfig || layoutConfig}
                laneColors={laneColors}
                eventColors={eventColors}
                yearRange={yearRange}
                onEventClick={handleEventClick}
              />
            </Box>
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              minHeight: 'calc(100vh - 80px)',
              backgroundColor: isDragOver ? 'primary.50' : '#F7F7F7',
              borderRadius: 1,
              border: '2px dashed',
              borderColor: isDragOver ? 'primary.main' : 'rgba(0,0,0,0.1)',
              transition: 'all 0.2s',
              p: 3
            }}
          >
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Typography variant="h5" color="text.secondary" gutterBottom>
                {isDragOver ? 'ここにExcelファイルをドロップ' : 'Excelファイルをドラッグ&ドロップ'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                {isDragOver ? 'ファイルを離して年表を表示' : 'またはヘッダーのアップロードボタンをクリック'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                対応形式: .xlsx（最大10MB）
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<HelpOutline />}
              onClick={() => window.open('https://note.com/namida1110/n/nfd97132121ef', '_blank')}
              sx={{ mt: 2 }}
            >
              使い方ガイドを見る
            </Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
