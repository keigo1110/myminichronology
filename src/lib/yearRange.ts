export function hasYearRange(range: { min: number; max: number }): boolean {
  return Number.isFinite(range.min) && Number.isFinite(range.max) &&
    range.min >= 0 && range.max > range.min;
}
