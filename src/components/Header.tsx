import React, { useCallback, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  Tooltip,
  Paper,
  Collapse,
  Slider,
  FormControl,
  Select,
  MenuItem,
} from '@mui/material';
import {
  CloudUpload,
  PictureAsPdf,
  ExpandMore,
  ExpandLess,
  Height,
  RestartAlt,
  HelpOutline,
  Search,
  KeyboardArrowUp,
  KeyboardArrowDown,
  DarkMode,
  LightMode,
  SwapVert,
  Translate,
} from '@mui/icons-material';
import { DraggableLaneList } from './DraggableLaneList';
import { CopyableAlert } from './CopyableAlert';
import { LayoutMode, TimelineOrientation } from '../lib/types';
import { isXlsxFileName } from '../lib/fileValidation';
import { useColorMode } from '../app/providers';
import { useT, useLocale } from '../i18n/LocaleProvider';

const HELP_URL = 'https://note.com/namida1110/n/nfd97132121ef';

interface HeaderProps {
  onFileDrop: (file: File) => string | null;
  onPdfExport: () => void;
  onYearHeightChange?: (height: number) => void;
  yearHeight?: number;
  loading: boolean;
  error: string | null;
  fileError?: string | null;
  onFileError?: (error: string | null) => void;
  exporting: boolean;
  exportError: string | null;
  hasData: boolean;
  lanes?: string[];
  selectedLanes?: string[];
  onLaneSelectionChange?: (selectedLanes: string[]) => void;
  onLaneOrderChange?: (orderedLanes: string[]) => void;
  yearRange?: { min: number; max: number };
  onYearRangeChange?: (yearRange: [number, number]) => void;
  layoutMode?: LayoutMode;
  onLayoutModeChange?: (mode: LayoutMode) => void;
  orientation?: TimelineOrientation;
  onOrientationChange?: (orientation: TimelineOrientation) => void;
  searchQuery?: string;
  onSearchQueryChange?: (query: string) => void;
  searchMatchCount?: number;
  searchMatchIndex?: number;
  onSearchNext?: () => void;
  onSearchPrev?: () => void;
}

