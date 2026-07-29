'use client';

import React, { useState, useMemo, useRef, useCallback } from 'react';
import { Box, Typography, Button, Alert } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { Header } from '../components/Header';
import { Timeline } from '../components/Timeline';
import { useSheetLoader } from '../hooks/useSheetLoader';
import { useTimelineData } from '../hooks/useTimelineData';
import { useFilteredEvents } from '../hooks/useFilteredEvents';
import { usePdfExport } from '../hooks/usePdfExport';
import { LayoutMode } from '../lib/types';
import { validateExcelFile } from '../lib/fileValidation';

const HELP_URL = 'https://note.com/namida1110/n/nfd97132121ef';

export default function Home() {
  const { data, loading, error, warnings, loadExcelFile, clearData } = useSheetLoader();
  const {
    positionedEvents,
    layoutConfig,
    yearRange,
    laneColorByName,
    eventColorByName,
    yearHeight,
    setYearHeight,
  } = useTimelineData(data);
  const { exporting, exportError, exportToPdf, clearExportError } = usePdfExport();

  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [warningsDismissed, setWarningsDismissed] = useState(false);
  const dragDepthRef = useRef(0);

  const [selectedLanes, setSelectedLanes] = useState<string[]>(data?.map((lane) => lane.name) || []);
  const [laneOrder, setLaneOrder] = useState<string[]>(data?.map((lane) => lane.name) || []);
  const [yearRangeFilter, setYearRangeFilter] = useState<[number, number]>(
    yearRange.min > 0 && yearRange.max > 0 ? [yearRange.min, yearRange.max] : [1900, 2100]
  );
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('zoom');

  const orderedData = useMemo(() => {
    if (!data || !laneOrder.length) return data;
    return laneOrder
      .map((laneName) => data.find((lane) => lane.name === laneName))
      .filter(Boolean) as typeof data;
  }, [data, laneOrder]);

  const orderedPositionedEvents = useMemo(() => {
    if (!positionedEvents.length || !laneOrder.length || !data) return positionedEvents;

    return laneOrder
      .map((laneName) => {
        const laneIndex = data.findIndex((lane) => lane.name === laneName);
        return laneIndex >= 0 ? positionedEvents[laneIndex] : [];
      })
      .filter((events) => events.length > 0);
  }, [positionedEvents, laneOrder, data]);

  const filterState = useMemo(
    () => ({ yearRange: yearRangeFilter }),
    [yearRangeFilter]
  );

  const {
    filteredData,
    filteredPositionedEvents,
    layoutConfig: filteredLayoutConfig,
    yearRange: displayYearRange,
  } = useFilteredEvents(
    orderedData,
    orderedPositionedEvents,
    filterState,
    selectedLanes,
    layoutMode,
    yearHeight / 24,
    yearRange
  );

  React.useEffect(() => {
    if (data) {
      setSelectedLanes(data.map((lane) => lane.name));
      setLaneOrder(data.map((lane) => lane.name));
      if (yearRange.min > 0 && yearRange.max > 0) {
        setYearRangeFilter([yearRange.min, yearRange.max]);
      }
      setFileError(null);
      setWarningsDismissed(false);
      clearExportError();
    }
  }, [data, yearRange, clearExportError]);

  const handleFileDrop = useCallback(
    (file: File): string | null => {
      try {
        const validationError = validateExcelFile(file);
        if (validationError) {
          setFileError(validationError);
          return validationError;
        }

        clearData();
        setFileError(null);
        loadExcelFile(file);
        setIsDragOver(false);
        dragDepthRef.current = 0;
        return null;
      } catch (err) {
        const errorMsg = 'ファイルの処理中にエラーが発生しました';
        console.error('File drop error:', err);
        setFileError(errorMsg);
        return errorMsg;
      }
    },
    [clearData, loadExcelFile]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      setFileError('ファイルが選択されていません');
      return;
    }

    const excelFile = files.find((file) => file.name.toLowerCase().endsWith('.xlsx'));
    if (!excelFile) {
      setFileError('Excelファイル（.xlsx）を選択してください');
      return;
    }

    handleFileDrop(excelFile);
  };

  const handlePdfExport = () => {
    exportToPdf('timelineRoot');
  };

  const displayData = filteredData || orderedData || data;
  const displayEvents =
    filteredPositionedEvents.length > 0
      ? filteredPositionedEvents
      : orderedPositionedEvents.length > 0
        ? orderedPositionedEvents
        : positionedEvents;
  const displayLayout = filteredLayoutConfig || layoutConfig;
  const effectiveYearRange =
    displayYearRange.min > 0 && displayYearRange.max > 0 ? displayYearRange : yearRange;

  const warningSummary =
    warnings.length > 0
      ? warnings.length <= 3
        ? warnings.map((w) => w.message).join(' ')
        : `${warnings
            .slice(0, 2)
            .map((w) => w.message)
            .join(' ')} 他${warnings.length - 2}件の警告があります。`
      : null;

  return (
    <Box
      component="main"
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        ミニクロ - Excelから年表を自動生成
      </h1>

      <Header
        onFileDrop={handleFileDrop}
        onPdfExport={handlePdfExport}
        onYearHeightChange={setYearHeight}
        yearHeight={yearHeight}
        loading={loading}
        error={error}
        fileError={fileError}
        onFileError={setFileError}
        exporting={exporting}
        exportError={exportError}
        hasData={!!data}
        lanes={laneOrder.length > 0 ? laneOrder : data?.map((lane) => lane.name) || []}
        selectedLanes={selectedLanes}
        onLaneSelectionChange={setSelectedLanes}
        onLaneOrderChange={setLaneOrder}
        yearRange={yearRange.min > 0 && yearRange.max > 0 ? yearRange : { min: 1900, max: 2100 }}
        onYearRangeChange={setYearRangeFilter}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
      />

      {warningSummary && data && !warningsDismissed && (
        <Box sx={{ px: 2, pt: 1 }}>
          <Alert severity="warning" onClose={() => setWarningsDismissed(true)}>
            {warningSummary}
          </Alert>
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'auto', p: 1 }}>
        {displayData ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              minHeight: 'calc(100vh - 80px)',
            }}
          >
            <Box sx={{ flex: 1, overflowX: 'auto' }}>
              <Timeline
                data={displayData}
                positionedEvents={displayEvents}
                layoutConfig={displayLayout}
                laneColorByName={laneColorByName}
                eventColorByName={eventColorByName}
                yearRange={effectiveYearRange}
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
              backgroundColor: isDragOver ? 'primary.50' : '#FFFEFA',
              borderRadius: 0,
              border: '2px dashed',
              borderColor: isDragOver ? 'primary.main' : 'rgba(0,0,0,0.18)',
              transition: 'all 0.2s',
              p: 3,
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
                対応形式: .xlsx（最大10MB・最大5シート）／D列フォントサイズ・E列色（任意）
              </Typography>
            </Box>

            <Button
              variant="outlined"
              startIcon={<HelpOutline />}
              component="a"
              href={HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
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
