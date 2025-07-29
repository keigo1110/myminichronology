import { renderHook } from '@testing-library/react';
import { useFilteredEvents } from '../hooks/useFilteredEvents';
import { TimelineData } from '../lib/types';
import { FilterState } from '../hooks/useFilteredEvents';

describe('useFilteredEvents', () => {
  const mockData: TimelineData = [
    {
      name: '政治',
      events: [
        { start: 2020, label: '東京オリンピック延期' },
        { start: 2011, end: 2012, label: '東日本大震災' }
      ]
    },
    {
      name: '経済',
      events: [
        { start: 2021, label: 'コロナ禍の経済影響' },
        { start: 2008, label: 'リーマンショック' }
      ]
    }
  ];

  const mockPositionedEvents = [
    [
      { start: 2020, label: '東京オリンピック延期', x: 0, y: 0, width: 100, height: 30 },
      { start: 2011, end: 2012, label: '東日本大震災', x: 0, y: 0, width: 100, height: 30 }
    ],
    [
      { start: 2021, label: 'コロナ禍の経済影響', x: 0, y: 0, width: 100, height: 30 },
      { start: 2008, label: 'リーマンショック', x: 0, y: 0, width: 100, height: 30 }
    ]
  ];

  it('should return original data when no filters are applied', () => {
    const filters: FilterState = {
      yearRange: [1900, 2100]
    };
    const selectedLanes = ['政治', '経済'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes)
    );
    expect(result.current.filteredData).toEqual(mockData);
    expect(result.current.filteredPositionedEvents).toEqual(mockPositionedEvents);
  });

  it('should filter events by year range', () => {
    const filters: FilterState = {
      yearRange: [2010, 2025]
    };
    const selectedLanes = ['政治', '経済'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes)
    );
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData[0].events).toHaveLength(2);
    expect(result.current.filteredData[1].events).toHaveLength(1);
  });

  it('should filter lanes by selection', () => {
    const filters: FilterState = {
      yearRange: [1900, 2100]
    };
    const selectedLanes = ['政治'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes)
    );
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('政治');
  });

  it('should handle multiple filters simultaneously', () => {
    const filters: FilterState = {
      yearRange: [2010, 2025]
    };
    const selectedLanes = ['政治'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes)
    );
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].name).toBe('政治');
    expect(result.current.filteredData[0].events).toHaveLength(2);
  });

  it('should return empty arrays when no data is provided', () => {
    const filters: FilterState = {
      yearRange: [1900, 2100]
    };
    const selectedLanes = ['政治', '経済'];
    const { result } = renderHook(() =>
      useFilteredEvents(null, [], filters, selectedLanes)
    );
    expect(result.current.filteredData).toBeNull();
    expect(result.current.filteredPositionedEvents).toEqual([]);
  });

  it('should handle events with end dates', () => {
    const filters: FilterState = {
      yearRange: [2011, 2012]
    };
    const selectedLanes = ['政治', '経済'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes)
    );
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData[0].events).toHaveLength(1);
    expect(result.current.filteredData[0].events[0].label).toBe('東日本大震災');
  });
});