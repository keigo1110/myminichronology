import React, { useCallback, useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Alert } from '@mui/material';
import { CloudUpload, Link } from '@mui/icons-material';

interface ControlsProps {
  onFileDrop: (file: File) => void;
  loading: boolean;
  error: string | null;
}

export function Controls({ onFileDrop, loading, error }: ControlsProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
      setIsDragOver(true);
    } catch (err) {
      console.error('Drag over error:', err);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
      setIsDragOver(false);
    } catch (err) {
      console.error('Drag leave error:', err);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    try {
      e.preventDefault();
      setIsDragOver(false);

      const files = Array.from(e.dataTransfer.files);
      const excelFile = files.find(file => file.name.endsWith('.xlsx'));

      if (excelFile) {
        onFileDrop(excelFile);
      }
    } catch (err) {
      console.error('Drop error:', err);
    }
  }, [onFileDrop]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (file && file.name.endsWith('.xlsx')) {
        onFileDrop(file);
      }
    } catch (err) {
      console.error('File input error:', err);
    }
  }, [onFileDrop]);



  return (
    <Box sx={{ mb: 3 }}>
      {/* ファイルドロップゾーン */}
      <Paper
        sx={{
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



      {/* エラー表示 */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </Box>
  );
}