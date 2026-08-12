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

const ADAPTIVE_TICK_INTERVALS = [
  10000,
  5000,
  2000,
  1000,
  500,
  250,
  100,
  50,
  25,
  10,
  5,
  2,
  1,
];

/**
 * 実際の描画位置を基準に目盛りを増減する。
 * 大きな区切りを優先してから、空きがある場所だけ細かい目盛りを追加する。
 */
export function getYearTicksForPositions(
  min: number,
  max: number,
  positionForYear: (year: number) => number,
  minSpacingPx: number
): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return [];
  }

  const selected = new Map<number, number>();
  const edgeYears = min === max ? [min] : [min, max];
  const edgePositions = edgeYears.map((year) => ({
    year,
    position: positionForYear(year),
  }));
  const addIfRoom = (year: number, force = false) => {
    if (year < min || year > max || selected.has(year)) return;
    const position = positionForYear(year);
    if (!Number.isFinite(position)) return;
    if (
      force ||
      (edgePositions.every(
        (edge) => edge.year === year || Math.abs(position - edge.position) >= minSpacingPx
      ) &&
        [...selected.values()].every(
          (selectedPosition) => Math.abs(position - selectedPosition) >= minSpacingPx
        ))
    ) {
      selected.set(year, position);
    }
  };

  addIfRoom(min, true);
  addIfRoom(max, true);

  for (const interval of ADAPTIVE_TICK_INTERVALS) {
    const start = Math.ceil(min / interval) * interval;
    for (let year = start; year <= max; year += interval) {
      addIfRoom(year);
    }
  }

  return [...selected.keys()].sort((a, b) => a - b);
}

export function getSmallestYearTickInterval(ticks: number[]): number {
  let smallest = Infinity;
  for (let index = 1; index < ticks.length; index += 1) {
    const interval = ticks[index] - ticks[index - 1];
    if (interval > 0) smallest = Math.min(smallest, interval);
  }
  return Number.isFinite(smallest) ? smallest : 10;
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
