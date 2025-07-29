import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  TextField,
  Paper,
  Slider,
  Typography,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material';
import { Search, Clear, FilterList } from '@mui/icons-material';

interface SearchFilterProps {
  yearRange: { min: number; max: number };
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  searchTerm: string;
  yearRange: [number, number];
}

export function SearchFilter({ yearRange, onFilterChange }: SearchFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYearRange, setFilterYearRange] = useState<[number, number]>([
    yearRange.min,
    yearRange.max
  ]);

  // フィルター変更を親コンポーネントに通知
  const applyFilters = useCallback(() => {
    onFilterChange({
      searchTerm,
      yearRange: filterYearRange
    });
  }, [searchTerm, filterYearRange, onFilterChange]);

  // 検索語句変更（デバウンス付き）
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
  }, []);

  // デバウンス処理
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, applyFilters]);

  // 年代範囲変更
  const handleYearRangeChange = useCallback((event: Event, newValue: number | number[]) => {
    setFilterYearRange(newValue as [number, number]);
  }, []);

  // アクティブなフィルター数
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterYearRange[0] !== yearRange.min || filterYearRange[1] !== yearRange.max) count++;
    return count;
  }, [searchTerm, filterYearRange, yearRange]);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      {/* 検索バー */}
      <Box sx={{ display: 'flex', gap: 1, mb: expanded ? 2 : 0 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="イベントを検索..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search />
              </InputAdornment>
            ),
            endAdornment: searchTerm && (
              <InputAdornment position="end">
                <IconButton
                  size="small"
                  onClick={() => {
                    setSearchTerm('');
                    applyFilters();
                  }}
                >
                  <Clear />
                </IconButton>
              </InputAdornment>
            )
          }}
        />

        <IconButton
          onClick={() => setExpanded(!expanded)}
          color={activeFilterCount > 0 ? 'primary' : 'default'}
        >
          <FilterList />
          {activeFilterCount > 0 && (
            <Box
              sx={{
                position: 'absolute',
                top: -5,
                right: -5,
                height: 20,
                width: 20,
                borderRadius: '50%',
                backgroundColor: 'primary.main',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 'bold'
              }}
            >
              {activeFilterCount}
            </Box>
          )}
        </IconButton>
      </Box>

      {/* 詳細フィルター */}
      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
          {/* 年代範囲スライダー */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="body2" gutterBottom>
              年代範囲: {filterYearRange[0]} - {filterYearRange[1]}
            </Typography>
            <Slider
              value={filterYearRange}
              onChange={handleYearRangeChange}
              onChangeCommitted={applyFilters}
              valueLabelDisplay="auto"
              min={yearRange.min}
              max={yearRange.max}
              marks={[
                { value: yearRange.min, label: yearRange.min },
                { value: yearRange.max, label: yearRange.max }
              ]}
            />
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}