import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ThemeProvider } from '../app/providers';
import { EventItem } from '../components/EventItem';
import type { PositionedEvent } from '../lib/types';

const event: PositionedEvent = {
  start: 2000,
  label: '表示方向を切り替えるラベル',
  displayStyle: 'label',
  x: 0,
  y: 0,
  width: 240,
  height: 40,
};

function renderItem(labelOrientation: 'vertical' | 'horizontal') {
  return render(
    <ThemeProvider>
      <EventItem event={event} labelOrientation={labelOrientation} />
    </ThemeProvider>
  );
}

describe('EventItem label orientation', () => {
  it('renders label-style events vertically by default', () => {
    renderItem('vertical');
    const item = screen.getByText(event.label).closest('[data-event-label]');
    expect(item).toHaveAttribute('data-event-label-orientation', 'vertical');
    expect(screen.getByText(event.label)).toHaveStyle({ writingMode: 'vertical-rl' });
  });

  it('renders label-style events horizontally when selected', () => {
    renderItem('horizontal');
    const item = screen.getByText(event.label).closest('[data-event-label]');
    expect(item).toHaveAttribute('data-event-label-orientation', 'horizontal');
    expect(screen.getByText(event.label)).toHaveStyle({ writingMode: 'horizontal-tb' });
  });

  it('recovers from an image error when the image URL changes', () => {
    const { container, rerender } = render(
      <ThemeProvider>
        <EventItem event={{ ...event, imageUrl: 'https://example.com/old.png' }} />
      </ThemeProvider>
    );

    fireEvent.error(container.querySelector('img')!);
    expect(screen.getByText('画像なし')).toBeInTheDocument();

    rerender(
      <ThemeProvider>
        <EventItem event={{ ...event, imageUrl: 'https://example.com/new.png' }} />
      </ThemeProvider>
    );
    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/new.png'
    );
    expect(screen.queryByText('画像なし')).not.toBeInTheDocument();
  });
});
