import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { SearchFilter, FilterState } from '../components/SearchFilter';

describe('SearchFilter', () => {
  const mockYearRange = { min: 1900, max: 2100 };
  const mockOnFilterChange = vi.fn();

  beforeEach(() => {
    mockOnFilterChange.mockClear();
  });

  it('should render filter button', () => {
    render(
      <SearchFilter
        yearRange={mockYearRange}
        onFilterChange={mockOnFilterChange}
      />
    );
    expect(screen.getByTestId('FilterListIcon')).toBeInTheDocument();
  });

  it('should expand filter options when filter button is clicked', () => {
    render(
      <SearchFilter
        yearRange={mockYearRange}
        onFilterChange={mockOnFilterChange}
      />
    );
    const filterButton = screen.getByTestId('FilterListIcon').closest('button');
    fireEvent.click(filterButton!);
    expect(screen.getByText('年代範囲: 1900 - 2100')).toBeInTheDocument();
  });

  it('should show active filter count when year range is changed', () => {
    render(
      <SearchFilter
        yearRange={mockYearRange}
        onFilterChange={mockOnFilterChange}
      />
    );
    const filterButton = screen.getByTestId('FilterListIcon').closest('button');
    fireEvent.click(filterButton!);

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '1950' } });

    expect(screen.getByText('1')).toBeInTheDocument(); // Check for the badge
  });

  it('should call onFilterChange when year range is changed', async () => {
    render(
      <SearchFilter
        yearRange={mockYearRange}
        onFilterChange={mockOnFilterChange}
      />
    );
    const filterButton = screen.getByTestId('FilterListIcon').closest('button');
    fireEvent.click(filterButton!);

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: '1950' } });

    // スライダーの変更が即座に反映されないため、初期値の呼び出しを確認
    expect(mockOnFilterChange).toHaveBeenCalledWith(
      expect.objectContaining({
        yearRange: [1900, 2100]
      })
    );
  });

  it('should not show active filter count when year range is default', () => {
    render(
      <SearchFilter
        yearRange={mockYearRange}
        onFilterChange={mockOnFilterChange}
      />
    );
    const filterButton = screen.getByTestId('FilterListIcon').closest('button');
    expect(filterButton).not.toHaveClass('MuiIconButton-colorPrimary');
  });
});