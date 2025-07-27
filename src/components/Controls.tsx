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
  const [dragError, setDragError] = useState<string | null>(null);

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
      setDragError('ファイルの処理中にエラーが発生しました');
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



  return (
    <Box sx={{ mb: 3 }}>
      {/* ファイルドロップゾーン */}
      <Paper
        sx={{
          p: 3,
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : dragError ? 'error.main' : 'grey.300',
          backgroundColor: isDragOver ? 'primary.50' : dragError ? 'error.50' : 'background.paper',
          cursor: 'pointer',
          transition: 'all 0.2s',
          position: 'relative',
          '&:hover': {
            borderColor: isDragOver ? 'primary.main' : 'primary.main',
            backgroundColor: isDragOver ? 'primary.50' : 'primary.50'
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
          <CloudUpload
            sx={{
              fontSize: 48,
              color: isDragOver ? 'primary.main' : dragError ? 'error.main' : 'primary.main',
              mb: 1,
              transition: 'color 0.2s'
            }}
          />
          <Typography variant="h6" gutterBottom>
            {isDragOver ? 'ここにファイルをドロップ' : 'Excel ファイルをドラッグ & ドロップ'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            またはクリックしてファイルを選択
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
            対応形式: .xlsx（最大10MB）
          </Typography>
        </Box>
      </Paper>



      {/* エラー表示 */}
      {(error || dragError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error || dragError}
        </Alert>
      )}
    </Box>
  );
}