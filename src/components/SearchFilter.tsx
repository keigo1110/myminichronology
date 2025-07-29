import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Slider,
  Typography,
  IconButton,
  Collapse
} from '@mui/material';
import { FilterList } from '@mui/icons-material';

interface SearchFilterProps {
  yearRange: { min: number; max: number };
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  yearRange: [number, number];
}

export function SearchFilter({ yearRange, onFilterChange }: SearchFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const [filterYearRange, setFilterYearRange] = useState<[number, number]>([
    yearRange.min,
    yearRange.max
  ]);

  const applyFilters = useCallback(() => {
    onFilterChange({
      yearRange: filterYearRange
    });
  }, [filterYearRange, onFilterChange]);

  const handleYearRangeChange = useCallback((event: Event, newValue: number | number[]) => {
    setFilterYearRange(newValue as [number, number]);
  }, []);

  const activeFilterCount = useMemo(() => {
    if (filterYearRange[0] !== yearRange.min || filterYearRange[1] !== yearRange.max) return 1;
    return 0;
  }, [filterYearRange, yearRange]);

  return (
    <Paper sx={{ p: 2, mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1, mb: expanded ? 2 : 0 }}>
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

      <Collapse in={expanded}>
        <Box sx={{ mt: 2 }}>
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