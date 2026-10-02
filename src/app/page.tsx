'use client';

import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Box, Typography, Button, useTheme } from '@mui/material';
import { HelpOutline } from '@mui/icons-material';
import { Header } from '../components/Header';
import { Timeline } from '../components/Timeline';
import { CopyableAlert } from '../components/CopyableAlert';
import { EventDetails } from '../components/EventDetails';
import {
  TIMELINE_HEADER_HEIGHT,
  YEAR_AXIS_HEIGHT_HORIZONTAL,
  LANE_LABEL_WIDTH_HORIZONTAL,
  MIN_LANE_ROW_HEIGHT,
} from '../lib/computeLayout';
import { useSheetLoader } from '../hooks/useSheetLoader';
import { useTimelineData } from '../hooks/useTimelineData';
import { useFilteredEvents } from '../hooks/useFilteredEvents';
import { usePdfExport } from '../hooks/usePdfExport';
import {
  EventLabelOrientation,
  LayoutMode,
  TimelineOrientation,
  PositionedEvent,
} from '../lib/types';
import { validateExcelFile } from '../lib/fileValidation';
import { hasYearRange } from '../lib/yearRange';
import { getEventDomId } from '../lib/eventDomId';
import { scrollTimelineEventIntoView } from '../lib/timelineScroll';
import { useT } from '../i18n/LocaleProvider';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';
import type { MessageKey } from '../i18n/messages';
import {
  readEventLabelOrientationPreference,
  writeEventLabelOrientationPreference,
} from '../lib/labelOrientationPreference';
import {
  captureTimelineViewportAnchor,
  restoreTimelineViewportAnchor,
  type TimelineViewportAnchor,
} from '../lib/timelineViewportAnchor';

const HELP_URL = 'https://note.com/namida1110/n/nfd97132121ef';

const DEFAULT_YEAR_RANGE: [number, number] = [1900, 2100];

