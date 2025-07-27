import { describe, it, expect } from 'vitest';
import { computeLayout, calculateTimelineHeight, calculateTimelineWidth } from '../lib/computeLayout';
import { TimelineData } from '../lib/types';

describe('computeLayout', () => {
  it('should return empty array for empty data', () => {
    const result = computeLayout([]);
    expect(result).toEqual([]);
  });

  it('should calculate layout for single lane with point events', () => {
    const data: TimelineData = [
      {
        name: 'Test Lane',
        events: [
          { start: 2000, label: 'Event 1' },
          { start: 2010, label: 'Event 2' }
        ]
      }
    ];

    const result = computeLayout(data);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
  });

  it('should calculate layout for single lane with range events', () => {
    const data: TimelineData = [
      {
        name: 'Test Lane',
        events: [
          { start: 2000, end: 2010, label: 'Range Event 1' },
          { start: 2015, end: 2020, label: 'Range Event 2' }
        ]
      }
    ];

    const result = computeLayout(data);
    expect(result).toHaveLength(1);
    expect(result[0]).toHaveLength(2);
  });
});

describe('calculateTimelineHeight', () => {
  it('should return 0 for empty data', () => {
    const result = calculateTimelineHeight([]);
    expect(result).toBe(0);
  });

  it('should calculate height based on year range', () => {
    const data: TimelineData = [
      {
        name: 'Test Lane',
        events: [
          { start: 2000, label: 'Event 1' },
          { start: 2020, label: 'Event 2' }
        ]
      }
    ];

    const result = calculateTimelineHeight(data);
    expect(result).toBeGreaterThan(0);
  });
});

describe('calculateTimelineWidth', () => {
  it('should calculate width based on lane count', () => {
    expect(calculateTimelineWidth(1)).toBe(240);
    expect(calculateTimelineWidth(3)).toBe(720);
    expect(calculateTimelineWidth(5)).toBe(1200);
  });
});