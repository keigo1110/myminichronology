/**
 * goal_design.png に寄せた年表向けの年目盛り。
 * 狭い範囲では毎年〜数年おき、広い範囲では間引く。
 */
export function getYearTickInterval(min: number, max: number): number {
  const span = Math.max(0, max - min);

  if (span <= 25) return 1;
  if (span <= 50) return 2;
  if (span <= 100) return 5;
  if (span <= 200) return 10;
  if (span <= 500) return 25;
  if (span <= 2000) return 50;
  if (span <= 5000) return 100;

  return Math.max(250, Math.ceil(span / 40 / 50) * 50);
}

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

  return ticks;
}

/**
 * 密集した年表向けの年表示。
 * 細かい目盛りでは西暦下2桁、キリの良い年は4桁。
 */
export function formatYearLabel(year: number, interval: number): string {
  if (interval >= 10) {
    return String(year);
  }

  if (year % 10 === 0) {
    return String(year);
  }

  return String(year).slice(-2).padStart(2, '0');
}