export function Header({
  onFileDrop,
  onPdfExport,
  onYearHeightChange,
  yearHeight = 24,
  loading,
  error,
  fileError = null,
  onFileError,
  exporting,
  exportError,
  hasData,
  lanes = [],
  selectedLanes = [],
  onLaneSelectionChange,
  onLaneOrderChange,
  yearRange = { min: 1900, max: 2100 },
  onYearRangeChange,
  layoutMode = 'zoom',
  onLayoutModeChange,
  orientation = 'vertical',
  onOrientationChange,
  searchQuery = '',
  onSearchQueryChange,
  searchMatchCount = 0,
  searchMatchIndex = 0,
  onSearchNext,
  onSearchPrev,
}: HeaderProps) {
  const { mode, toggleColorMode } = useColorMode();
  const t = useT();
  const { locale, toggleLocale } = useLocale();
  const [isDragOver, setIsDragOver] = useState(false);
  const [expanded, setExpanded] = useState(hasData);
  const [filterYearRange, setFilterYearRange] = useState<[number, number]>([
    yearRange.min,
    yearRange.max,
  ]);

  useEffect(() => {
    setFilterYearRange([yearRange.min, yearRange.max]);
  }, [yearRange.min, yearRange.max]);

  useEffect(() => {
    setExpanded(hasData);
  }, [hasData]);

  const reportError = useCallback(
    (message: string | null) => {
      onFileError?.(message);
    },
    [onFileError]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) {
        reportError(t('error.noFile'));
        return;
      }

      const excelFile = files.find((file) => isXlsxFileName(file.name));
      if (!excelFile) {
        reportError(t('file.notXlsx'));
        return;
      }

      const dropError = onFileDrop(excelFile);
      if (dropError) {
        reportError(dropError);
        return;
      }
      reportError(null);
    },
    [onFileDrop, reportError, t]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        reportError(t('error.noFile'));
        return;
      }

      if (!isXlsxFileName(file.name)) {
        reportError(t('file.notXlsx'));
        return;
      }

      const inputError = onFileDrop(file);
      if (inputError) {
        reportError(inputError);
        return;
      }
      reportError(null);
      e.target.value = '';
    },
    [onFileDrop, reportError, t]
  );

  const handleYearHeightChange = useCallback(
    (_event: Event, newValue: number | number[]) => {
      const height = Array.isArray(newValue) ? newValue[0] : newValue;
      onYearHeightChange?.(height);
    },
    [onYearHeightChange]
  );

  const handleResetYearHeight = useCallback(() => {
    onYearHeightChange?.(24);
  }, [onYearHeightChange]);

  const clampYearRange = useCallback(
    (range: [number, number]): [number, number] => {
      let [start, end] = range;
      start = Math.min(Math.max(start, yearRange.min), yearRange.max);
      end = Math.min(Math.max(end, yearRange.min), yearRange.max);
      if (start > end) {
        [start, end] = [end, start];
      }
      return [start, end];
    },
    [yearRange.min, yearRange.max]
  );

  const handleYearRangeCommit = useCallback(() => {
    const normalized = clampYearRange(filterYearRange);
    setFilterYearRange(normalized);
    onYearRangeChange?.(normalized);
  }, [filterYearRange, onYearRangeChange, clampYearRange]);

  const handleResetYearRange = useCallback(() => {
    const defaultRange: [number, number] = [yearRange.min, yearRange.max];
    setFilterYearRange(defaultRange);
    onYearRangeChange?.(defaultRange);
  }, [yearRange.min, yearRange.max, onYearRangeChange]);

  const handleResetLaneSelection = useCallback(() => {
    onLaneSelectionChange?.(lanes);
  }, [lanes, onLaneSelectionChange]);

  const isYearRangeActive =
    filterYearRange[0] !== yearRange.min || filterYearRange[1] !== yearRange.max;
  const isLaneSelectionDefault = selectedLanes.length === lanes.length;
  const langToggleLabel = locale === 'ja' ? t('header.langToEn') : t('header.langToJa');

  return (
    <Box
      component="header"
      sx={{
        position: 'relative',
        zIndex: 100,
        flexShrink: 0,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
        <Box
          component="img"
          src="/minikuro-title.jpg"
          alt={t('brand.name')}
          sx={{
            height: { xs: 32, sm: 36, md: 40 },
            width: 'auto',
            objectFit: 'contain',
          }}
        />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {hasData && (
            <Tooltip
              title={
                orientation === 'horizontal'
                  ? t('header.yearWidth')
                  : t('header.yearHeight')
              }
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
                <Height
                  sx={{
                    fontSize: 16,
                    color: 'text.secondary',
                    transform: orientation === 'horizontal' ? 'rotate(90deg)' : undefined,
                  }}
                />
                <Slider
                  size="small"
                  value={yearHeight}
                  onChange={handleYearHeightChange}
                  min={8}
                  max={120}
                  step={2}
                  aria-label={
                    orientation === 'horizontal'
                      ? t('header.yearWidthAria')
                      : t('header.yearHeightAria')
                  }
                  sx={{
                    '& .MuiSlider-thumb': { width: 12, height: 12 },
                    '& .MuiSlider-track': { height: 2 },
                    '& .MuiSlider-rail': { height: 2 },
                  }}
                />
                <Typography variant="caption" sx={{ minWidth: 20, textAlign: 'center' }}>
                  {yearHeight}px
                </Typography>
                <Tooltip title={t('header.resetDefault24')}>
                  <span>
                    <IconButton
                      size="small"
                      onClick={handleResetYearHeight}
                      disabled={yearHeight === 24}
                      sx={{
                        width: 28,
                        height: 28,
                        '&:disabled': { opacity: 0.3 },
                      }}
                    >
                      <RestartAlt sx={{ fontSize: 16 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            </Tooltip>
          )}

          {hasData && (
            <Tooltip
              title={
                orientation === 'vertical'
                  ? t('header.swapToHorizontal')
                  : t('header.swapToVertical')
              }
            >
              <IconButton
                onClick={() =>
                  onOrientationChange?.(
                    orientation === 'vertical' ? 'horizontal' : 'vertical'
                  )
                }
                size="small"
                aria-label={t('header.swapAria')}
                aria-pressed={orientation === 'horizontal'}
                color={orientation === 'horizontal' ? 'primary' : 'default'}
              >
                <SwapVert
                  sx={{
                    transform: orientation === 'horizontal' ? 'rotate(90deg)' : undefined,
                    transition: 'transform 0.2s',
                  }}
                />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={t('header.upload')}>
            <span>
              <IconButton
                component="label"
                disabled={loading}
                aria-label={t('header.uploadAria')}
                sx={{
                  border: '1px dashed',
                  borderColor: isDragOver ? 'primary.main' : fileError ? 'error.main' : 'grey.300',
                  backgroundColor: isDragOver
                    ? 'primary.50'
                    : fileError
                      ? 'error.50'
                      : 'transparent',
                  transition: 'all 0.2s',
                }}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  type="file"
                  accept=".xlsx,.XLSX"
                  onChange={handleFileInput}
                  style={{ display: 'none' }}
                />
                <CloudUpload
                  sx={{
                    color: isDragOver ? 'primary.main' : fileError ? 'error.main' : 'inherit',
                    transition: 'color 0.2s',
                  }}
                />
              </IconButton>
            </span>
          </Tooltip>

          {hasData && (
            <Tooltip title={exporting ? t('header.pdfBusy') : t('header.pdf')}>
              <span>
                <IconButton
                  onClick={onPdfExport}
                  disabled={exporting}
                  aria-label={t('header.pdfAria')}
                >
                  <PictureAsPdf />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Tooltip title={mode === 'dark' ? t('header.lightMode') : t('header.darkMode')}>
            <IconButton
              onClick={toggleColorMode}
              size="small"
              aria-label={mode === 'dark' ? t('header.lightMode') : t('header.darkMode')}
            >
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title={langToggleLabel}>
            <IconButton
              onClick={toggleLocale}
              size="small"
              aria-label={langToggleLabel}
            >
              <Translate />
            </IconButton>
          </Tooltip>

          <Tooltip title={t('header.help')}>
            <IconButton
              component="a"
              href={HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              aria-label={t('header.help')}
            >
              <HelpOutline />
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            aria-label={expanded ? t('header.expandClose') : t('header.expandOpen')}
          >
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 1 }}>
          <Paper
            sx={{
              p: 1.5,
              backgroundColor: 'background.default',
              border: '1px solid',
              borderColor: 'divider',
              borderRadius: 1,
            }}
          >
            {hasData && lanes.length > 0 ? (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: { xs: 'column', md: 'row' },
                  alignItems: { xs: 'stretch', md: 'center' },
                  gap: 1.5,
                }}
              >
                {/* 1. 検索（表示中の出来事のみ） */}
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    flex: { xs: '1 1 auto', md: '0 0 auto' },
                    minWidth: { md: 220 },
                  }}
                >
                  <TextField
                    size="small"
                    placeholder={t('header.searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => onSearchQueryChange?.(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (e.shiftKey) onSearchPrev?.();
                        else onSearchNext?.();
                      }
                    }}
                    InputProps={{
                      startAdornment: (
                        <Search sx={{ fontSize: 16, color: 'text.secondary', mr: 0.5 }} />
                      ),
                    }}
                    sx={{
                      width: { xs: '100%', md: 160 },
                      '& .MuiInputBase-root': { height: 32, fontSize: '0.75rem' },
                      '& .MuiInputBase-input': { py: 0.5, px: 0.5 },
                    }}
                    inputProps={{ 'aria-label': t('header.searchAria') }}
                  />
                  <Typography
                    variant="caption"
                    component="span"
                    aria-live="polite"
                    sx={{ minWidth: 36, textAlign: 'center', color: 'text.secondary' }}
                  >
                    {searchQuery.trim()
                      ? searchMatchCount === 0
                        ? '0/0'
                        : `${searchMatchIndex + 1}/${searchMatchCount}`
                      : ''}
                  </Typography>
                  <Tooltip title={t('header.searchPrev')}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={onSearchPrev}
                        disabled={!searchQuery.trim() || searchMatchCount === 0}
                        aria-label={t('header.searchPrevAria')}
                      >
                        <KeyboardArrowUp fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={t('header.searchNext')}>
                    <span>
                      <IconButton
                        size="small"
                        onClick={onSearchNext}
                        disabled={!searchQuery.trim() || searchMatchCount === 0}
                        aria-label={t('header.searchNextAria')}
                      >
                        <KeyboardArrowDown fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>

                {/* 2. 年代範囲 + 見せ方 */}
                <Box sx={{ flex: { xs: '1 1 auto', md: '1 1 0' }, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Typography
                      variant="body2"
                      sx={{ minWidth: 'fit-content', fontSize: '0.875rem' }}
                    >
                      {t('header.yearRange')}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        label={t('header.startYear')}
                        value={filterYearRange[0]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value)) {
                            setFilterYearRange([value, filterYearRange[1]]);
                          }
                        }}
                        onBlur={handleYearRangeCommit}
                        sx={{
                          width: 75,
                          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                          '& .MuiInputBase-input': {
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1,
                            minWidth: 0,
                          },
                        }}
                        inputProps={{ min: yearRange.min, max: yearRange.max }}
                      />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        -
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        label={t('header.endYear')}
                        value={filterYearRange[1]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value, 10);
                          if (!isNaN(value)) {
                            setFilterYearRange([filterYearRange[0], value]);
                          }
                        }}
                        onBlur={handleYearRangeCommit}
                        sx={{
                          width: 85,
                          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
                          '& .MuiInputBase-input': {
                            fontSize: '0.75rem',
                            py: 0.5,
                            px: 1,
                            minWidth: 0,
                          },
                        }}
                        inputProps={{ min: yearRange.min, max: yearRange.max }}
                      />
                      <Tooltip title={t('header.resetDefault')}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={handleResetYearRange}
                            disabled={!isYearRangeActive}
                            sx={{
                              width: 28,
                              height: 28,
                              '&:disabled': { opacity: 0.3 },
                            }}
                          >
                            <RestartAlt sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                    <FormControl size="small" sx={{ minWidth: 128 }}>
                      <Select
                        value={layoutMode}
                        onChange={(e) => onLayoutModeChange?.(e.target.value as LayoutMode)}
                        aria-label={t('header.layoutModeAria')}
                        sx={{
                          fontSize: '0.75rem',
                          height: 32,
                          '& .MuiSelect-select': { py: 0.5, px: 1 },
                        }}
                      >
                        <MenuItem value="zoom" sx={{ fontSize: '0.75rem' }}>
                          {t('header.layoutZoom')}
                        </MenuItem>
                        <MenuItem value="filter" sx={{ fontSize: '0.75rem' }}>
                          {t('header.layoutFilter')}
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip
                      title={
                        layoutMode === 'zoom'
                          ? t('header.layoutZoomHelp')
                          : t('header.layoutFilterHelp')
                      }
                    >
                      <IconButton
                        size="small"
                        aria-label={t('header.layoutHelpAria')}
                        sx={{ width: 28, height: 28 }}
                      >
                        <HelpOutline sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </Box>

                {/* 3. レーン */}
                <Box sx={{ flex: { xs: '1 1 auto', md: '1 1 0' }, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="body2"
                      sx={{ minWidth: 'fit-content', fontSize: '0.875rem' }}
                    >
                      {t('header.lanes')}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, flex: 1 }}>
                        <DraggableLaneList
                          lanes={lanes}
                          selectedLanes={selectedLanes}
                          onLaneSelectionChange={onLaneSelectionChange || (() => {})}
                          onLaneOrderChange={onLaneOrderChange || (() => {})}
                        />
                      </Box>
                      <Tooltip title={t('header.resetLanes')}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={handleResetLaneSelection}
                            disabled={isLaneSelectionDefault}
                            sx={{
                              width: 28,
                              height: 28,
                              '&:disabled': { opacity: 0.3 },
                            }}
                          >
                            <RestartAlt sx={{ fontSize: 16 }} />
                          </IconButton>
                        </span>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                {t('header.filterHint')}
              </Typography>
            )}
          </Paper>
        </Box>
      </Collapse>

      {(error || exportError || fileError) && (
        <Box sx={{ px: 2, pb: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
          {error && (
            <CopyableAlert severity="error" kind="error" messages={[error]}>
              {error}
            </CopyableAlert>
          )}
          {exportError && (
            <CopyableAlert severity="error" kind="error" messages={[exportError]}>
              {exportError}
            </CopyableAlert>
          )}
          {fileError && (
            <CopyableAlert
              severity="error"
              kind="error"
              messages={[fileError]}
              onClose={() => onFileError?.(null)}
            >
              {fileError}
            </CopyableAlert>
          )}
        </Box>
      )}
    </Box>
  );
}
