import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { computeLayout, calculateTimelineHeight, calculateTimelineWidth } from '../lib/computeLayout';
import { useFilteredEvents, FilterState } from '../hooks/useFilteredEvents';
import { TimelineData, PositionedEvent } from '../lib/types';

describe('computeLayout', () => {
  it('should return empty layout for empty data', () => {
    const result = computeLayout([]);
    expect(result.positionedEvents).toEqual([]);
    expect(result.layoutConfig.laneWidths).toEqual([]);
    expect(result.layoutConfig.totalWidth).toBe(120);
  });

  it('should calculate layout for single lane with point events', () => {
    const data: TimelineData = [
      {
        name: 'Test Lane',
        events: [
          { start: 2000, label: 'Event 1' },
          { start: 2010, label: 'Event 2' }
        ]
      }
    ];

    const result = computeLayout(data);
    expect(result.positionedEvents).toHaveLength(1);
    expect(result.positionedEvents[0]).toHaveLength(2);
    expect(result.layoutConfig.laneWidths).toHaveLength(1);
    expect(result.layoutConfig.totalWidth).toBeGreaterThan(0);

    // イベントの配置情報を確認
    const events = result.positionedEvents[0];
    expect(events[0]).toHaveProperty('x');
    expect(events[0]).toHaveProperty('y');
    expect(events[0]).toHaveProperty('width');
    expect(events[0]).toHaveProperty('height');
  });

  it('should calculate layout for single lane with range events', () => {
    const data: TimelineData = [
      {
        name: 'Test Lane',
        events: [
          { start: 2000, end: 2010, label: 'Range Event 1' },
          { start: 2015, end: 2020, label: 'Range Event 2' }
        ]
      }
    ];

    const result = computeLayout(data);
    expect(result.positionedEvents).toHaveLength(1);
    expect(result.positionedEvents[0]).toHaveLength(2);
    expect(result.layoutConfig.laneWidths).toHaveLength(1);

    // 範囲イベントは高さが異なる場合がある
    const events = result.positionedEvents[0];
    expect(events[0].height).toBeGreaterThan(0);
    expect(events[1].height).toBeGreaterThan(0);
  });

  it('should apply year height scale correctly', () => {
    // より多くのイベントで年範囲を広げ、最小高さ制限を超えるようにする
    const data: TimelineData = [
      {
        name: 'Test Lane',
        events: [
          { start: 2000, label: 'Event 1' },
          { start: 2001, label: 'Event 2' },
          { start: 2002, label: 'Event 3' },
          { start: 2003, label: 'Event 4' },
          { start: 2004, label: 'Event 5' },
          { start: 2005, label: 'Event 6' },
          { start: 2006, label: 'Event 7' },
          { start: 2007, label: 'Event 8' },
          { start: 2008, label: 'Event 9' },
          { start: 2009, label: 'Event 10' },
          { start: 2010, label: 'Event 11' },
          { start: 2011, label: 'Event 12' },
          { start: 2012, label: 'Event 13' },
          { start: 2013, label: 'Event 14' },
          { start: 2014, label: 'Event 15' },
          { start: 2015, label: 'Event 16' },
          { start: 2016, label: 'Event 17' },
          { start: 2017, label: 'Event 18' },
          { start: 2018, label: 'Event 19' },
          { start: 2019, label: 'Event 20' }
        ]
      }
    ];

    const resultDefault = computeLayout(data, 1);
    const resultScaled = computeLayout(data, 2);

    const defaultHeight = resultDefault.layoutConfig.timelineHeight || 800;
    const scaledHeight = resultScaled.layoutConfig.timelineHeight || 800;

    expect(scaledHeight).toBeGreaterThan(defaultHeight);
  });

  it('should handle multiple lanes correctly', () => {
    const data: TimelineData = [
      {
        name: 'Lane 1',
        events: [{ start: 2000, label: 'Event 1' }]
      },
      {
        name: 'Lane 2',
        events: [{ start: 2005, label: 'Event 2' }]
      }
    ];

    const result = computeLayout(data);
    expect(result.positionedEvents).toHaveLength(2);
    expect(result.layoutConfig.laneWidths).toHaveLength(2);

    // 各レーン内の x はレーン相対（左端付近から開始）
    expect(result.positionedEvents[0][0]?.x).toBeGreaterThanOrEqual(0);
    expect(result.positionedEvents[1][0]?.x).toBeGreaterThanOrEqual(0);
    expect(result.positionedEvents[0][0]?.width).toBeGreaterThan(0);
  });

  it('should pack overlapping range and point events horizontally', () => {
    const data: TimelineData = [
      {
        name: 'Test Lane',
        events: [
          { start: 1956, end: 1998, label: 'gggg' },
          { start: 1966, label: 'hhhh' },
          { start: 1955, label: 'ffff' },
        ],
      },
    ];

    const result = computeLayout(data);
    const events = result.positionedEvents[0];
    const range = events.find((e) => e.label === 'gggg')!;
    const point = events.find((e) => e.label === 'hhhh')!;

    expect(range.end).toBe(1998);
    expect(point.end).toBeUndefined();

    // 期間が重なる点イベントは期間バーの右側へ
    expect(point.x).toBeGreaterThanOrEqual(range.x + range.width);
  });

  it('should pack overlapping range events side by side without rectangle overlap', () => {
    const data: TimelineData = [
      {
        name: 'Ranges',
        events: [
          { start: 1960, end: 1990, label: '期間A', color: '#1565C0' },
          { start: 1970, end: 2000, label: '期間B', color: '#C45C26' },
          { start: 1980, label: '点C', color: '#2E7D32' },
        ],
      },
    ];

    const result = computeLayout(data);
    const events = result.positionedEvents[0];
    const a = events.find((e) => e.label === '期間A')!;
    const b = events.find((e) => e.label === '期間B')!;
    const c = events.find((e) => e.label === '点C')!;

    expect(a.height).toBeGreaterThan(c.height);
    expect(b.height).toBeGreaterThan(c.height);

    const rects = [a, b, c];
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const x = rects[i];
        const y = rects[j];
        const overlap = !(
          x.x + x.width <= y.x ||
          y.x + y.width <= x.x ||
          x.y + x.height <= y.y ||
          y.y + y.height <= x.y
        );
        expect(overlap, `${x.label} overlaps ${y.label}`).toBe(false);
      }
    }
  });

  it('should size label boxes by text, ignoring period span', () => {
    const data: TimelineData = [
      {
        name: 'Labels',
        events: [
          {
            start: 1910,
            end: 1980,
            label: '短',
            displayStyle: 'label',
            fontSize: 12,
            color: '#C45C26',
          },
          {
            start: 1920,
            end: 1922,
            label: 'とても長いラベル文言',
            displayStyle: 'label',
            fontSize: 12,
            color: '#1565C0',
          },
        ],
      },
    ];

    const result = computeLayout(data);
    const events = result.positionedEvents[0];
    const shortLabel = events.find((e) => e.label === '短')!;
    const longLabel = events.find((e) => e.label.startsWith('とても長い'))!;

    // 長い期間でも短い文言なら高さは小さい／長い文言は文字数で高くなる
    expect(longLabel.height).toBeGreaterThan(shortLabel.height);
    // 縦書き1列なので幅はほぼ同じ（文字幅）
    expect(Math.abs(longLabel.width - shortLabel.width)).toBeLessThan(4);
    // 期間 1910–1980 を高さに使っていない（文字1字分程度）
    expect(shortLabel.height).toBeLessThan(80);
  });

  it('should give point events enough height for large font sizes', () => {
    const data: TimelineData = [
      {
        name: 'Fonts',
        events: [
          { start: 1910, label: '最小フォント', fontSize: 8 },
          { start: 1920, label: '最大フォント', fontSize: 48 },
        ],
      },
    ];

    const result = computeLayout(data);
    const events = result.positionedEvents[0];
    const small = events.find((e) => e.label === '最小フォント')!;
    const large = events.find((e) => e.label === '最大フォント')!;

    expect(large.height).toBeGreaterThanOrEqual(Math.ceil(48 * 1.25) + 6);
    expect(large.height).toBeGreaterThan(small.height);
  });

  it('should ignore label end year for visual height and pack without overlapping tall ranges', () => {
    const data: TimelineData = [
      {
        name: 'Mixed',
        events: [
          {
            start: 1950,
            end: 1980,
            label: '長期間バー',
            color: '#1565C0',
          },
          {
            start: 1955,
            end: 1975,
            label: 'ラベル短',
            displayStyle: 'label',
            fontSize: 12,
            color: '#C45C26',
          },
          { start: 1960, label: '点A', fontSize: 14 },
          { start: 1960, label: '点B', fontSize: 14 },
          { start: 1960, label: '最大フォント混在', fontSize: 48 },
        ],
      },
    ];

    const result = computeLayout(data);
    const events = result.positionedEvents[0];
    const label = events.find((e) => e.label === 'ラベル短')!;
    const range = events.find((e) => e.label === '長期間バー')!;
    const largeFont = events.find((e) => e.label === '最大フォント混在')!;

    // label は期間があっても文字高さ程度
    expect(label.height).toBeLessThan(80);
    expect(range.height).toBeGreaterThan(label.height * 2);
    expect(largeFont.height).toBeGreaterThanOrEqual(Math.ceil(48 * 1.25) + 6);

    // 矩形同士が重ならない
    const rects = events.map((e) => ({
      x: e.x,
      y: e.y,
      width: e.width,
      height: e.height,
      label: e.label,
    }));
    for (let i = 0; i < rects.length; i++) {
      for (let j = i + 1; j < rects.length; j++) {
        const a = rects[i];
        const b = rects[j];
        const overlap = !(
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y
        );
        expect(overlap, `${a.label} overlaps ${b.label}`).toBe(false);
      }
    }
  });
});

