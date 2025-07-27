'use client';

import React, { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { Header } from '../components/Header';
import { Timeline } from '../components/Timeline';
import { useSheetLoader } from '../hooks/useSheetLoader';
import { useTimelineData } from '../hooks/useTimelineData';
import { usePdfExport } from '../hooks/usePdfExport';
import { PositionedEvent } from '../lib/types';

export default function Home() {
  const { data, loading, error, loadExcelFile, clearData } = useSheetLoader();
  const { positionedEvents, layoutConfig, yearRange, laneColors, setSelectedEvent, yearHeight, setYearHeight } = useTimelineData(data);
  const { exporting, exportError, exportToPdf, clearExportError } = usePdfExport();
  const [isDragOver, setIsDragOver] = useState(false);

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

  const handleFileDrop = (file: File) => {
    try {
      clearData();
      loadExcelFile(file);
      setIsDragOver(false);
    } catch (err) {
      console.error('File drop error:', err);
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
      const excelFile = files.find(file => file.name.endsWith('.xlsx'));

      if (excelFile) {
        handleFileDrop(excelFile);
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
      />

      {/* メインコンテンツ - フルスクリーン */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {data ? (
          <Box sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            minHeight: 'calc(100vh - 80px)' // ヘッダーの高さを引く
          }}>
            <Timeline
              data={data}
              positionedEvents={positionedEvents}
              layoutConfig={layoutConfig}
              laneColors={laneColors}
              yearRange={yearRange}
              onEventClick={handleEventClick}
            />
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
