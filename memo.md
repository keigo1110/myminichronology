# ミニクロ機能改善 要件定義書

## 1. 仮想スクロール実装

### 機能概要
大量のイベント（1000件以上）を扱う際のパフォーマンス問題を解決するため、画面に表示される部分のみをレンダリングする仮想スクロール機能を実装する。

### 技術仕様
- **使用ライブラリ**: react-window v1.8.10
- **対象コンポーネント**: Timeline.tsx, LaneColumn.tsx, EventItem.tsx

### 詳細要件

#### 1.1 パッケージインストール
```bash
npm install react-window react-window-infinite-loader
npm install --save-dev @types/react-window
```

#### 1.2 新規ファイル作成
`src/components/VirtualizedLaneColumn.tsx`:
```typescript
import React, { useRef, useCallback, useMemo } from 'react';
import { VariableSizeList as List } from 'react-window';
import { Box, Typography } from '@mui/material';
import { PositionedEvent, Lane } from '../lib/types';
import { EventItem } from './EventItem';

interface VirtualizedLaneColumnProps {
  lane: Lane;
  events: PositionedEvent[];
  color: string;
  laneWidth: number;
  timelineHeight: number;
  yearRange: { min: number; max: number };
  onEventClick?: (event: PositionedEvent) => void;
}

export function VirtualizedLaneColumn({
  lane,
  events,
  color,
  laneWidth,
  timelineHeight,
  yearRange,
  onEventClick
}: VirtualizedLaneColumnProps) {
  const listRef = useRef<List>(null);
  const headerHeight = 60;
  const itemSizeMap = useRef<{ [index: number]: number }>({});

  // イベントの高さを計算
  const getItemSize = useCallback((index: number) => {
    // キャッシュされた高さがあれば使用
    if (itemSizeMap.current[index]) {
      return itemSizeMap.current[index];
    }

    const event = events[index];
    if (!event) return 40; // デフォルト高さ

    // イベントの種類に応じて高さを計算
    const baseHeight = event.end ? event.height : 40;
    const calculatedHeight = Math.max(40, baseHeight);

    // キャッシュに保存
    itemSizeMap.current[index] = calculatedHeight;
    return calculatedHeight;
  }, [events]);

  // アイテムレンダラー
  const Row = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    const event = events[index];
    if (!event) return null;

    return (
      <div style={style}>
        <EventItem
          event={event}
          color={color}
          onClick={() => onEventClick?.(event)}
          yearRange={yearRange}
          timelineHeight={timelineHeight}
          scrollPosition={0} // 仮想スクロール内では不要
        />
      </div>
    );
  }, [events, color, onEventClick, yearRange, timelineHeight]);

  // イベントをY座標でソート
  const sortedEvents = useMemo(() => {
    return [...events].sort((a, b) => a.y - b.y);
  }, [events]);

  return (
    <Box
      sx={{
        position: 'relative',
        width: laneWidth,
        height: timelineHeight,
        backgroundColor: color,
        borderRight: '1px solid rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* レーンヘッダー（固定） */}
      <Box
        sx={{
          position: 'sticky',
          top: 0,
          zIndex: 30,
          backgroundColor: color,
          borderBottom: '2px solid rgba(0,0,0,0.2)',
          p: 1,
          height: headerHeight,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
          {lane.name}
        </Typography>
      </Box>

      {/* 仮想スクロールリスト */}
      <List
        ref={listRef}
        height={timelineHeight - headerHeight}
        itemCount={sortedEvents.length}
        itemSize={getItemSize}
        width={laneWidth}
        overscanCount={5} // 画面外に5アイテム分余分にレンダリング
      >
        {Row}
      </List>
    </Box>
  );
}
```

#### 1.3 Timeline.tsx の更新
```typescript
// src/components/Timeline.tsx の該当部分を以下に置き換え
import { VirtualizedLaneColumn } from './VirtualizedLaneColumn';

// ... 既存のコード ...

{/* レーン部分を仮想スクロール版に置き換え */}
<Box sx={{ display: 'flex', flex: 1, height: timelineHeight }}>
  {data.map((lane, index) => {
    const eventCount = positionedEvents[index]?.length || 0;

    // イベント数が100を超える場合は仮想スクロール版を使用
    if (eventCount > 100) {
      return (
        <VirtualizedLaneColumn
          key={lane.name}
          lane={lane}
          events={positionedEvents[index] || []}
          color={laneColors[index]}
          laneWidth={layoutConfig.laneWidths[index] || 300}
          timelineHeight={timelineHeight}
          yearRange={yearRange}
          onEventClick={onEventClick}
        />
      );
    }

    // 100件以下は既存のコンポーネントを使用
    return (
      <LaneColumn
        key={lane.name}
        lane={lane}
        events={positionedEvents[index] || []}
        color={laneColors[index]}
        laneWidth={layoutConfig.laneWidths[index] || 300}
        onEventClick={onEventClick}
        yearRange={yearRange}
        timelineHeight={timelineHeight}
        scrollPosition={scrollPosition}
      />
    );
  })}
</Box>
```

