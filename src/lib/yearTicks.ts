/**
 * 年範囲に応じた目盛り間隔を返す（おおよそ最大20本程度）。
 */
export function getYearTickInterval(min: number, max: number): number {
  const span = Math.max(0, max - min);

  if (span <= 100) return 10;
  if (span <= 500) return 50;
  if (span <= 2000) return 100;
  if (span <= 5000) return 250;
  if (span <= 10000) return 500;

  return Math.max(1000, Math.ceil(span / 20 / 1000) * 1000);
}

/**
 * 年範囲のグリッド／ラベル用の年配列を生成する。
 */
export function getYearTicks(min: number, max: number): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return [];
  }

  const interval = getYearTickInterval(min, max);
  const start = Math.floor(min / interval) * interval;
  const ticks: number[] = [];

  for (let year = start; year <= max; year += interval) {
    if (year >= min) {
      ticks.push(year);
    }
  }

  if (ticks.length === 0 || ticks[ticks.length - 1] !== max) {
    // 終端が目盛りに乗らない場合でも、最終年は含めない（グリッドは interval ベース）
  }

  return ticks;
}
