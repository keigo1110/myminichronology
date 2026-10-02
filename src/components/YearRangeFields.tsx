'use client';

import { useCallback, useState } from 'react';
import { IconButton, TextField, Tooltip, Typography } from '@mui/material';
import { RestartAlt } from '@mui/icons-material';
import { useT } from '../i18n/LocaleProvider';
import { useIsomorphicLayoutEffect } from '../hooks/useIsomorphicLayoutEffect';

interface YearRangeFieldsProps {
  bounds: { min: number; max: number };
  value: [number, number];
  onChange?: (yearRange: [number, number]) => void;
  disabled?: boolean;
}

function clamp(range: [number, number], min: number, max: number): [number, number] {
  const [start, end] = range.map((year) => Math.min(max, Math.max(min, year)));
  return start <= end ? [start, end] : [end, start];
}

export function YearRangeFields({ bounds, value, onChange, disabled }: YearRangeFieldsProps) {
  const t = useT();
  const [start, end] = value;
  const { min, max } = bounds;
  const [draft, setDraft] = useState<[string, string]>(() => [String(start), String(end)]);

  // フィールド自体を作り直さず、ファイル読込・リセットなどの外部変更だけ同期する。
  useIsomorphicLayoutEffect(() => {
    setDraft([String(start), String(end)]);
  }, [start, end, min, max]);

  const commit = useCallback(() => {
    const years = draft.map((text, index) => /^\d{1,5}$/.test(text) ? Number(text) : value[index]) as [number, number];
    const normalized = clamp(years, min, max);
    setDraft([String(normalized[0]), String(normalized[1])]);
    if (normalized[0] !== start || normalized[1] !== end) onChange?.(normalized);
  }, [draft, value, min, max, start, end, onChange]);

  return <>
    {[0, 1].map((index) => <span key={index} style={{ display: 'contents' }}>
      {index === 1 && <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>-</Typography>}
      <TextField
        disabled={disabled}
        size="small"
        type="number"
        label={t(index === 0 ? 'header.startYear' : 'header.endYear')}
        value={draft[index]}
        onChange={(event) => {
          const text = event.target.value;
          setDraft((previous) => index === 0 ? [text, previous[1]] : [previous[0], text]);
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') { event.preventDefault(); commit(); }
          if (event.key === 'Escape') { event.preventDefault(); setDraft([String(start), String(end)]); }
        }}
        sx={{ width: index === 0 ? 75 : 85,
          '& .MuiInputLabel-root': { fontSize: '0.75rem' },
          '& .MuiInputBase-input': { fontSize: '0.75rem', py: 0.5, px: 1, minWidth: 0 } }}
        inputProps={{ min, max, step: 1 }}
      />
    </span>)}
    <Tooltip title={t('header.resetDefault')}>
      <span><IconButton size="small" aria-label={t('header.resetYearRange')}
        disabled={disabled || (start === min && end === max)}
        onClick={() => { setDraft([String(min), String(max)]); onChange?.([min, max]); }}
        sx={{ width: 28, height: 28, '&:disabled': { opacity: 0.3 } }}>
        <RestartAlt sx={{ fontSize: 16 }} />
      </IconButton></span>
    </Tooltip>
  </>;
}