### 入力/出力仕様
- **入力**: 既存のTimelineDataと同じ
- **出力**: 既存と同じ表示（ただし大量データ時のパフォーマンスが向上）

### パフォーマンス基準
- 10,000件のイベントで初期レンダリング時間が100ms以内
- スクロール時のフレームレートが60fps維持

### テストケース
```typescript
// src/tests/VirtualizedLaneColumn.test.tsx
import { render, screen } from '@testing-library/react';
import { VirtualizedLaneColumn } from '../components/VirtualizedLaneColumn';

describe('VirtualizedLaneColumn', () => {
  const mockLane = {
    name: 'Test Lane',
    events: Array.from({ length: 10000 }, (_, i) => ({
      start: 2000 + i,
      label: `Event ${i}`
    }))
  };

  it('should render only visible items', () => {
    const { container } = render(
      <VirtualizedLaneColumn
        lane={mockLane}
        events={mockLane.events.map((e, i) => ({
          ...e,
          x: 0,
          y: i * 50,
          width: 300,
          height: 40
        }))}
        color="#E3F2FD"
        laneWidth={300}
        timelineHeight={800}
        yearRange={{ min: 2000, max: 12000 }}
      />
    );

    // 可視範囲のアイテムのみがレンダリングされていることを確認
    const renderedItems = container.querySelectorAll('[data-testid="event-item"]');
    expect(renderedItems.length).toBeLessThan(50); // 全10000件中、表示は50件以下
  });
});
```

---

## 2. 検索・フィルタリング機能

### 機能概要
ユーザーがイベントを検索したり、年代範囲でフィルタリングしたりできる機能を追加する。

### 技術仕様
- **新規コンポーネント**: SearchFilter.tsx
- **状態管理**: useReducerを使用
- **検索アルゴリズム**: 部分一致検索（大文字小文字区別なし）

### 詳細要件

#### 2.1 新規ファイル作成
`src/components/SearchFilter.tsx`:
```typescript
import React, { useState, useCallback, useMemo } from 'react';
import {
  Box,
  TextField,
  Paper,
  Slider,
  Typography,
  Chip,
  InputAdornment,
  IconButton,
  Collapse
} from '@mui/material';
import { Search, Clear, FilterList } from '@mui/icons-material';

interface SearchFilterProps {
  yearRange: { min: number; max: number };
  lanes: string[];
  onFilterChange: (filters: FilterState) => void;
}

export interface FilterState {
  searchTerm: string;
  yearRange: [number, number];
  selectedLanes: string[];
}

export function SearchFilter({ yearRange, lanes, onFilterChange }: SearchFilterProps) {
  const [expanded, setExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterYearRange, setFilterYearRange] = useState<[number, number]>([
    yearRange.min,
    yearRange.max
  ]);
  const [selectedLanes, setSelectedLanes] = useState<string[]>(lanes);

  // フィルター変更を親コンポーネントに通知
  const applyFilters = useCallback(() => {
    onFilterChange({
      searchTerm,
      yearRange: filterYearRange,
      selectedLanes
    });
  }, [searchTerm, filterYearRange, selectedLanes, onFilterChange]);

  // 検索語句変更（デバウンス付き）
  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    // 300ms後に検索実行
    const timeoutId = setTimeout(() => {
      applyFilters();
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [applyFilters]);

  // 年代範囲変更
  const handleYearRangeChange = useCallback((event: Event, newValue: number | number[]) => {
    setFilterYearRange(newValue as [number, number]);
  }, []);

  // レーン選択切り替え
  const toggleLane = useCallback((lane: string) => {
    setSelectedLanes(prev => {
      if (prev.includes(lane)) {
        return prev.filter(l => l !== lane);
      } else {
        return [...prev, lane];
      }
    });
  }, []);

  // アクティブなフィルター数
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (filterYearRange[0] !== yearRange.min || filterYearRange[1] !== yearRange.max) count++;
    if (selectedLanes.length !== lanes.length) count++;
    return count;
  }, [searchTerm, filterYearRange, yearRange, selectedLanes, lanes]);

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
            <Chip
              label={activeFilterCount}
              size="small"
              color="primary"
              sx={{
                position: 'absolute',
                top: -5,
                right: -5,
                height: 20,
                fontSize: '0.75rem'
              }}
            />
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

          {/* レーン選択 */}
          <Box>
            <Typography variant="body2" gutterBottom>
              表示するレーン:
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {lanes.map(lane => (
                <Chip
                  key={lane}
                  label={lane}
                  onClick={() => {
                    toggleLane(lane);
                    applyFilters();
                  }}
                  color={selectedLanes.includes(lane) ? 'primary' : 'default'}
                  variant={selectedLanes.includes(lane) ? 'filled' : 'outlined'}
                />
              ))}
            </Box>
          </Box>
        </Box>
      </Collapse>
    </Paper>
  );
}
```

