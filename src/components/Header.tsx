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
} from '@mui/icons-material';
import { DraggableLaneList } from './DraggableLaneList';
import { CopyableAlert } from './CopyableAlert';
import { LayoutMode, TimelineOrientation } from '../lib/types';
import { isXlsxFileName } from '../lib/fileValidation';
import { useColorMode } from '../app/providers';

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
        reportError('ファイルが選択されていません');
        return;
      }

      const excelFile = files.find((file) => isXlsxFileName(file.name));
      if (!excelFile) {
        reportError('Excelファイル（.xlsx）を選択してください');
        return;
      }

      const dropError = onFileDrop(excelFile);
      if (dropError) {
        reportError(dropError);
        return;
      }
      reportError(null);
    },
    [onFileDrop, reportError]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        reportError('ファイルが選択されていません');
        return;
      }

      if (!isXlsxFileName(file.name)) {
        reportError('Excelファイル（.xlsx）を選択してください');
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
    [onFileDrop, reportError]
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
          alt="ミニクロ"
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
                  ? '年あたりの幅を調整'
                  : '年間高さ調整'
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
                    orientation === 'horizontal' ? '年あたりの幅' : '年間高さ'
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
                <Tooltip title="デフォルト値（24px）にリセット">
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
                  ? '縦横入れ替え（縦：テーマ・横：年代）'
                  : '縦横入れ替え（縦：年代・横：テーマ）'
              }
            >
              <IconButton
                onClick={() =>
                  onOrientationChange?.(
                    orientation === 'vertical' ? 'horizontal' : 'vertical'
                  )
                }
                size="small"
                aria-label="縦横入れ替え"
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

          <Tooltip title="Excel ファイルをアップロード">
            <span>
              <IconButton
                component="label"
                disabled={loading}
                aria-label="Excelファイルをアップロード"
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
            <Tooltip title={exporting ? 'PDFを生成中…' : 'PDF エクスポート'}>
              <span>
                <IconButton
                  onClick={onPdfExport}
                  disabled={exporting}
                  aria-label="PDFエクスポート"
                >
                  <PictureAsPdf />
                </IconButton>
              </span>
            </Tooltip>
          )}

          <Tooltip title={mode === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'}>
            <IconButton
              onClick={toggleColorMode}
              size="small"
              aria-label={mode === 'dark' ? 'ライトモードに切替' : 'ダークモードに切替'}
            >
              {mode === 'dark' ? <LightMode /> : <DarkMode />}
            </IconButton>
          </Tooltip>

          <Tooltip title="使い方ガイド">
            <IconButton
              component="a"
              href={HELP_URL}
              target="_blank"
              rel="noopener noreferrer"
              size="small"
              aria-label="使い方ガイド"
            >
              <HelpOutline />
            </IconButton>
          </Tooltip>

          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            aria-label={expanded ? '表示範囲の設定を閉じる' : '表示範囲の設定を開く'}
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
                    placeholder="表示中を検索"
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
                    inputProps={{ 'aria-label': '表示中の出来事を検索' }}
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
                  <Tooltip title="前の一致（Shift+Enter）">
                    <span>
                      <IconButton
                        size="small"
                        onClick={onSearchPrev}
                        disabled={!searchQuery.trim() || searchMatchCount === 0}
                        aria-label="前の検索結果へ"
                      >
                        <KeyboardArrowUp fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title="次の一致（Enter）">
                    <span>
                      <IconButton
                        size="small"
                        onClick={onSearchNext}
                        disabled={!searchQuery.trim() || searchMatchCount === 0}
                        aria-label="次の検索結果へ"
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
                      年代範囲:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                      <TextField
                        size="small"
                        type="number"
                        label="開始年"
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
                        label="終了年"
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
                      <Tooltip title="デフォルト値にリセット">
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
                        aria-label="年代範囲の見せ方"
                        sx={{
                          fontSize: '0.75rem',
                          height: 32,
                          '& .MuiSelect-select': { py: 0.5, px: 1 },
                        }}
                      >
                        <MenuItem value="zoom" sx={{ fontSize: '0.75rem' }}>
                          拡大して再配置
                        </MenuItem>
                        <MenuItem value="filter" sx={{ fontSize: '0.75rem' }}>
                          位置はそのまま
                        </MenuItem>
                      </Select>
                    </FormControl>
                    <Tooltip
                      title={
                        layoutMode === 'zoom'
                          ? '選んだ年代を画面いっぱいに広げて再配置します'
                          : '全体の位置関係はそのまま、範囲外の出来事だけ隠します'
                      }
                    >
                      <IconButton
                        size="small"
                        aria-label="年代範囲の見せ方の説明"
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
                      レーン:
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
                      <Tooltip title="すべてのレーンを表示">
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
                Excelファイルを読み込むと、検索・年代範囲・レーンの設定が表示されます。
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
