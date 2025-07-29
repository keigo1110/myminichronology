import React, { useCallback, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Collapse,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip
} from '@mui/material';
import {
  CloudUpload,
  Link,
  PictureAsPdf,
  ExpandMore,
  ExpandLess,
  Height,
  RestartAlt,
  HelpOutline
} from '@mui/icons-material';
import { DraggableLaneList } from './DraggableLaneList';

interface HeaderProps {
  onFileDrop: (file: File) => void;
  onPdfExport: () => void;
  onYearHeightChange?: (height: number) => void;
  yearHeight?: number;
  loading: boolean;
  error: string | null;
  exporting: boolean;
  exportError: string | null;
  hasData: boolean;
  lanes?: string[];
  selectedLanes?: string[];
  onLaneSelectionChange?: (selectedLanes: string[]) => void;
  onLaneOrderChange?: (orderedLanes: string[]) => void;
  yearRange?: { min: number; max: number };
  onYearRangeChange?: (yearRange: [number, number]) => void;
}

export function Header({
  onFileDrop,
  onPdfExport,
  onYearHeightChange,
  yearHeight = 24,
  loading,
  error,
  exporting,
  exportError,
  hasData,
  lanes = [],
  selectedLanes = [],
  onLaneSelectionChange,
  onLaneOrderChange,
  yearRange = { min: 1900, max: 2100 },
  onYearRangeChange
}: HeaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [dragError, setDragError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(hasData); // データがある場合は自動で展開
  const [filterYearRange, setFilterYearRange] = useState<[number, number]>([
    yearRange.min,
    yearRange.max
  ]);

  // yearRangeが変更されたときにfilterYearRangeを更新
  useEffect(() => {
    setFilterYearRange([yearRange.min, yearRange.max]);
  }, [yearRange.min, yearRange.max]);

  // hasDataが変更されたときにexpandedを更新
  useEffect(() => {
    setExpanded(hasData);
  }, [hasData]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
      setDragError(null);
    } catch (err) {
      console.error('Drag over error:', err);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setDragError(null);
    } catch (err) {
      console.error('Drag leave error:', err);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      setDragError(null);

      const files = Array.from(e.dataTransfer.files);

      if (files.length === 0) {
        setDragError('ファイルが選択されていません');
        return;
      }

      const excelFile = files.find(file => file.name.endsWith('.xlsx'));

      if (!excelFile) {
        setDragError('Excelファイル（.xlsx）を選択してください');
        return;
      }

      // ファイルサイズチェック（10MB制限）
      if (excelFile.size > 10 * 1024 * 1024) {
        setDragError('ファイルサイズが大きすぎます（10MB以下にしてください）');
        return;
      }

      onFileDrop(excelFile);
    } catch (err) {
      console.error('Drop error:', err);
    }
  }, [onFileDrop]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) {
        setDragError('ファイルが選択されていません');
        return;
      }

      if (!file.name.endsWith('.xlsx')) {
        setDragError('Excelファイル（.xlsx）を選択してください');
        return;
      }

      // ファイルサイズチェック（10MB制限）
      if (file.size > 10 * 1024 * 1024) {
        setDragError('ファイルサイズが大きすぎます（10MB以下にしてください）');
        return;
      }

      onFileDrop(file);
      setDragError(null);
    } catch (err) {
      console.error('File input error:', err);
      setDragError('ファイルの処理中にエラーが発生しました');
    }
  }, [onFileDrop]);

  const handleYearHeightChange = useCallback((event: Event, newValue: number | number[]) => {
    try {
      const height = Array.isArray(newValue) ? newValue[0] : newValue;
      onYearHeightChange?.(height);
    } catch (err) {
      console.error('Year height change error:', err);
    }
  }, [onYearHeightChange]);

  const handleResetYearHeight = useCallback(() => {
    try {
      onYearHeightChange?.(24); // デフォルト値にリセット
    } catch (err) {
      console.error('Reset year height error:', err);
    }
  }, [onYearHeightChange]);

  const handleYearRangeChange = useCallback((event: Event, newValue: number | number[]) => {
    const newRange = newValue as [number, number];
    setFilterYearRange(newRange);
  }, []);

  const handleYearRangeCommit = useCallback(() => {
    onYearRangeChange?.(filterYearRange);
  }, [filterYearRange, onYearRangeChange]);

  const handleResetYearRange = useCallback(() => {
    const defaultRange: [number, number] = [yearRange.min, yearRange.max];
    setFilterYearRange(defaultRange);
    onYearRangeChange?.(defaultRange);
  }, [yearRange.min, yearRange.max, onYearRangeChange]);

  const handleResetLaneSelection = useCallback(() => {
    onLaneSelectionChange?.(lanes);
  }, [lanes, onLaneSelectionChange]);

  // 年代範囲フィルターがアクティブかどうか
  const isYearRangeActive = filterYearRange[0] !== yearRange.min || filterYearRange[1] !== yearRange.max;

  // レーン選択がデフォルトかどうか（すべてのレーンが選択されているか）
  const isLaneSelectionDefault = selectedLanes.length === lanes.length;

  return (
    <Box
      sx={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
        py: 1
      }}
    >
      {/* メインヘッダー */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2 }}>
        <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
          ミニクロ
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* 年間高さ調整（データがある場合のみ表示） */}
          {hasData && (
            <Tooltip title="年間高さ調整">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 140 }}>
                <Height sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Slider
                  size="small"
                  value={yearHeight}
                  onChange={handleYearHeightChange}
                  min={8}
                  max={120}
                  step={2}
                  sx={{
                    '& .MuiSlider-thumb': { width: 12, height: 12 },
                    '& .MuiSlider-track': { height: 2 },
                    '& .MuiSlider-rail': { height: 2 }
                  }}
                />
                <Typography variant="caption" sx={{ minWidth: 20, textAlign: 'center' }}>
                  {yearHeight}px
                </Typography>
                <Tooltip title="デフォルト値（24px）にリセット">
                  <IconButton
                    size="small"
                    onClick={handleResetYearHeight}
                    disabled={yearHeight === 24}
                    sx={{
                      width: 20,
                      height: 20,
                      '&:disabled': { opacity: 0.3 }
                    }}
                  >
                    <RestartAlt sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Tooltip>
          )}

          {/* ファイルアップロード */}
          <Tooltip title="Excel ファイルをアップロード">
            <IconButton
              component="label"
              disabled={loading}
              sx={{
                border: '1px dashed',
                borderColor: isDragOver ? 'primary.main' : dragError ? 'error.main' : 'grey.300',
                backgroundColor: isDragOver ? 'primary.50' : dragError ? 'error.50' : 'transparent',
                transition: 'all 0.2s'
              }}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <input
                type="file"
                accept=".xlsx"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
              <CloudUpload sx={{
                color: isDragOver ? 'primary.main' : dragError ? 'error.main' : 'inherit',
                transition: 'color 0.2s'
              }} />
            </IconButton>
          </Tooltip>

          {/* PDF エクスポート */}
          {hasData && (
            <Tooltip title="PDF エクスポート">
              <IconButton onClick={onPdfExport} disabled={exporting}>
                <PictureAsPdf />
              </IconButton>
            </Tooltip>
          )}

          {/* 使い方ガイド */}
          <Tooltip title="使い方ガイド">
            <IconButton
              onClick={() => window.open('https://note.com/namida1110/n/nfd97132121ef', '_blank')}
              size="small"
            >
              <HelpOutline />
            </IconButton>
          </Tooltip>

          {/* 展開/折りたたみボタン */}
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* 展開可能な詳細コントロール */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 1 }}>
          <Paper sx={{ p: 1.5, backgroundColor: 'grey.50' }}>
            {hasData && lanes.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 1.5 }}>
                {/* 年代範囲（左側） */}
                <Box sx={{ flex: { xs: '1', md: '0 0 50%' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 'fit-content', fontSize: '0.875rem' }}>
                      年代範囲:
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', flex: 1 }}>
                      <TextField
                        size="small"
                        type="number"
                        label="開始年"
                        value={filterYearRange[0]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
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
                            minWidth: 0
                          }
                        }}
                        inputProps={{ min: yearRange.min, max: yearRange.max }}
                      />
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>-</Typography>
                      <TextField
                        size="small"
                        type="number"
                        label="終了年"
                        value={filterYearRange[1]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
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
                            minWidth: 0
                          }
                        }}
                        inputProps={{ min: yearRange.min, max: yearRange.max }}
                      />
                      <Tooltip title="デフォルト値にリセット">
                        <IconButton
                          size="small"
                          onClick={handleResetYearRange}
                          disabled={!isYearRangeActive}
                          sx={{
                            width: 14,
                            height: 14,
                            '&:disabled': { opacity: 0.3 }
                          }}
                        >
                          <RestartAlt sx={{ fontSize: 10 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>

                {/* レーン選択（右側） */}
                <Box sx={{ flex: { xs: '1', md: '0 0 50%' } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ minWidth: 'fit-content', fontSize: '0.875rem' }}>
                      表示するレーン:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flex: 1 }}>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.25, flex: 1 }}>
                        <DraggableLaneList
                          lanes={lanes}
                          selectedLanes={selectedLanes}
                          onLaneSelectionChange={onLaneSelectionChange || (() => {})}
                          onLaneOrderChange={onLaneOrderChange || (() => {})}
                        />
                      </Box>
                      <Tooltip title="すべてのレーンを表示">
                        <IconButton
                          size="small"
                          onClick={handleResetLaneSelection}
                          disabled={isLaneSelectionDefault}
                          sx={{
                            width: 14,
                            height: 14,
                            '&:disabled': { opacity: 0.3 }
                          }}
                        >
                          <RestartAlt sx={{ fontSize: 10 }} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                詳細設定は現在開発中です。
              </Typography>
            )}
          </Paper>
        </Box>
      </Collapse>

      {/* エラー表示 */}
      {(error || exportError || dragError) && (
        <Box sx={{ px: 2, pb: 1 }}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}
          {exportError && (
            <Alert severity="error">
              {exportError}
            </Alert>
          )}
          {dragError && (
            <Alert severity="error">
              {dragError}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}