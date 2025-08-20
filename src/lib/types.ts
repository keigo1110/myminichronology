// データ構造の型定義
export type RawEventRow = [number, number | null, string]; // [start, end, label]

export interface Event {
  start: number;
  end?: number;          // undefined → 点イベント
  label: string;
}

export interface Lane {
  name: string;          // シート名
  events: Event[];
}

export type TimelineData = Lane[]; // 最大 5 件

export interface PositionedEvent extends Event {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 動的レイアウト設定
export interface DynamicLayoutConfig {
  laneWidths: number[];     // 各レーンの幅
  yearAxisWidth: number;    // 年代軸の幅
  totalWidth: number;       // 全体の幅
  timelineHeight?: number;  // 動的に計算された高さ
}

// レイアウトモードの型定義
export type LayoutMode = 'zoom' | 'filter';

// エラーハンドリング用の型
export interface ParseError {
  type: 'file-format' | 'missing-columns' | 'invalid-year' | 'too-many-lanes';
  message: string;
  row?: number;
}