import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { DraggableLaneList } from '../components/DraggableLaneList';
import { LocaleProvider } from '../i18n/LocaleProvider';

describe('DraggableLaneList', () => {
  const mockLanes = ['政治', '経済', '文化'];
  const mockSelectedLanes = ['政治', '経済'];
  const mockOnLaneSelectionChange = vi.fn();
  const mockOnLaneOrderChange = vi.fn();

  beforeEach(() => {
    mockOnLaneSelectionChange.mockClear();
    mockOnLaneOrderChange.mockClear();
  });

  it('should render lane chips', () => {
    render(
      <DraggableLaneList
        lanes={mockLanes}
        selectedLanes={mockSelectedLanes}
        onLaneSelectionChange={mockOnLaneSelectionChange}
        onLaneOrderChange={mockOnLaneOrderChange}
      />
    );

    expect(screen.getByText('政治')).toBeInTheDocument();
    expect(screen.getByText('経済')).toBeInTheDocument();
    expect(screen.getByText('文化')).toBeInTheDocument();
  });

  it('should show selected lanes as filled chips', () => {
    render(
      <DraggableLaneList
        lanes={mockLanes}
        selectedLanes={mockSelectedLanes}
        onLaneSelectionChange={mockOnLaneSelectionChange}
        onLaneOrderChange={mockOnLaneOrderChange}
      />
    );

    // 選択されたレーンはfilled、選択されていないレーンはoutlined
    const politicalChip = screen.getByText('政治').closest('.MuiChip-root');
    const culturalChip = screen.getByText('文化').closest('.MuiChip-root');

    expect(politicalChip).toHaveClass('MuiChip-filled');
    expect(culturalChip).toHaveClass('MuiChip-outlined');
  });

  it('should call onLaneSelectionChange when chip is clicked', () => {
    render(
      <DraggableLaneList
        lanes={mockLanes}
        selectedLanes={mockSelectedLanes}
        onLaneSelectionChange={mockOnLaneSelectionChange}
        onLaneOrderChange={mockOnLaneOrderChange}
      />
    );

    const culturalChip = screen.getByText('文化');
    fireEvent.click(culturalChip);

    expect(mockOnLaneSelectionChange).toHaveBeenCalledWith(['政治', '経済', '文化']);
  });

  it('should remove lane from selection when selected chip is clicked', () => {
    render(
      <DraggableLaneList
        lanes={mockLanes}
        selectedLanes={mockSelectedLanes}
        onLaneSelectionChange={mockOnLaneSelectionChange}
        onLaneOrderChange={mockOnLaneOrderChange}
      />
    );

    const politicalChip = screen.getByText('政治');
    fireEvent.click(politicalChip);

    expect(mockOnLaneSelectionChange).toHaveBeenCalledWith(['経済']);
  });

  it('should render draggable chips', () => {
    render(
      <DraggableLaneList
        lanes={mockLanes}
        selectedLanes={mockSelectedLanes}
        onLaneSelectionChange={mockOnLaneSelectionChange}
        onLaneOrderChange={mockOnLaneOrderChange}
      />
    );

    // すべてのチップがdraggable属性を持っていることを確認
    const chips = mockLanes.map((name) => screen.getByRole('button', { name }));
    chips.forEach(chip => {
      expect(chip).toHaveAttribute('draggable', 'true');
    });
  });

  it('supports accessible reordering and keeps internal drops from the file drop handler', () => {
    const outerDrop = vi.fn();
    render(<LocaleProvider><div onDrop={outerDrop}><DraggableLaneList lanes={mockLanes} selectedLanes={mockSelectedLanes}
      onLaneSelectionChange={mockOnLaneSelectionChange} onLaneOrderChange={mockOnLaneOrderChange} /></div></LocaleProvider>);
    expect(screen.getByRole('button', { name: '政治' })).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(screen.getByRole('button', { name: '文化を前へ移動' }));
    expect(mockOnLaneOrderChange).toHaveBeenLastCalledWith(['政治', '文化', '経済']);
    const transfer = { types: ['application/x-timeline-lane'], setData: vi.fn() };
    fireEvent.dragStart(screen.getByRole('button', { name: '政治' }), { dataTransfer: transfer });
    fireEvent.drop(screen.getByRole('button', { name: '文化' }), { dataTransfer: transfer });
    expect(mockOnLaneOrderChange).toHaveBeenLastCalledWith(['経済', '文化', '政治']);
    expect(outerDrop).not.toHaveBeenCalled();
  });
});
