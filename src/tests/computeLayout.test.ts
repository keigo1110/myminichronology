import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import {
  computeLayout,
  calculateTimelineHeight,
  calculateTimelineWidth,
  LANE_LABEL_WIDTH_HORIZONTAL,
  MIN_LANE_ROW_HEIGHT,
  mapYearToPosition,
  measureEventSize,
  layoutOccupancyEnd,
  TIMELINE_HEADER_HEIGHT,
} from '../lib/computeLayout';
import { useFilteredEvents } from '../hooks/useFilteredEvents';
import type { FilterState } from '../hooks/useFilteredEvents';
import type { TimelineData, PositionedEvent } from '../lib/types';

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

  it('should expand dense year bands so older events do not spill into later decades', () => {
    const data: TimelineData = [
      {
        name: 'Dense',
        events: [
          { start: 1800, label: '基準点' },
          {
            start: 1990,
            label: '縦ラベルが長くても次年代へ食い込ませない',
            displayStyle: 'label',
            fontSize: 16,
          },
          { start: 1990, label: '同年イベントA', fontSize: 14 },
          { start: 1990, label: '同年イベントB', fontSize: 14 },
          { start: 1995, label: '密集イベントC', fontSize: 14 },
          { start: 1995, label: '密集イベントD', fontSize: 14 },
          { start: 1999, label: '20世紀末', fontSize: 14 },
          { start: 2000, label: '21世紀', fontSize: 14 },
          { start: 2010, label: '終端基準' },
        ],
      },
    ];

    const result = computeLayout(data);
    const scale = result.layoutConfig.yearScale;
    expect(scale).toBeDefined();

    const contentHeight =
      (result.layoutConfig.timelineHeight ?? 800) - TIMELINE_HEADER_HEIGHT;
    const yearPosition = (year: number) =>
      mapYearToPosition(year, result.yearRange, contentHeight, scale);

    // label がある 1990 年だけ、通常年より大きい年バンドを確保する
    expect(yearPosition(1991) - yearPosition(1990)).toBeGreaterThan(
      yearPosition(1891) - yearPosition(1890)
    );

    const events = result.positionedEvents[0];
    const year2000Y = yearPosition(2000);
    for (const event of events.filter((item) => item.start < 2000)) {
      expect(
        event.y + event.height,
        `${event.label} spills into the 2000s`
      ).toBeLessThanOrEqual(year2000Y);
    }

    for (let first = 0; first < events.length; first += 1) {
      for (let second = first + 1; second < events.length; second += 1) {
        const a = events[first];
        const b = events[second];
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

  it('keeps more than 80 same-year events collision-free inside their year band', () => {
    const data: TimelineData = [
      {
        name: 'Stress',
        events: [
          ...Array.from({ length: 160 }, (_, index) => ({
            start: 2000,
            label: `集中イベント-${String(index).padStart(3, '0')}`,
          })),
          { start: 2010, label: '終端基準' },
        ],
      },
    ];

    const result = computeLayout(data);
    const events = result.positionedEvents[0].filter((event) => event.start === 2000);
    const contentHeight =
      (result.layoutConfig.timelineHeight ?? 800) - TIMELINE_HEADER_HEIGHT;
    const nextYearY = mapYearToPosition(
      2001,
      result.yearRange,
      contentHeight,
      result.layoutConfig.yearScale
    );

    for (let first = 0; first < events.length; first += 1) {
      expect(events[first].y + events[first].height).toBeLessThanOrEqual(nextYearY);
      for (let second = first + 1; second < events.length; second += 1) {
        const a = events[first];
        const b = events[second];
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

  it('keeps deterministic mixed stress data bounded and collision-free', () => {
    let state = 0x5eed1234;
    const random = () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };

    for (let sample = 0; sample < 12; sample += 1) {
      const events = Array.from({ length: 70 }, (_, index) => {
        const start = 1950 + Math.floor(random() * 56);
        const kind = random();
        const end = kind < 0.22 ? Math.min(2010, start + 1 + Math.floor(random() * 15)) : undefined;
        const displayStyle = kind >= 0.22 && kind < 0.36 ? ('label' as const) : undefined;
        return {
          start,
          end,
          displayStyle,
          fontSize: 8 + Math.floor(random() * 17),
          label: `${displayStyle ? '縦ラベル' : '混在イベント'}-${sample}-${index}-${'長'.repeat(
            Math.floor(random() * 8)
          )}`,
        };
      });
      const result = computeLayout([{ name: `Stress-${sample}`, events }]);
      const positioned = result.positionedEvents[0];
      const laneWidth = result.layoutConfig.laneWidths[0];
      const contentHeight =
        (result.layoutConfig.timelineHeight ?? 800) - TIMELINE_HEADER_HEIGHT;
      const yearPosition = (year: number) =>
        mapYearToPosition(
          year,
          result.yearRange,
          contentHeight,
          result.layoutConfig.yearScale
        );

      for (let first = 0; first < positioned.length; first += 1) {
        const a = positioned[first];
        expect(a.x).toBeGreaterThanOrEqual(0);
        expect(a.y).toBeGreaterThanOrEqual(0);
        expect(a.x + a.width).toBeLessThanOrEqual(laneWidth);
        expect(a.y + a.height).toBeLessThanOrEqual(contentHeight);
        if (layoutOccupancyEnd(a) === a.start) {
          expect(
            a.y + a.height,
            `${a.label} spills beyond its start-year band`
          ).toBeLessThanOrEqual(yearPosition(a.start + 1));
        }

        for (let second = first + 1; second < positioned.length; second += 1) {
          const b = positioned[second];
          const overlap = !(
            a.x + a.width <= b.x ||
            b.x + b.width <= a.x ||
            a.y + a.height <= b.y ||
            b.y + b.height <= a.y
          );
          expect(
            overlap,
            `${a.label} ${JSON.stringify({ start: a.start, x: a.x, y: a.y, width: a.width, height: a.height })} ` +
              `overlaps ${b.label} ${JSON.stringify({ start: b.start, x: b.x, y: b.y, width: b.width, height: b.height })}`
          ).toBe(false);
        }
      }
    }
  });

  it('wraps an extremely long point label within the vertical lane', () => {
    const result = computeLayout([
      {
        name: 'Long text',
        events: [
          { start: 2000, label: '長い説明'.repeat(80), fontSize: 14 },
          { start: 2010, label: '終端' },
        ],
      },
    ]);
    const event = result.positionedEvents[0][0];
    const laneWidth = result.layoutConfig.laneWidths[0];

    expect(event.x + event.width).toBeLessThanOrEqual(laneWidth);
    expect(event.height).toBeGreaterThan(40);
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
describe('computeLayout horizontal', () => {
  it('normalizes a zero-width year range so events and the axis share one scale', () => {
    const result = computeLayout(
      [{ name: '単年', events: [{ start: 2000, label: '年初イベント' }] }],
      1,
      { min: 2000, max: 2000 },
      'horizontal'
    );

    expect(result.yearRange.max).toBeGreaterThan(result.yearRange.min);
    expect(result.positionedEvents[0][0].x).toBe(0);
  });

  it('maps years to x (left=old, right=new) and stacks lanes as rows', () => {
    const data: TimelineData = [
      {
        name: '政治',
        events: [
          { start: 2000, label: '古い' },
          { start: 2010, label: '新しい' },
        ],
      },
      {
        name: '経済',
        events: [{ start: 2005, label: '中間' }],
      },
    ];

    const result = computeLayout(data, 1, undefined, 'horizontal');
    expect(result.layoutConfig.orientation).toBe('horizontal');
    expect(result.layoutConfig.laneHeights).toHaveLength(2);
    expect(result.layoutConfig.laneLabelWidth).toBeGreaterThan(0);
    expect(result.layoutConfig.yearAxisHeight).toBeGreaterThan(0);

    const [oldEvent, newEvent] = result.positionedEvents[0];
    expect(oldEvent.x).toBeLessThan(newEvent.x);

    const rangeData: TimelineData = [
      {
        name: '期間',
        events: [{ start: 2000, end: 2020, label: '長期' }],
      },
    ];
    const rangeResult = computeLayout(rangeData, 1, undefined, 'horizontal');
    const rangeEvent = rangeResult.positionedEvents[0][0];
    expect(rangeEvent.width).toBeGreaterThan(rangeEvent.height);
  });

  it('packs overlapping horizontal events downward within a lane', () => {
    const data: TimelineData = [
      {
        name: '重なり',
        events: [
          { start: 2000, end: 2020, label: '長い期間' },
          { start: 2005, label: '点' },
        ],
      },
    ];

    const result = computeLayout(data, 1, undefined, 'horizontal');
    const events = result.positionedEvents[0];
    const range = events.find((e) => e.label === '長い期間')!;
    const point = events.find((e) => e.label === '点')!;

    expect(point.x).toBeGreaterThanOrEqual(range.x);
    expect(point.x).toBeLessThan(range.x + range.width);
    expect(point.y).toBeGreaterThanOrEqual(range.y + range.height - 1);
  });

  it('widens range events so long labels are not clipped', () => {
    const spanYears = 2;
    const build = (label: string): TimelineData => [
      {
        name: '期間',
        events: [
          { start: 2000, end: 2000 + spanYears, label },
          { start: 2100, label: '端' },
        ],
      },
    ];

    const short = computeLayout(build('短'), 1, undefined, 'horizontal');
    const long = computeLayout(
      build('とても長い期間ラベルの説明文がここに入ります'),
      1,
      undefined,
      'horizontal'
    );

    const shortRange = short.positionedEvents[0].find((e) => e.label === '短')!;
    const longRange = long.positionedEvents[0].find((e) =>
      e.label.startsWith('とても長い')
    )!;

    expect(longRange.width).toBeGreaterThan(shortRange.width);
    // 期間の年スケール幅だけでなく、テキスト幅も確保されている
    expect(longRange.width).toBeGreaterThan(spanYears * 24);
  });

  it('reserves trailing space for long labels near the final year', () => {
    const finalEvent = {
      start: 2029,
      label: 'NIST：ポスト量子暗号FIPS 203／204／205',
    };
    const result = computeLayout(
      [
        {
          name: '右端',
          events: [{ start: 2000, label: '開始' }, finalEvent],
        },
      ],
      1,
      { min: 2000, max: 2030 },
      'horizontal'
    );
    const positioned = result.positionedEvents[0].find(
      (event) => event.label === finalEvent.label
    )!;
    const expectedWidth = measureEventSize(finalEvent).width;
    const laneWidth = result.layoutConfig.laneWidths[0];

    expect(positioned.width).toBeGreaterThanOrEqual(expectedWidth);
    expect(positioned.x + positioned.width).toBeLessThanOrEqual(laneWidth);
  });

  it('clips a range to the selected horizontal zoom window', () => {
    const result = computeLayout(
      [
        {
          name: '期間',
          events: [{ start: 1900, end: 2100, label: '表示範囲をまたぐ期間' }],
        },
      ],
      1,
      { min: 2000, max: 2010 },
      'horizontal'
    );
    const event = result.positionedEvents[0][0];
    const yearContentWidth = result.layoutConfig.yearContentWidth!;

    expect(event.x).toBe(0);
    expect(event.width).toBeLessThanOrEqual(yearContentWidth);
  });

  it('scales content width with yearHeightScale', () => {
    const data: TimelineData = [
      {
        name: 'Scale',
        events: [
          { start: 2000, label: 'A' },
          { start: 2050, label: 'B' },
        ],
      },
    ];

    const normal = computeLayout(data, 1, undefined, 'horizontal');
    const wide = computeLayout(data, 2, undefined, 'horizontal');
    expect(wide.layoutConfig.totalWidth).toBeGreaterThan(normal.layoutConfig.totalWidth);
  });
});

describe('computeLayout with images', () => {
  it('reserves image slot width for events with imageUrl', () => {
    const without: TimelineData = [
      { name: 'A', events: [{ start: 2000, label: '文字だけ' }] },
    ];
    const withImg: TimelineData = [
      {
        name: 'A',
        events: [
          {
            start: 2000,
            label: '文字だけ',
            imageUrl: 'https://placehold.co/96x72/png',
          },
        ],
      },
    ];

    const a = computeLayout(without);
    const b = computeLayout(withImg);
    expect(b.positionedEvents[0][0].width).toBeGreaterThan(a.positionedEvents[0][0].width);
    expect(b.positionedEvents[0][0].height).toBeGreaterThanOrEqual(a.positionedEvents[0][0].height);
  });

  it('stacks image below range events in horizontal layout', () => {
    const data: TimelineData = [
      {
        name: '期間',
        events: [
          {
            start: 2000,
            end: 2020,
            label: '長期',
            imageUrl: 'https://placehold.co/96x72/png',
          },
        ],
      },
    ];
    const plain = computeLayout(
      [{ name: '期間', events: [{ start: 2000, end: 2020, label: '長期' }] }],
      1,
      undefined,
      'horizontal'
    );
    const withImg = computeLayout(data, 1, undefined, 'horizontal');
    expect(withImg.positionedEvents[0][0].height).toBeGreaterThan(
      plain.positionedEvents[0][0].height
    );
  });
});

describe('horizontal lane label height', () => {
  it('grows row height so vertical theme labels are not clipped', () => {
    const shortName = '政治';
    const longName = '3_ラベルボックス';
    const short = computeLayout(
      [{ name: shortName, events: [{ start: 2000, label: 'A' }] }],
      1,
      undefined,
      'horizontal'
    );
    const long = computeLayout(
      [{ name: longName, events: [{ start: 2000, label: 'A' }] }],
      1,
      undefined,
      'horizontal'
    );
    expect(long.layoutConfig.laneHeights?.[0] ?? 0).toBeGreaterThan(
      short.layoutConfig.laneHeights?.[0] ?? 0
    );
    expect(long.layoutConfig.laneLabelWidth).toBe(LANE_LABEL_WIDTH_HORIZONTAL);
  });

  it('uses a two-column label rail for very long theme names', () => {
    const veryLongName = 'とてもとても長いテーマ名の例です';
    const result = computeLayout(
      [{ name: veryLongName, events: [{ start: 2000, label: 'A' }] }],
      1,
      undefined,
      'horizontal'
    );

    expect(result.layoutConfig.laneLabelWidth).toBe(LANE_LABEL_WIDTH_HORIZONTAL * 2);
  });

  it('keeps lane rows at least MIN_LANE_ROW_HEIGHT tall', () => {
    const result = computeLayout(
      [{ name: '短', events: [{ start: 2000, label: 'A' }] }],
      1,
      undefined,
      'horizontal'
    );

    expect(result.layoutConfig.laneHeights?.[0] ?? 0).toBeGreaterThanOrEqual(
      MIN_LANE_ROW_HEIGHT
    );
  });
});
