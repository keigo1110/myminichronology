import type { PositionedEvent } from './types';
import type { TimelineWindow } from '../hooks/useTimelineWindow';

export function isEventVisible(event: PositionedEvent, window: TimelineWindow | null, offsetX = 0, offsetY = 0): boolean {
  return !window || (event.x + event.width + offsetX >= window.left && event.x + offsetX <= window.right &&
    event.y + event.height + offsetY >= window.top && event.y + offsetY <= window.bottom);
}
