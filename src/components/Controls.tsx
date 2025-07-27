import React, { useCallback, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { CloudUpload, Link, DataObject } from '@mui/icons-material';

interface ControlsProps {
  onFileDrop: (file: File) => void;
  onUrlSubmit: (url: string) => void;
  onSampleDataLoad: () => void;
  loading: boolean;
  error: string | null;
}

export function Controls({ onFileDrop, onUrlSubmit, onSampleDataLoad, loading, error }: ControlsProps) {
  const [url, setUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

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
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        {/* ファイルドロップゾーン */}
        <Paper
          sx={{
            flex: 1,
            p: 3,
            border: '2px dashed',
            borderColor: isDragOver ? 'primary.main' : 'grey.300',
            backgroundColor: isDragOver ? 'primary.50' : 'background.paper',
            cursor: 'pointer',
            transition: 'all 0.2s',
            '&:hover': {
              borderColor: 'primary.main',
              backgroundColor: 'primary.50'
            }
          }}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept=".xlsx"
            onChange={handleFileInput}
            style={{ display: 'none' }}
          />
          <Box sx={{ textAlign: 'center' }}>
            <CloudUpload sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              Excel ファイルをドラッグ & ドロップ
            </Typography>
            <Typography variant="body2" color="text.secondary">
              またはクリックしてファイルを選択
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              対応形式: .xlsx
            </Typography>
          </Box>
        </Paper>

        {/* URL 入力 */}
        <Paper sx={{ flex: 1, p: 3 }}>
          <Typography variant="h6" gutterBottom>
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
                disabled={!url.trim() || loading}
                sx={{ minWidth: 100 }}
              >
                {loading ? '読み込み中...' : '読み込み'}
              </Button>
            </Box>
          </form>
        </Paper>
      </Box>

      {/* サンプルデータ読み込みボタン */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
        <Button
          variant="outlined"
          startIcon={<DataObject />}
          onClick={onSampleDataLoad}
          disabled={loading}
          sx={{ minWidth: 200 }}
        >
          {loading ? '読み込み中...' : 'サンプルデータを読み込み'}
        </Button>
      </Box>

      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}