describe('calculateTimelineHeight', () => {
  it('should return 800 for empty data (default minimum)', () => {
    const result = calculateTimelineHeight([]);
    expect(result).toBe(800);
  });

  it('should calculate height based on year range', () => {
    const data: TimelineData = [
      {
        name: 'Test Lane',
        events: [
          { start: 2000, label: 'Event 1' },
          { start: 2020, label: 'Event 2' }
        ]
      }
    ];

    const result = calculateTimelineHeight(data);
    expect(result).toBeGreaterThanOrEqual(800); // 最小高さ以上
  });

  it('should scale height with yearHeightScale parameter', () => {
    // より大きなデータセットを使用して、最小高さ制限を超えるようにする
    const data: TimelineData = [
      {
        name: 'Test Lane',
        events: [
          { start: 2000, label: 'Event 1' },
          { start: 2001, label: 'Event 2' },
          { start: 2002, label: 'Event 3' },
          { start: 2003, label: 'Event 4' },
          { start: 2004, label: 'Event 5' },
          { start: 2005, label: 'Event 6' },
          { start: 2006, label: 'Event 7' },
          { start: 2007, label: 'Event 8' },
          { start: 2008, label: 'Event 9' },
          { start: 2009, label: 'Event 10' },
          { start: 2010, label: 'Event 11' },
          { start: 2011, label: 'Event 12' },
          { start: 2012, label: 'Event 13' },
          { start: 2013, label: 'Event 14' },
          { start: 2014, label: 'Event 15' },
          { start: 2015, label: 'Event 16' },
          { start: 2016, label: 'Event 17' },
          { start: 2017, label: 'Event 18' },
          { start: 2018, label: 'Event 19' },
          { start: 2019, label: 'Event 20' }
        ]
      }
    ];

    const defaultHeight = calculateTimelineHeight(data, 1);
    const scaledHeight = calculateTimelineHeight(data, 2);
    expect(scaledHeight).toBeGreaterThan(defaultHeight);
  });
});

