'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { Header } from '../components/Header';
import { Timeline } from '../components/Timeline';
import { CopyableAlert } from '../components/CopyableAlert';
import { useSheetLoader } from '../hooks/useSheetLoader';
import { useTimelineData } from '../hooks/useTimelineData';
import { useFilteredEvents } from '../hooks/useFilteredEvents';
import { usePdfExport } from '../hooks/usePdfExport';
import { LayoutMode, TimelineOrientation } from '../lib/types';
import { validateExcelFile } from '../lib/fileValidation';
import { getEventDomId } from '../lib/eventDomId';

const HELP_URL = 'https://note.com/namida1110/n/nfd97132121ef';

export default function Home() {
  const { data, loading, error, warnings, loadExcelFile, clearData } = useSheetLoader();
  const [orientation, setOrientation] = useState<TimelineOrientation>('vertical');
  const {
    positionedEvents,
    layoutConfig,
    yearRange,
    laneColorByName,
    eventColorByName,
    yearHeight,
    setYearHeight,
  } = useTimelineData(data, orientation);
  const { exporting, exportError, exportToPdf, clearExportError } = usePdfExport();

  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [warningsDismissed, setWarningsDismissed] = useState(false);
  const dragDepthRef = useRef(0);
  const chromeRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();

  const [selectedLanes, setSelectedLanes] = useState<string[]>(data?.map((lane) => lane.name) || []);
  const [laneOrder, setLaneOrder] = useState<string[]>(data?.map((lane) => lane.name) || []);
  const [yearRangeFilter, setYearRangeFilter] = useState<[number, number]>(
    yearRange.min > 0 && yearRange.max > 0 ? [yearRange.min, yearRange.max] : [1900, 2100]
  );
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('zoom');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [highlightedEventId, setHighlightedEventId] = useState<string | null>(null);

  const orderedData = useMemo(() => {
    if (!data || !laneOrder.length) return data;
    return laneOrder
      .map((laneName) => data.find((lane) => lane.name === laneName))
      .filter(Boolean) as typeof data;
  }, [data, laneOrder]);

  const orderedPositionedEvents = useMemo(() => {
    if (!positionedEvents.length || !laneOrder.length || !data) return positionedEvents;

    // レーン順に揃え、空レーンもインデックスをずらさない
    return laneOrder.map((laneName) => {
      const laneIndex = data.findIndex((lane) => lane.name === laneName);
      return laneIndex >= 0 ? positionedEvents[laneIndex] || [] : [];
    });
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
    yearRange,
    orientation
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
      setSearchQuery('');
      setSearchMatchIndex(0);
      setHighlightedEventId(null);
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

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !displayData) return [] as string[];

    const ids: string[] = [];
    displayData.forEach((lane, laneIndex) => {
      (displayEvents[laneIndex] || []).forEach((event, eventIndex) => {
        if (event.label.toLowerCase().includes(q)) {
          ids.push(getEventDomId(lane.name, event, eventIndex));
        }
      });
    });
    return ids;
  }, [searchQuery, displayData, displayEvents]);

  React.useEffect(() => {
    setSearchMatchIndex(0);
    if (searchMatches.length > 0) {
      setHighlightedEventId(searchMatches[0]);
    } else {
      setHighlightedEventId(null);
    }
  }, [searchMatches]);

  const jumpToMatch = useCallback(
    (index: number) => {
      if (searchMatches.length === 0) return;
      const normalized = ((index % searchMatches.length) + searchMatches.length) % searchMatches.length;
      const id = searchMatches[normalized];
      setSearchMatchIndex(normalized);
      setHighlightedEventId(id);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: orientation === 'horizontal' ? 'center' : 'nearest',
        });
      });
    },
    [searchMatches, orientation]
  );

  const handleSearchNext = useCallback(() => {
    jumpToMatch(searchMatchIndex + 1);
  }, [jumpToMatch, searchMatchIndex]);

  const handleSearchPrev = useCallback(() => {
    jumpToMatch(searchMatchIndex - 1);
  }, [jumpToMatch, searchMatchIndex]);

  const warningMessages = warnings.map((w) => w.message);
  const warningSummary =
    warnings.length > 0
      ? warnings.length <= 3
        ? warnings.map((w) => w.message).join(' ')
        : `${warnings
            .slice(0, 2)
            .map((w) => w.message)
            .join(' ')} 他${warnings.length - 2}件の警告があります。`
      : null;

  React.useEffect(() => {
    if (highlightedEventId && searchMatches.includes(highlightedEventId)) {
      requestAnimationFrame(() => {
        document.getElementById(highlightedEventId)?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: orientation === 'horizontal' ? 'center' : 'nearest',
        });
      });
    }
  }, [highlightedEventId, searchMatches, orientation]);

  useEffect(() => {
    const el = chromeRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;

    const apply = () => {
      document.documentElement.style.setProperty(
        '--app-chrome-height',
        `${el.offsetHeight + 12}px`
      );
    };
    apply();
    const ro = new ResizeObserver(apply);
    ro.observe(el);
    return () => ro.disconnect();
  }, [warningSummary, warningsDismissed, data]);

  return (
    <Box
      component="main"
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        backgroundColor: 'background.default',
      }}
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <h1 style={{ position: 'absolute', width: 1, height: 1, padding: 0, margin: -1, overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: 0 }}>
        ミニクロ - Excelから年表を自動生成
      </h1>

      <Box ref={chromeRef} sx={{ flexShrink: 0 }}>
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
          orientation={orientation}
          onOrientationChange={setOrientation}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchMatchCount={searchMatches.length}
          searchMatchIndex={searchMatchIndex}
          onSearchNext={handleSearchNext}
          onSearchPrev={handleSearchPrev}
        />

        {warningSummary && data && !warningsDismissed && (
          <Box sx={{ px: 2, pt: 1, pb: 0.5 }}>
            <CopyableAlert
              severity="warning"
              kind="warning"
              messages={warningMessages}
              onClose={() => setWarningsDismissed(true)}
            >
              {warningSummary}
            </CopyableAlert>
          </Box>
        )}
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto', p: { xs: 1, md: 1.5 }, minHeight: 0 }}>
        {displayData ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100%',
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
                highlightedEventId={highlightedEventId}
                orientation={orientation}
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
              minHeight: 360,
              backgroundColor: isDragOver
                ? theme.palette.mode === 'dark'
                  ? 'rgba(224,122,74,0.12)'
                  : 'rgba(196,92,38,0.06)'
                : 'background.paper',
              borderRadius: 0,
              border: '1px dashed',
              borderColor: isDragOver ? 'primary.main' : 'divider',
              backgroundImage: isDragOver
                ? 'none'
                : `linear-gradient(${theme.palette.chronology.grid} 1px, transparent 1px), linear-gradient(90deg, ${theme.palette.chronology.grid} 1px, transparent 1px)`,
              backgroundSize: '48px 48px',
              transition: 'border-color 0.2s, background-color 0.2s',
              p: 3,
            }}
          >
            <Box
              sx={{
                textAlign: 'center',
                maxWidth: 440,
                px: 2,
                py: 3,
                backgroundColor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: 'text.primary', mb: 1, letterSpacing: '0.02em' }}
              >
                {isDragOver ? 'ここにドロップ' : '年表をつくる'}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                {isDragOver
                  ? 'ファイルを離して表示します'
                  : 'Excel（.xlsx）をドロップするか、ヘッダーからアップロード'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                最大10MB・最大5シート／見本ファイルから始められます
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  component="a"
                  href="/template_sample.xlsx"
                  download
                  size="small"
                >
                  見本Excel
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<HelpOutline />}
                  component="a"
                  href={HELP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  size="small"
                >
                  使い方
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
