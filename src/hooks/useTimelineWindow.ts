import { useEffect, useState, type RefObject } from 'react';

export interface TimelineWindow { top: number; bottom: number; left: number; right: number }
const OVERSCAN = 500;

/** 年表全体の寸法は保ち、表示範囲に交差するイベントだけをマウントする。 */
export function useTimelineWindow(root: RefObject<HTMLElement | null>, enabled: boolean): TimelineWindow | null {
  const [window, setWindow] = useState<TimelineWindow>({ top: 0, bottom: 2500, left: 0, right: 2500 });
  useEffect(() => {
    const element = root.current;
    const viewport = element?.closest<HTMLElement>('[data-timeline-viewport]');
    if (!enabled || !element || !viewport) return;
    let frame: number | null = null;
    const update = () => {
      frame = null;
      const rect = element.getBoundingClientRect();
      const view = viewport.getBoundingClientRect();
      const next = { top: view.top - rect.top - OVERSCAN, bottom: view.bottom - rect.top + OVERSCAN,
        left: view.left - rect.left - OVERSCAN, right: view.right - rect.left + OVERSCAN };
      setWindow((previous) => previous && Object.keys(next).every((key) =>
        Math.abs(previous[key as keyof TimelineWindow] - next[key as keyof TimelineWindow]) < 1)
        ? previous : next);
    };
    const schedule = () => { if (frame == null) frame = requestAnimationFrame(update); };
    update();
    viewport.addEventListener('scroll', schedule, { passive: true });
    const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(schedule);
    observer?.observe(viewport);
    observer?.observe(element);
    return () => {
      viewport.removeEventListener('scroll', schedule);
      observer?.disconnect();
      if (frame != null) cancelAnimationFrame(frame);
    };
  }, [enabled, root]);
  return enabled ? window : null;
}