describe('calculateTimelineWidth', () => {
  it('should return 120 for empty data', () => {
    const result = calculateTimelineWidth([]);
    expect(result).toBe(120);
  });

  it('should calculate width based on lane data', () => {
    const singleLane: TimelineData = [
      {
        name: 'Short Lane',
        events: [{ start: 2000, label: 'A' }]
      }
    ];

    const multipleLanes: TimelineData = [
      {
        name: 'Lane 1',
        events: [{ start: 2000, label: 'Event 1' }]
      },
      {
        name: 'Lane 2',
        events: [{ start: 2000, label: 'Event 2' }]
      },
      {
        name: 'Lane 3',
        events: [{ start: 2000, label: 'Event 3' }]
      }
    ];

    const singleWidth = calculateTimelineWidth(singleLane);
    const multipleWidth = calculateTimelineWidth(multipleLanes);

    expect(singleWidth).toBeGreaterThan(120);
    expect(multipleWidth).toBeGreaterThan(singleWidth);
  });

  it('should account for long event labels', () => {
    const shortLabels: TimelineData = [
      {
        name: 'Short',
        events: [{ start: 2000, label: 'A' }]
      }
    ];

    const longLabels: TimelineData = [
      {
        name: 'Long',
        events: [{ start: 2000, label: 'これは非常に長いイベントラベルの例です' }]
      }
    ];

    const shortWidth = calculateTimelineWidth(shortLabels);
    const longWidth = calculateTimelineWidth(longLabels);

    expect(longWidth).toBeGreaterThan(shortWidth);
  });
});

