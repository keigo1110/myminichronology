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

  it('should render search input and filter button', () => {
    render(
      <SearchFilter
        yearRange={mockYearRange}
        onFilterChange={mockOnFilterChange}
      />
    );

    expect(screen.getByPlaceholderText('イベントを検索...')).toBeInTheDocument();
    expect(screen.getByTestId('FilterListIcon')).toBeInTheDocument();
  });

  it('should handle search term input', async () => {
    render(
      <SearchFilter
        yearRange={mockYearRange}
        onFilterChange={mockOnFilterChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('イベントを検索...');
    fireEvent.change(searchInput, { target: { value: '東京' } });

    // デバウンスを待つ
    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: '東京',
          yearRange: [1900, 2100]
        })
      );
    }, { timeout: 1000 });
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

  it('should show active filter count', () => {
    render(
      <SearchFilter
        yearRange={mockYearRange}
        onFilterChange={mockOnFilterChange}
      />
    );

    // 検索語句を入力
    const searchInput = screen.getByPlaceholderText('イベントを検索...');
    fireEvent.change(searchInput, { target: { value: '東京' } });

    // フィルターボタンにバッジが表示されることを確認
    const filterButton = screen.getByTestId('FilterListIcon').closest('button');
    expect(filterButton).toBeInTheDocument();
  });

  it('should clear search term when clear button is clicked', async () => {
    render(
      <SearchFilter
        yearRange={mockYearRange}
        onFilterChange={mockOnFilterChange}
      />
    );

    const searchInput = screen.getByPlaceholderText('イベントを検索...');
    fireEvent.change(searchInput, { target: { value: '東京' } });

    // クリアボタンが表示されるまで待つ
    await waitFor(() => {
      expect(screen.getByTestId('ClearIcon')).toBeInTheDocument();
    }, { timeout: 1000 });

    const clearButton = screen.getByTestId('ClearIcon').closest('button');
    fireEvent.click(clearButton!);

    await waitFor(() => {
      expect(mockOnFilterChange).toHaveBeenCalledWith(
        expect.objectContaining({
          searchTerm: ''
        })
      );
    }, { timeout: 1000 });
  });
});