/** イベント DOM id（検索ジャンプ用） */
export function getEventDomId(
  laneName: string,
  event: { start: number; end?: number; label: string },
  index: number
): string {
  const safeLane = encodeURIComponent(laneName);
  const safeLabel = encodeURIComponent(event.label).slice(0, 40);
  return `evt-${safeLane}-${event.start}-${event.end ?? 'p'}-${index}-${safeLabel}`;
}
