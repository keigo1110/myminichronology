'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { Header } from '../components/Header';
import { Timeline } from '../components/Timeline';
import { useSheetLoader } from '../hooks/useSheetLoader';
import { useTimelineData } from '../hooks/useTimelineData';
import { usePdfExport } from '../hooks/usePdfExport';
import { PositionedEvent } from '../lib/types';

export default function Home() {
  const { data, loading, error, loadExcelFile, loadGoogleSheet, loadSampleData, clearData } = useSheetLoader();
  const { positionedEvents, layoutConfig, yearRange, laneColors, setSelectedEvent } = useTimelineData(data);
  const { exporting, exportError, exportToPdf, clearExportError } = usePdfExport();

  const handleFileDrop = (file: File) => {
    clearData();
    loadExcelFile(file);
  };

  const handleUrlSubmit = (url: string) => {
    clearData();
    loadGoogleSheet(url);
  };

  const handleSampleDataLoad = () => {
    clearData();
    loadSampleData();
  };

  const handlePdfExport = () => {
    exportToPdf('timelineRoot');
  };

  const handleEventClick = (event: PositionedEvent) => {
    setSelectedEvent(event);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ヘッダー */}
      <Header
        onFileDrop={handleFileDrop}
        onUrlSubmit={handleUrlSubmit}
        onSampleDataLoad={handleSampleDataLoad}
        onPdfExport={handlePdfExport}
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
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              minHeight: 'calc(100vh - 80px)',
              backgroundColor: '#F7F7F7',
              borderRadius: 1,
              border: '2px dashed rgba(0,0,0,0.1)'
            }}
          >
            <Typography variant="h6" color="text.secondary">
              データを読み込んで年表を表示してください
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