export default function Home() {
  const t = useT();
  const { data, loading, error, warnings, loadExcelFile } = useSheetLoader();
  const [orientation, setOrientation] = useState<TimelineOrientation>('vertical');
  const [labelOrientation, setLabelOrientation] =
    useState<EventLabelOrientation>('vertical');
  const [labelOrientationPreferenceReady, setLabelOrientationPreferenceReady] =
    useState(false);
  const [labelOrientationPending, startLabelOrientationTransition] =
    React.useTransition();
  const {
    positionedEvents,
    layoutConfig,
    yearRange,
    laneColorByName,
    eventColorByName,
    yearHeight,
    setYearHeight,
  } = useTimelineData(data, orientation, labelOrientation);
  const {
    exporting,
    exportProgress,
    exportError,
    exportWarning,
    cancelling,
    cancelExport,
    exportToPdf,
    clearExportError,
  } = usePdfExport();

  const [isDragOver, setIsDragOver] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [warningsDismissed, setWarningsDismissed] = useState(false);
  const dragDepthRef = useRef(0);
  const chromeRef = useRef<HTMLDivElement>(null);
  const timelineViewportRef = useRef<HTMLDivElement>(null);
  const searchScrollFrameRef = useRef<number | null>(null);
  const labelViewportAnchorRef = useRef<TimelineViewportAnchor | null>(null);
  const theme = useTheme();

  const [selectedLanes, setSelectedLanes] = useState<string[]>(data?.map((lane) => lane.name) || []);
  const [laneOrder, setLaneOrder] = useState<string[]>(data?.map((lane) => lane.name) || []);
  const [yearRangeFilter, setYearRangeFilter] = useState<[number, number]>(
    hasYearRange(yearRange) ? [yearRange.min, yearRange.max] : DEFAULT_YEAR_RANGE
  );
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('zoom');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIndex, setSearchMatchIndex] = useState(0);
  const [detailEvent, setDetailEvent] = useState<PositionedEvent | null>(null);
  const handleEventClick = useCallback((event: PositionedEvent) => setDetailEvent(event), []);

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
    orientation,
    labelOrientation,
    layoutConfig
  );

  useIsomorphicLayoutEffect(() => {
    setLabelOrientation(readEventLabelOrientationPreference());
    setLabelOrientationPreferenceReady(true);
  }, []);

  useEffect(() => {
    if (!labelOrientationPreferenceReady) return;
    writeEventLabelOrientationPreference(labelOrientation);
  }, [labelOrientation, labelOrientationPreferenceReady]);

  // 前ファイルのフィルタが残ったまま新データを描画しないよう、同期的に反映する
  useIsomorphicLayoutEffect(() => {
    if (data) {
      setSelectedLanes(data.map((lane) => lane.name));
      setLaneOrder(data.map((lane) => lane.name));
      setYearRangeFilter(
        hasYearRange({ min: yearRange.min, max: yearRange.max })
          ? [yearRange.min, yearRange.max]
          : DEFAULT_YEAR_RANGE
      );
      setFileError(null);
      setWarningsDismissed(false);
      setSearchQuery('');
      setSearchMatchIndex(0);
      setDetailEvent(null);
      clearExportError();
    }
  }, [data, yearRange.min, yearRange.max, clearExportError]);

  const handleFileDrop = useCallback(
    (file: File): string | null => {
      if (exporting) {
        return t('header.pdfBusy');
      }
      if (labelOrientationPending) {
        return t('header.layoutBusy');
      }

      try {
        const validationError = validateExcelFile(file);
        if (validationError) {
          const msg = t(validationError);
          setFileError(msg);
          return msg;
        }

        setFileError(null);
        void loadExcelFile(file);
        setIsDragOver(false);
        dragDepthRef.current = 0;
        return null;
      } catch (err) {
        const errorMsg = t('error.fileProcess');
        console.error('File drop error:', err);
        setFileError(errorMsg);
        return errorMsg;
      }
    },
    [exporting, labelOrientationPending, loadExcelFile, t]
  );

  const handleDragEnter = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current += 1;
    setIsDragOver(true);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragOver(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!Array.from(e.dataTransfer.types).includes('Files')) return;
    e.preventDefault();
    e.stopPropagation();
    dragDepthRef.current = 0;
    setIsDragOver(false);

    if (exporting) {
      setFileError(t('header.pdfBusy'));
      return;
    }
    if (labelOrientationPending) {
      setFileError(t('header.layoutBusy'));
      return;
    }

    const files = Array.from(e.dataTransfer.files);
    if (files.length === 0) {
      setFileError(t('error.noFile'));
      return;
    }

    const excelFile = files.find((file) => file.name.toLowerCase().endsWith('.xlsx'));
    if (!excelFile) {
      setFileError(t('file.notXlsx'));
      return;
    }

    handleFileDrop(excelFile);
  };

  const handlePdfExport = () => {
    if (labelOrientationPending || loading || !hasVisibleEvents) return;
    void exportToPdf('timelineRoot', t('event.noImage'));
  };

  const displayData = filteredData ?? orderedData ?? data;
  const hasLoadedData = Boolean(data && data.length > 0);
  const hasVisibleEvents = Boolean(
    displayData &&
      displayData.length > 0 &&
      displayData.some((lane) => lane.events.length > 0)
  );
  const displayEvents =
    filteredPositionedEvents.length > 0
      ? filteredPositionedEvents
      : orderedPositionedEvents.length > 0
        ? orderedPositionedEvents
        : positionedEvents;
  const displayLayout = filteredLayoutConfig || layoutConfig;
  const effectiveYearRange =
    hasYearRange(displayYearRange) ? displayYearRange : yearRange;

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || !displayData) return [];

    const matches: { id: string; x: number; y: number; width: number; height: number }[] = [];
    let laneOffset = 0;
    displayData.forEach((lane, laneIndex) => {
      (displayEvents[laneIndex] || []).forEach((event, eventIndex) => {
        if (event.label.toLowerCase().includes(q)) {
          const horizontal = orientation === 'horizontal';
          matches.push({
            id: getEventDomId(lane.name, event, eventIndex),
            x: event.x + (horizontal ? displayLayout.laneLabelWidth ?? LANE_LABEL_WIDTH_HORIZONTAL : displayLayout.yearAxisWidth + laneOffset),
            y: event.y + (horizontal ? (displayLayout.yearAxisHeight ?? YEAR_AXIS_HEIGHT_HORIZONTAL) + laneOffset : TIMELINE_HEADER_HEIGHT),
            width: event.width,
            height: event.height,
          });
        }
      });
      laneOffset += orientation === 'horizontal'
        ? displayLayout.laneHeightByName?.[lane.name] ?? displayLayout.laneHeights?.[laneIndex] ?? MIN_LANE_ROW_HEIGHT
        : displayLayout.laneWidthByName[lane.name] ?? displayLayout.laneWidths[laneIndex] ?? 300;
    });
    return matches;
  }, [searchQuery, displayData, displayEvents, displayLayout, orientation]);

  const effectiveSearchMatchIndex =
    searchMatches.length > 0
      ? Math.min(searchMatchIndex, searchMatches.length - 1)
      : 0;
  const highlightedEventId = searchMatches[effectiveSearchMatchIndex]?.id ?? null;

  const scheduleScrollToEvent = useCallback((eventId: string) => {
    if (searchScrollFrameRef.current != null) {
      cancelAnimationFrame(searchScrollFrameRef.current);
    }
    searchScrollFrameRef.current = requestAnimationFrame(() => {
      searchScrollFrameRef.current = null;
      const match = searchMatches.find((candidate) => candidate.id === eventId);
      const root = document.getElementById('timelineRoot');
      scrollTimelineEventIntoView(eventId, 'auto', match && root ? { root, ...match } : undefined);
    });
  }, [searchMatches]);

  React.useEffect(() => {
    if (highlightedEventId) {
      scheduleScrollToEvent(highlightedEventId);
    } else if (searchScrollFrameRef.current != null) {
      cancelAnimationFrame(searchScrollFrameRef.current);
      searchScrollFrameRef.current = null;
    }
  }, [highlightedEventId, scheduleScrollToEvent, searchQuery]);

  React.useEffect(
    () => () => {
      if (searchScrollFrameRef.current != null) {
        cancelAnimationFrame(searchScrollFrameRef.current);
      }
    },
    []
  );

  const jumpToMatch = useCallback(
    (index: number) => {
      if (searchMatches.length === 0) return;
      const normalized = ((index % searchMatches.length) + searchMatches.length) % searchMatches.length;
      const id = searchMatches[normalized].id;
      setSearchMatchIndex(normalized);
      scheduleScrollToEvent(id);
    },
    [scheduleScrollToEvent, searchMatches]
  );

  const handleSearchNext = useCallback(() => {
    jumpToMatch(effectiveSearchMatchIndex + 1);
  }, [effectiveSearchMatchIndex, jumpToMatch]);

  const handleSearchPrev = useCallback(() => {
    jumpToMatch(effectiveSearchMatchIndex - 1);
  }, [effectiveSearchMatchIndex, jumpToMatch]);

  const handleSearchQueryChange = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchMatchIndex(0);
  }, []);

  const handleOrientationChange = useCallback(
    (nextOrientation: TimelineOrientation) => {
      if (labelOrientationPending || exporting) return;

      if (searchScrollFrameRef.current != null) {
        cancelAnimationFrame(searchScrollFrameRef.current);
        searchScrollFrameRef.current = null;
      }

      // 座標系を変える前に旧スクロール位置を破棄する。深い年を表示したまま
      // DOM を組み替えると、ブラウザがその位置を新しい横軸へ引き継ぐため。
      timelineViewportRef.current?.scrollTo({ left: 0, top: 0, behavior: 'auto' });
      setOrientation(nextOrientation);
    },
    [exporting, labelOrientationPending]
  );

  const handleLabelOrientationChange = useCallback(
    (nextOrientation: EventLabelOrientation) => {
      if (
        nextOrientation === labelOrientation ||
        labelOrientationPending ||
        exporting
      ) {
        return;
      }

      const viewport = timelineViewportRef.current;
      const timeline = viewport?.querySelector<HTMLElement>('#timelineRoot');
      if (viewport && timeline) {
        labelViewportAnchorRef.current = captureTimelineViewportAnchor({
          viewport,
          timeline,
          orientation,
          yearRange: effectiveYearRange,
          layoutConfig: displayLayout,
        });
      }

      startLabelOrientationTransition(() => {
        setLabelOrientation(nextOrientation);
      });
    },
    [
      displayLayout,
      effectiveYearRange,
      exporting,
      labelOrientation,
      labelOrientationPending,
      orientation,
      startLabelOrientationTransition,
    ]
  );

  const warningMessages = warnings.map((w) => t(w.code as MessageKey, w.params));
  const warningCount = warnings.reduce((count, warning) => count + (
    warning.type === 'warning-limit' ? Number(warning.params?.count ?? 0) : 1
  ), 0);
  const warningSummary =
    warnings.length > 0
      ? warnings.length <= 3
        ? warningMessages.join(' ')
        : `${warningMessages.slice(0, 2).join(' ')} ${t('warning.moreCount', {
            count: warningCount - 2,
          })}`
      : null;

  const displayError = error ? t(error.code, error.params) : null;
  const displayExportError = exportError ? t(exportError.code, exportError.params) : null;
  const displayExportWarning = exportWarning ? t(exportWarning.code, exportWarning.params) : null;
  const exportProgressPercent =
    exportProgress && exportProgress.total > 0
      ? Math.round((exportProgress.completed / exportProgress.total) * 100)
      : null;
  const exportStatusMessage =
    cancelling ? t('pdf.cancelling') : exportProgressPercent == null
      ? t('header.pdfBusy')
      : t('header.pdfBusyProgress', { percent: exportProgressPercent });

  // 縦横で座標系が変わるため、ブラウザの scroll anchoring に任せず始点へ戻す。
  useIsomorphicLayoutEffect(() => {
    if (!data) return;
    const viewport = timelineViewportRef.current;

    const resetScrollPosition = () => {
      if (viewport) {
        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;
      }
    };

    resetScrollPosition();
    // 大きく寸法が変わる縦横切替では、初回レイアウト後にブラウザが
    // scroll anchoring を再適用することがあるため、次フレームでも確定する。
    const frameId = requestAnimationFrame(resetScrollPosition);
    return () => cancelAnimationFrame(frameId);
  }, [data, orientation]);

  // ラベル方向だけを変えたときは、同じ年代が同じ画面位置に残るよう復元する。
  useIsomorphicLayoutEffect(() => {
    const anchor = labelViewportAnchorRef.current;
    if (!anchor) return;

    const viewport = timelineViewportRef.current;
    const timeline = viewport?.querySelector<HTMLElement>('#timelineRoot');
    if (!viewport || !timeline) {
      labelViewportAnchorRef.current = null;
      return;
    }

    const restore = () =>
      restoreTimelineViewportAnchor(
        {
          viewport,
          timeline,
          orientation,
          yearRange: effectiveYearRange,
          layoutConfig: displayLayout,
        },
        anchor
      );

    restore();
    labelViewportAnchorRef.current = null;
    const frameId = requestAnimationFrame(restore);
    return () => cancelAnimationFrame(frameId);
  }, [
    displayLayout,
    effectiveYearRange.max,
    effectiveYearRange.min,
    labelOrientation,
    orientation,
  ]);

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
        '@supports (height: 100dvh)': { height: '100dvh' },
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
        {t('brand.h1')}
      </h1>

      <Box ref={chromeRef} sx={{ flexShrink: 0 }}>
        {exporting && (
          <Box
            role="status"
            aria-live="polite"
            sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 1, px: 2, py: 0.5, backgroundColor: 'background.paper',
            }}
          >
            <Typography variant="body2">{exportStatusMessage}</Typography>
            <Button size="small" onClick={cancelExport} disabled={cancelling}>{t('pdf.cancel')}</Button>
          </Box>
        )}
        <Header
          key={hasLoadedData ? 'timeline-loaded' : 'timeline-empty'}
          onFileDrop={handleFileDrop}
          onPdfExport={handlePdfExport}
          onYearHeightChange={setYearHeight}
          yearHeight={yearHeight}
          loading={loading}
          error={displayError}
          fileError={fileError}
          onFileError={setFileError}
          exporting={exporting}
          exportError={displayExportError}
          exportWarning={displayExportWarning}
          hasData={!!data}
          canExport={hasVisibleEvents && !loading}
          lanes={laneOrder.length > 0 ? laneOrder : data?.map((lane) => lane.name) || []}
          selectedLanes={selectedLanes}
          onLaneSelectionChange={setSelectedLanes}
          onLaneOrderChange={setLaneOrder}
          yearRange={hasYearRange(yearRange) ? yearRange : { min: 1900, max: 2100 }}
          activeYearRange={yearRangeFilter}
          onYearRangeChange={setYearRangeFilter}
          layoutMode={layoutMode}
          onLayoutModeChange={setLayoutMode}
          orientation={orientation}
          onOrientationChange={handleOrientationChange}
          labelOrientation={labelOrientation}
          onLabelOrientationChange={handleLabelOrientationChange}
          labelOrientationPending={labelOrientationPending}
          exportProgress={exportProgress}
          searchQuery={searchQuery}
          onSearchQueryChange={handleSearchQueryChange}
          searchMatchCount={searchMatches.length}
          searchMatchIndex={effectiveSearchMatchIndex}
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

      <Box
        data-timeline-scroll=""
        data-timeline-viewport=""
        ref={timelineViewportRef}
        role="region"
        aria-label={t('timeline.region')}
        tabIndex={0}
        sx={{
          flex: 1,
          overflow: 'auto',
          overflowAnchor: 'none',
          p: { xs: 1, md: 1.5 },
          minHeight: 0,
        }}
      >
        {hasLoadedData && hasVisibleEvents && displayData ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100%',
            }}
          >
            <Box
              data-timeline-scroll=""
              sx={{
                flex: 1,
                minWidth: 0,
                overflow: 'visible',
                overflowAnchor: 'none',
              }}
            >
              <Timeline
                data={displayData}
                positionedEvents={displayEvents}
                layoutConfig={displayLayout}
                laneColorByName={laneColorByName}
                eventColorByName={eventColorByName}
                yearRange={effectiveYearRange}
                highlightedEventId={highlightedEventId}
                orientation={orientation}
                labelOrientation={labelOrientation}
                pdfExporting={exporting}
                onEventClick={handleEventClick}
              />
            </Box>
          </Box>
        ) : hasLoadedData ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              minHeight: 360,
              backgroundColor: 'background.paper',
              border: '1px dashed',
              borderColor: 'divider',
              p: 3,
            }}
          >
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ textAlign: 'center', maxWidth: 440 }}
            >
              {t('empty.filterNoResults')}
            </Typography>
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
                {isDragOver ? t('empty.drop') : t('empty.title')}
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1.5 }}>
                {isDragOver ? t('empty.subtitleDrop') : t('empty.subtitle')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {t('empty.limits')}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  component="a"
                  href="/template_sample.xlsx"
                  download
                  size="small"
                >
                  {t('empty.sample')}
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
                  {t('empty.help')}
                </Button>
              </Box>
            </Box>
          </Box>
        )}
      </Box>
      <EventDetails event={detailEvent} onClose={() => setDetailEvent(null)} />
    </Box>
  );
}
