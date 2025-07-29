import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Header } from '../components/Header';

// DraggableLaneListのモック
vi.mock('../components/DraggableLaneList', () => ({
  DraggableLaneList: ({ lanes, selectedLanes, onLaneSelectionChange, onLaneOrderChange }: any) => (
    <div data-testid="draggable-lane-list">
      {lanes.map((lane: string) => (
        <button
          key={lane}
          onClick={() => onLaneSelectionChange(selectedLanes.includes(lane)
            ? selectedLanes.filter((l: string) => l !== lane)
            : [...selectedLanes, lane]
          )}
          data-testid={`lane-${lane}`}
        >
          {lane}
        </button>
      ))}
    </div>
  )
}));

describe('Header', () => {
  const mockProps = {
    onFileDrop: vi.fn(),
    onPdfExport: vi.fn(),
    loading: false,
    error: null,
    exporting: false,
    exportError: null,
    hasData: true,
    lanes: ['政治', '経済', '文化'],
    selectedLanes: ['政治', '経済'],
    onLaneSelectionChange: vi.fn(),
    onLaneOrderChange: vi.fn(),
    yearRange: { min: 1900, max: 2100 },
    onYearRangeChange: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with title', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByText('ミニクロ')).toBeInTheDocument();
  });

  it('should render year height adjustment when data is available', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByTestId('HeightIcon')).toBeInTheDocument();
  });

  it('should expand filter options when expand button is clicked', () => {
    render(<Header {...mockProps} />);
    const expandButton = screen.getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton!);

    expect(screen.getByText('年代範囲:')).toBeInTheDocument();
    expect(screen.getByLabelText('開始年')).toBeInTheDocument();
    expect(screen.getByLabelText('終了年')).toBeInTheDocument();
  });

  it('should render year range input fields', () => {
    render(<Header {...mockProps} />);
    const expandButton = screen.getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton!);

    const startYearInput = screen.getByLabelText('開始年');
    const endYearInput = screen.getByLabelText('終了年');

    expect(startYearInput).toBeInTheDocument();
    expect(endYearInput).toBeInTheDocument();
    expect(startYearInput).toHaveValue(1900);
    expect(endYearInput).toHaveValue(2100);
  });

  it('should call onYearRangeChange when year range is modified', () => {
    render(<Header {...mockProps} />);
    const expandButton = screen.getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton!);

    const startYearInput = screen.getByLabelText('開始年');
    fireEvent.change(startYearInput, { target: { value: '1950' } });
    fireEvent.blur(startYearInput);

    expect(mockProps.onYearRangeChange).toHaveBeenCalledWith([1950, 2100]);
  });

  it('should render year range reset button', () => {
    render(<Header {...mockProps} />);
    const expandButton = screen.getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton!);

    const resetButtons = screen.getAllByTestId('RestartAltIcon');
    expect(resetButtons.length).toBeGreaterThan(0);
  });

  it('should render DraggableLaneList in the right section', () => {
    render(<Header {...mockProps} />);
    const expandButton = screen.getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton!);

    expect(screen.getByTestId('draggable-lane-list')).toBeInTheDocument();
  });

  it('should render lane selection reset button', () => {
    render(<Header {...mockProps} />);
    const expandButton = screen.getByTestId('ExpandMoreIcon').closest('button');
    fireEvent.click(expandButton!);

    const resetButtons = screen.getAllByTestId('RestartAltIcon');
    expect(resetButtons.length).toBeGreaterThan(1); // 年代範囲とレーン選択の2つのリセットボタン
  });

  it('should not show year height adjustment when no data is available', () => {
    render(<Header {...mockProps} hasData={false} />);
    expect(screen.queryByTestId('HeightIcon')).not.toBeInTheDocument();
  });

  it('should render file upload button', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByTestId('CloudUploadIcon')).toBeInTheDocument();
  });

  it('should render PDF export button when data is available', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByTestId('PictureAsPdfIcon')).toBeInTheDocument();
  });

  it('should render help button', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByTestId('HelpOutlineIcon')).toBeInTheDocument();
  });

  it('should render expand/collapse button', () => {
    render(<Header {...mockProps} />);
    expect(screen.getByTestId('ExpandMoreIcon')).toBeInTheDocument();
  });
});