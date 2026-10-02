export type EventDisplayStyle = 'default' | 'label';

/** vertical: 縦=年代 / 横=テーマ。horizontal: 縦=テーマ / 横=年代（左→右で新） */
export type TimelineOrientation = 'vertical' | 'horizontal';

/** 年表内の出来事ラベルの書字方向。テーマ名や年代軸には影響しない。 */
export type EventLabelOrientation = 'vertical' | 'horizontal';

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
  /** 表示スタイル。label = goal_design 風の塗り付きラベルボックス */
  displayStyle?: EventDisplayStyle;
  /** G列: 埋め込み画像の URL（http/https） */
  imageUrl?: string;
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
  /** 年軸で計算した期間バーの長さ。文字・画像の表示枠とは独立させる。 */
  rangeLength?: number;
}

/**
 * 縦型年表の密度連動スケール。
 * positions[0] は minYear、末尾は maxYear + 1 の描画位置を表す。
 */
export interface AdaptiveYearScale {
  minYear: number;
  maxYear: number;
  positions: number[];
  contentSize: number;
}

export interface DynamicLayoutConfig {
  laneWidths: number[];
  laneWidthByName: Record<string, number>;
  /** horizontal 時: 各レーン行の高さ */
  laneHeights?: number[];
  laneHeightByName?: Record<string, number>;
  yearAxisWidth: number;
  /** horizontal 時: 上下の年軸の高さ */
  yearAxisHeight?: number;
  /** horizontal 時: 左のレーン名レール幅 */
  laneLabelWidth?: number;
  /** horizontal 時: 余白を除いた年代軸の実幅 */
  yearContentWidth?: number;
  totalWidth: number;
  timelineHeight?: number;
  orientation?: TimelineOrientation;
  /** 縦型のみ: イベント密度に応じた年→px変換 */
  yearScale?: AdaptiveYearScale;
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
  | 'invalid-style'
  | 'warning-limit';

export interface ParseWarning {
  type: ParseErrorType;
  /** i18n MessageKey（例: parse.invalidStartYear） */
  code: string;
  params?: Record<string, string | number>;
  sheet?: string;
  row?: number;
}

export interface ParseResult {
  lanes: TimelineData;
  warnings: ParseWarning[];
  truncatedSheets: number;
}
