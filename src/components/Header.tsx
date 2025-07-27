import React, { useCallback, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  Collapse
} from '@mui/material';
import {
  CloudUpload,
  Link,
  DataObject,
  PictureAsPdf,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';

interface HeaderProps {
  onFileDrop: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  onSampleDataLoad: () => void;
  onPdfExport: () => void;
  loading: boolean;
  error: string | null;
  exporting: boolean;
  exportError: string | null;
  hasData: boolean;
}

export function Header({
  onFileDrop,
  onUrlSubmit,
  onSampleDataLoad,
  onPdfExport,
  loading,
  error,
  exporting,
  exportError,
  hasData
}: HeaderProps) {
  const [url, setUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const excelFile = files.find(file => file.name.endsWith('.xlsx'));

    if (excelFile) {
      onFileDrop(excelFile);
    }
  }, [onFileDrop]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.name.endsWith('.xlsx')) {
      onFileDrop(file);
    }
  }, [onFileDrop]);

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onUrlSubmit(url.trim());
    }
  }, [url, onUrlSubmit]);

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
          年表可視化ツール
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {/* ファイルアップロード */}
          <Tooltip title="Excel ファイルをアップロード">
            <IconButton
              component="label"
              disabled={loading}
              sx={{
                border: '1px dashed',
                borderColor: isDragOver ? 'primary.main' : 'grey.300',
                backgroundColor: isDragOver ? 'primary.50' : 'transparent'
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
              <CloudUpload />
            </IconButton>
          </Tooltip>

          {/* サンプルデータ */}
          <Tooltip title="サンプルデータを読み込み">
            <IconButton onClick={onSampleDataLoad} disabled={loading}>
              <DataObject />
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

          {/* 展開/折りたたみボタン */}
          <IconButton onClick={() => setExpanded(!expanded)} size="small">
            {expanded ? <ExpandLess /> : <ExpandMore />}
          </IconButton>
        </Box>
      </Box>

      {/* 展開可能な詳細コントロール */}
      <Collapse in={expanded}>
        <Box sx={{ px: 2, pb: 2 }}>
          <Paper sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
              {/* Google Sheets URL 入力 */}
              <Box sx={{ flex: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                  Google Sheets URL
                </Typography>
                <form onSubmit={handleUrlSubmit}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      disabled={loading}
                      InputProps={{
                        startAdornment: <Link sx={{ mr: 1, color: 'text.secondary' }} />
                      }}
                    />
                    <Button
                      type="submit"
                      variant="contained"
                      size="small"
                      disabled={!url.trim() || loading}
                    >
                      {loading ? '読み込み中...' : '読み込み'}
                    </Button>
                  </Box>
                </form>
              </Box>
            </Box>
          </Paper>
        </Box>
      </Collapse>

      {/* エラー表示 */}
      {(error || exportError) && (
        <Box sx={{ px: 2, pb: 1 }}>
          {error && (
            <Alert severity="error" size="small">
              {error}
            </Alert>
          )}
          {exportError && (
            <Alert severity="error" size="small">
              {exportError}
            </Alert>
          )}
        </Box>
      )}
    </Box>
  );
}