#### 2.2 フィルタリングロジック
`src/hooks/useFilteredEvents.ts`:
```typescript
import { useMemo } from 'react';
import { TimelineData, PositionedEvent } from '../lib/types';
import { FilterState } from '../components/SearchFilter';

export function useFilteredEvents(
  data: TimelineData | null,
  positionedEvents: PositionedEvent[][],
  filters: FilterState
) {
  return useMemo(() => {
    if (!data) return { filteredData: null, filteredPositionedEvents: [] };

    // フィルタリング処理
    const filteredData: TimelineData = [];
    const filteredPositionedEvents: PositionedEvent[][] = [];

    data.forEach((lane, laneIndex) => {
      // レーンフィルター
      if (!filters.selectedLanes.includes(lane.name)) {
        return;
      }

      const filteredLaneEvents = lane.events.filter(event => {
        // 年代フィルター
        const eventStart = event.start;
        const eventEnd = event.end || event.start;
        if (eventEnd < filters.yearRange[0] || eventStart > filters.yearRange[1]) {
          return false;
        }

        // 検索フィルター
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const labelLower = event.label.toLowerCase();
          if (!labelLower.includes(searchLower)) {
            return false;
          }
        }

        return true;
      });

      if (filteredLaneEvents.length > 0) {
        filteredData.push({
          name: lane.name,
          events: filteredLaneEvents
        });

        // 対応する配置済みイベントもフィルタリング
        const filteredPositioned = positionedEvents[laneIndex].filter(pe =>
          filteredLaneEvents.some(e =>
            e.start === pe.start &&
            e.end === pe.end &&
            e.label === pe.label
          )
        );
        filteredPositionedEvents.push(filteredPositioned);
      }
    });

    return { filteredData, filteredPositionedEvents };
  }, [data, positionedEvents, filters]);
}
```

#### 2.3 page.tsx の更新
```typescript
// src/app/page.tsx に以下を追加
import { SearchFilter, FilterState } from '../components/SearchFilter';
import { useFilteredEvents } from '../hooks/useFilteredEvents';

// Home コンポーネント内に追加
const [filters, setFilters] = useState<FilterState>({
  searchTerm: '',
  yearRange: [yearRange.min, yearRange.max],
  selectedLanes: data?.map(lane => lane.name) || []
});

// フィルタリング適用
const { filteredData, filteredPositionedEvents } = useFilteredEvents(
  data,
  positionedEvents,
  filters
);

// レンダリング部分を更新
{data && (
  <>
    <SearchFilter
      yearRange={yearRange}
      lanes={data.map(lane => lane.name)}
      onFilterChange={setFilters}
    />
    <Timeline
      data={filteredData || data}
      positionedEvents={filteredPositionedEvents.length > 0 ? filteredPositionedEvents : positionedEvents}
      // ... 他のプロパティ
    />
  </>
)}
```

### 入力/出力仕様
- **入力**: 検索文字列、年代範囲、レーン選択
- **出力**: フィルタリングされたイベント表示

### パフォーマンス基準
- 10,000件のイベントで検索実行が50ms以内
- リアルタイム検索（300msデバウンス）

### テストケース
```typescript
// src/tests/SearchFilter.test.tsx
describe('SearchFilter', () => {
  it('should filter events by search term', () => {
    const mockData = [
      { name: 'Lane1', events: [
        { start: 2000, label: '東京オリンピック' },
        { start: 2020, label: '東京オリンピック延期' }
      ]}
    ];

    const { result } = renderHook(() =>
      useFilteredEvents(mockData, [[]], {
        searchTerm: '延期',
        yearRange: [1900, 2100],
        selectedLanes: ['Lane1']
      })
    );

    expect(result.current.filteredData[0].events).toHaveLength(1);
    expect(result.current.filteredData[0].events[0].label).toContain('延期');
  });
});
```

これらの要件定義書に基づいて、一つずつ実装を進めることができます。各機能は独立して実装可能で、既存のコードベースに段階的に統合できるよう設計されています。