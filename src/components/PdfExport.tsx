import React from 'react';
import { Button, Alert } from '@mui/material';
import { PictureAsPdf } from '@mui/icons-material';

interface PdfExportProps {
  onExport: () => void;
  exporting: boolean;
  error: string | null;
  disabled: boolean;
}

export function PdfExport({ onExport, exporting, error, disabled }: PdfExportProps) {
  return (
    <div>
      <Button
        variant="contained"
        startIcon={<PictureAsPdf />}
        onClick={onExport}
        disabled={disabled || exporting}
        sx={{ mb: 2 }}
      >
        {exporting ? 'PDF 出力中...' : 'PDF エクスポート'}
      </Button>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
    </div>
  );
}