// 統合テスト: フィルタと再計算の組み合わせ
describe('Integration: Filter and Layout Recalculation', () => {
  const testData: TimelineData = [
    {
      name: '政治',
      events: [
        { start: 1990, label: '政治イベント1' },
        { start: 2000, label: '政治イベント2' },
        { start: 2010, label: '政治イベント3' }
      ]
    },
    {
      name: '経済',
      events: [
        { start: 1995, label: '経済イベント1' },
        { start: 2005, label: '経済イベント2' },
        { start: 2015, label: '経済イベント3' }
      ]
    },
    {
      name: '社会',
      events: [
        { start: 2001, label: '社会イベント1' },
        { start: 2011, label: '社会イベント2' }
      ]
    }
  ];

  // 元のレイアウトを計算
  const originalLayout = computeLayout(testData);
  const originalPositioned: PositionedEvent[][] = originalLayout.positionedEvents;

  it('should repack layout in filter mode for visible events', () => {
    const filters: FilterState = { yearRange: [2000, 2020] };
    const selectedLanes = ['政治', '経済']; // 社会レーンを除外

    const { result } = renderHook(() =>
      useFilteredEvents(testData, originalPositioned, filters, selectedLanes, 'filter', 1, {
        min: 1990,
        max: 2020,
      })
    );

    expect(result.current.layoutConfig).toBeDefined();
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredPositionedEvents).toHaveLength(2);
    expect(result.current.yearRange).toEqual({ min: 1990, max: 2020 });
  });

  it('should recalculate layout correctly in zoom mode', () => {
    const filters: FilterState = { yearRange: [2000, 2020] };
    const selectedLanes = ['政治', '経済']; // 社会レーンを除外

    const { result } = renderHook(() =>
      useFilteredEvents(testData, originalPositioned, filters, selectedLanes, 'zoom')
    );

    // ズームモードでは新しいlayoutConfigが生成される
    expect(result.current.layoutConfig).toBeDefined();
    expect(result.current.layoutConfig?.laneWidths).toHaveLength(2);
    expect(result.current.filteredData).toHaveLength(2);
    expect(result.current.filteredPositionedEvents).toHaveLength(2);

    // フィルタ済みデータのレーン数は元より少ない
    expect(result.current.layoutConfig?.laneWidths).toHaveLength(2);
    expect(originalLayout.layoutConfig.laneWidths.length).toBeGreaterThan(2);
  });

  it('should handle year range filtering correctly', () => {
    const filters: FilterState = { yearRange: [2000, 2010] };
    const selectedLanes = ['政治', '経済', '社会'];

    const { result } = renderHook(() =>
      useFilteredEvents(testData, originalPositioned, filters, selectedLanes, 'zoom')
    );

    // 2000-2010の範囲にあるイベントのみが含まれるはず
    const totalFilteredEvents = result.current.filteredData?.reduce(
      (sum, lane) => sum + lane.events.length, 0
    ) || 0;

    expect(totalFilteredEvents).toBeLessThan(7); // 元データの総イベント数より少ない
    expect(totalFilteredEvents).toBeGreaterThan(0);
  });

  it('should maintain event properties through filter and recalculation', () => {
    const filters: FilterState = { yearRange: [1990, 2020] };
    const selectedLanes = ['政治'];

    const { result } = renderHook(() =>
      useFilteredEvents(testData, originalPositioned, filters, selectedLanes, 'zoom')
    );

    const politicsEvents = result.current.filteredPositionedEvents[0];
    expect(politicsEvents).toHaveLength(3); // 政治の全イベント

    // 各イベントが必要なプロパティを持っているか確認
    politicsEvents.forEach(event => {
      expect(event).toHaveProperty('start');
      expect(event).toHaveProperty('label');
      expect(event).toHaveProperty('x');
      expect(event).toHaveProperty('y');
      expect(event).toHaveProperty('width');
      expect(event).toHaveProperty('height');
      expect(event.x).toBeGreaterThanOrEqual(0);
      expect(event.y).toBeGreaterThanOrEqual(0);
      expect(event.width).toBeGreaterThan(0);
      expect(event.height).toBeGreaterThan(0);
    });
  });

  it('should handle year height scaling in integration', () => {
    const filters: FilterState = { yearRange: [1990, 2020] };
    const selectedLanes = ['政治', '経済'];

    const { result: normalScale } = renderHook(() =>
      useFilteredEvents(testData, originalPositioned, filters, selectedLanes, 'zoom', 1)
    );

    const { result: doubleScale } = renderHook(() =>
      useFilteredEvents(testData, originalPositioned, filters, selectedLanes, 'zoom', 2)
    );

    const normalHeight = normalScale.current.layoutConfig?.timelineHeight || 0;
    const doubleHeight = doubleScale.current.layoutConfig?.timelineHeight || 0;

    expect(doubleHeight).toBeGreaterThan(normalHeight);
  });

  it('should handle empty filter results gracefully', () => {
    const filters: FilterState = { yearRange: [1800, 1850] }; // 該当イベントなし
    const selectedLanes = ['政治', '経済', '社会'];

    const { result } = renderHook(() =>
      useFilteredEvents(testData, originalPositioned, filters, selectedLanes, 'zoom')
    );

    expect(result.current.filteredData).toEqual([]);
    expect(result.current.filteredPositionedEvents).toEqual([]);
    expect(result.current.layoutConfig).toBeUndefined();
  });
});