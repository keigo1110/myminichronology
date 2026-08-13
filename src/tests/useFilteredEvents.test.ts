import { renderHook } from '@testing-library/react';
import { useFilteredEvents } from '../hooks/useFilteredEvents';
import type { DynamicLayoutConfig, TimelineData } from '../lib/types';
import type { FilterState } from '../hooks/useFilteredEvents';

describe('useFilteredEvents', () => {
  const mockData: TimelineData = [
    {
      name: '政治',
      events: [
        { start: 2020, label: '東京オリンピック延期' },
        { start: 2011, end: 2012, label: '東日本大震災' },
      ],
    },
    {
      name: '経済',
      events: [
        { start: 2021, label: 'コロナ禍の経済影響' },
        { start: 2008, label: 'リーマンショック' },
      ],
    },
  ];

  const mockPositionedEvents = [
    [
      { start: 2020, label: '東京オリンピック延期', x: 0, y: 0, width: 100, height: 30 },
      { start: 2011, end: 2012, label: '東日本大震災', x: 0, y: 0, width: 100, height: 30 },
    ],
    [
      { start: 2021, label: 'コロナ禍の経済影響', x: 0, y: 0, width: 100, height: 30 },
      { start: 2008, label: 'リーマンショック', x: 0, y: 0, width: 100, height: 30 },
    ],
  ];

  it('should return all lanes when no filters are applied', () => {
    const filters: FilterState = {
      yearRange: [1900, 2100],
    };
    const selectedLanes = ['政治', '経済'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes, 'filter', 1, {
        min: 1900,
        max: 2100,
      })
    );
    expect(result.current.filteredData).toEqual(mockData);
    expect(result.current.filteredPositionedEvents).toHaveLength(2);
    expect(result.current.layoutConfig).toBeDefined();
  });

  it('reuses the base layout when the filters cover all data', () => {
    const baseLayout: DynamicLayoutConfig = {
      laneWidths: [300, 300],
      laneWidthByName: { 政治: 300, 経済: 300 },
      yearAxisWidth: 60,
      totalWidth: 720,
      timelineHeight: 900,
      orientation: 'vertical',
    };
    const { result } = renderHook(() =>
      useFilteredEvents(
        mockData,
        mockPositionedEvents,
        { yearRange: [1900, 2100] },
        ['政治', '経済'],
        'zoom',
        1,
        { min: 1900, max: 2100 },
        'vertical',
        'vertical',
        baseLayout
      )
    );

    expect(result.current.filteredData).toBe(mockData);
    expect(result.current.filteredPositionedEvents).toBe(mockPositionedEvents);
    expect(result.current.layoutConfig).toBe(baseLayout);
  });

  it('should filter events by year range', () => {
    const filters: FilterState = {
      yearRange: [2010, 2025],
    };
    const selectedLanes = ['政治', '経済'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes, 'filter', 1, {
        min: 1900,
        max: 2100,
      })
    );
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredData![0].events).toHaveLength(2);
    expect(result.current.filteredData![1].events).toHaveLength(1);
  });

  it('should filter lanes by selection', () => {
    const filters: FilterState = {
      yearRange: [1900, 2100],
    };
    const selectedLanes = ['政治'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes, 'filter', 1, {
        min: 1900,
        max: 2100,
      })
    );
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData![0].name).toBe('政治');
  });

  it('should handle multiple filters simultaneously', () => {
    const filters: FilterState = {
      yearRange: [2010, 2025],
    };
    const selectedLanes = ['政治'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes, 'filter', 1, {
        min: 1900,
        max: 2100,
      })
    );
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData![0].name).toBe('政治');
    expect(result.current.filteredData![0].events).toHaveLength(2);
  });

  it('should return empty arrays when no data is provided', () => {
    const filters: FilterState = {
      yearRange: [1900, 2100],
    };
    const selectedLanes = ['政治', '経済'];
    const { result } = renderHook(() =>
      useFilteredEvents(null, [], filters, selectedLanes, 'filter')
    );
    expect(result.current.filteredData).toBeNull();
    expect(result.current.filteredPositionedEvents).toEqual([]);
  });

  it('should handle events with end dates', () => {
    const filters: FilterState = {
      yearRange: [2011, 2012],
    };
    const selectedLanes = ['政治', '経済'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes, 'filter', 1, {
        min: 1900,
        max: 2100,
      })
    );
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.filteredData![0].events).toHaveLength(1);
    expect(result.current.filteredData![0].events[0].label).toBe('東日本大震災');
  });

  it('treats label style as a point when filtering even if it has an end year', () => {
    const labelData: TimelineData = [
      {
        name: 'ラベル',
        events: [
          {
            start: 1950,
            end: 2000,
            label: '1950年の縦ラベル',
            displayStyle: 'label',
          },
          { start: 1990, end: 2000, label: '実際の期間' },
        ],
      },
    ];
    const { result } = renderHook(() =>
      useFilteredEvents(
        labelData,
        [],
        { yearRange: [1990, 2000] },
        ['ラベル'],
        'filter',
        1,
        { min: 1950, max: 2000 }
      )
    );

    expect(result.current.filteredData?.[0].events.map((event) => event.label)).toEqual([
      '実際の期間',
    ]);
  });

  it('should recalculate layout in zoom mode', () => {
    const filters: FilterState = {
      yearRange: [1900, 2100],
    };
    const selectedLanes = ['政治'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes, 'zoom')
    );
    expect(result.current.filteredData).toHaveLength(1);
    expect(result.current.layoutConfig).toBeDefined();
    expect(result.current.filteredPositionedEvents).toHaveLength(1);
  });

  it('should repack visible events in filter mode', () => {
    const filters: FilterState = {
      yearRange: [2010, 2025],
    };
    const selectedLanes = ['政治', '経済'];
    const { result } = renderHook(() =>
      useFilteredEvents(mockData, mockPositionedEvents, filters, selectedLanes, 'filter', 1, {
        min: 1900,
        max: 2100,
      })
    );
    expect(result.current.layoutConfig).toBeDefined();
    expect(result.current.yearRange).toEqual({ min: 1900, max: 2100 });
    // 再配置されている（モック座標のままではない）
    const first = result.current.filteredPositionedEvents[0][0];
    expect(first.width).toBeGreaterThan(0);
    expect(first.height).toBeGreaterThan(0);
  });
});
