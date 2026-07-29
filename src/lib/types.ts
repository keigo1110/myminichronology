export type EventDisplayStyle = 'default' | 'label';

export interface Event {
  start: number;
  end?: number; // undefined → 点イベント
  label: string;
  /** フォントサイズ（px）。未指定時は UI デフォルト */
  fontSize?: number;
  /**
   * 色（#RRGGBB）。
   * default 表示: 文字色 / label 表示: ボックス塗り色。
   * 未指定時は黒。
   */
  color?: string;
  /** 表示スタイル。label = goal_design 風の縦書きボックス */
  displayStyle?: EventDisplayStyle;
}

export interface Lane {
  name: string; // シート名
  events: Event[];
}

export type TimelineData = Lane[]; // 最大 5 件

export interface PositionedEvent extends Event {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface DynamicLayoutConfig {
  laneWidths: number[];
  laneWidthByName: Record<string, number>;
  yearAxisWidth: number;
  totalWidth: number;
  timelineHeight?: number;
}

export type LayoutMode = 'zoom' | 'filter';

export type ParseErrorType =
  | 'file-format'
  | 'missing-columns'
  | 'invalid-year'
  | 'too-many-lanes'
  | 'empty-sheet'
  | 'skipped-sheet'
  | 'year-order'
  | 'year-span'
  | 'invalid-style';

export interface ParseWarning {
  type: ParseErrorType;
  message: string;
  sheet?: string;
  row?: number;
}

export interface ParseResult {
  lanes: TimelineData;
  warnings: ParseWarning[];
  truncatedSheets: number;
}
