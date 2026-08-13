import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { Header } from '../components/Header';
import { ThemeProvider } from '../app/providers';

function renderHeader(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}

vi.mock('../components/DraggableLaneList', () => ({
  DraggableLaneList: ({
    lanes,
    selectedLanes,
    onLaneSelectionChange,
  }: {
    lanes: string[];
    selectedLanes: string[];
    onLaneSelectionChange: (lanes: string[]) => void;
    onLaneOrderChange?: (lanes: string[]) => void;
  }) => (
    <div data-testid="draggable-lane-list">
      {lanes.map((lane: string) => (
        <button
          key={lane}
          onClick={() =>
            onLaneSelectionChange(
              selectedLanes.includes(lane)
                ? selectedLanes.filter((l: string) => l !== lane)
                : [...selectedLanes, lane]
            )
          }
          data-testid={`lane-${lane}`}
        >
          {lane}
        </button>
      ))}
    </div>
  ),
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
    activeYearRange: [1900, 2100] as [number, number],
    onYearRangeChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render header with title', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByAltText('ミニクロ')).toBeInTheDocument();
  });

  it('should render year height adjustment when data is available', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByTestId('HeightIcon')).toBeInTheDocument();
  });

  it('should automatically expand filter options when data is available', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByText('年代範囲:')).toBeInTheDocument();
    expect(screen.getByLabelText('開始年')).toBeInTheDocument();
    expect(screen.getByLabelText('終了年')).toBeInTheDocument();
  });

  it('should not expand filter options when no data is available', () => {
    renderHeader(<Header {...mockProps} hasData={false} />);
    expect(screen.queryByText('年代範囲:')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('開始年')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('終了年')).not.toBeInTheDocument();
  });

  it('should toggle filter options when expand button is clicked', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByText('年代範囲:')).toBeInTheDocument();
    const expandButton = screen.getByTestId('ExpandLessIcon').closest('button');
    fireEvent.click(expandButton!);
    expect(screen.getByTestId('ExpandMoreIcon')).toBeInTheDocument();
  });

  it('should render year range input fields', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByLabelText('開始年')).toHaveValue(1900);
    expect(screen.getByLabelText('終了年')).toHaveValue(2100);
  });

  it('should follow a committed year range without effect-based state syncing', () => {
    const { rerender } = renderHeader(
      <Header {...mockProps} activeYearRange={[1950, 2000]} />
    );
    expect(screen.getByLabelText('開始年')).toHaveValue(1950);
    expect(screen.getByLabelText('終了年')).toHaveValue(2000);

    rerender(
      <ThemeProvider>
        <Header {...mockProps} activeYearRange={[1960, 1990]} />
      </ThemeProvider>
    );
    expect(screen.getByLabelText('開始年')).toHaveValue(1960);
    expect(screen.getByLabelText('終了年')).toHaveValue(1990);
  });

  it('should call onYearRangeChange when year range is modified', () => {
    renderHeader(<Header {...mockProps} />);
    const startYearInput = screen.getByLabelText('開始年');
    fireEvent.change(startYearInput, { target: { value: '1950' } });
    fireEvent.blur(startYearInput);
    expect(mockProps.onYearRangeChange).toHaveBeenCalledWith([1950, 2100]);
  });

  it('should render year range reset button', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getAllByTestId('RestartAltIcon').length).toBeGreaterThan(0);
  });

  it('should render DraggableLaneList in the right section', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByTestId('draggable-lane-list')).toBeInTheDocument();
  });

  it('should render lane selection reset button', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getAllByTestId('RestartAltIcon').length).toBeGreaterThan(1);
  });

  it('should render lane selection label', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByText('レーン:')).toBeInTheDocument();
  });

  it('should render search in the filter row', () => {
    renderHeader(<Header {...mockProps} searchQuery="" onSearchQueryChange={vi.fn()} />);
    expect(screen.getByLabelText('表示中の出来事を検索')).toBeInTheDocument();
  });

  it('should render year-range display mode with clear labels', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByLabelText('年代範囲の見せ方')).toBeInTheDocument();
    expect(screen.getByText('拡大して再配置')).toBeInTheDocument();
  });

  it('should not show year height adjustment when no data is available', () => {
    renderHeader(<Header {...mockProps} hasData={false} />);
    expect(screen.queryByTestId('HeightIcon')).not.toBeInTheDocument();
  });

  it('should render file upload button', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByTestId('CloudUploadIcon')).toBeInTheDocument();
  });

  it('should render PDF export button when data is available', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByTestId('PictureAsPdfIcon')).toBeInTheDocument();
  });

  it('should show progress and disable PDF export while generating', () => {
    renderHeader(<Header {...mockProps} exporting />);

    const button = screen.getByRole('button', { name: 'PDFを生成中…' });
    expect(button).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryByTestId('PictureAsPdfIcon')).not.toBeInTheDocument();
  });

  it('should expose determinate PDF page progress', () => {
    renderHeader(
      <Header
        {...mockProps}
        exporting
        exportProgress={{ completed: 2, total: 4 }}
      />
    );

    expect(screen.getByRole('button', { name: 'PDFを生成中… 50%' })).toBeDisabled();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
  });

  it('should render color mode toggle', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByLabelText('ダークモードに切替')).toBeInTheDocument();
  });

  it('should render orientation swap button when data is available', () => {
    const onOrientationChange = vi.fn();
    renderHeader(
      <Header
        {...mockProps}
        orientation="vertical"
        onOrientationChange={onOrientationChange}
      />
    );
    const swap = screen.getByRole('button', { name: '縦横入れ替え' });
    expect(swap).toBeInTheDocument();
    fireEvent.click(swap);
    expect(onOrientationChange).toHaveBeenCalledWith('horizontal');
  });

  it('should not render orientation swap when no data', () => {
    renderHeader(<Header {...mockProps} hasData={false} />);
    expect(screen.queryByRole('button', { name: '縦横入れ替え' })).not.toBeInTheDocument();
  });

  it('should toggle event labels from vertical to horizontal with one button', () => {
    const onLabelOrientationChange = vi.fn();
    renderHeader(
      <Header
        {...mockProps}
        labelOrientation="vertical"
        onLabelOrientationChange={onLabelOrientationChange}
      />
    );

    const toggle = screen.getByRole('button', {
      name: '出来事ラベルを横書きに切替',
    });
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByTestId('TextRotationNoneIcon')).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(onLabelOrientationChange).toHaveBeenCalledWith('horizontal');
  });

  it('should toggle event labels from horizontal back to vertical', () => {
    const onLabelOrientationChange = vi.fn();
    renderHeader(
      <Header
        {...mockProps}
        labelOrientation="horizontal"
        onLabelOrientationChange={onLabelOrientationChange}
      />
    );

    const toggle = screen.getByRole('button', {
      name: '出来事ラベルを縦書きに切替',
    });
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByTestId('TextRotateVerticalIcon')).toBeInTheDocument();

    fireEvent.click(toggle);

    expect(onLabelOrientationChange).toHaveBeenCalledWith('vertical');
  });

  it('should prevent repeated label toggles while layout is pending', () => {
    const onLabelOrientationChange = vi.fn();
    renderHeader(
      <Header
        {...mockProps}
        labelOrientation="vertical"
        labelOrientationPending
        onLabelOrientationChange={onLabelOrientationChange}
      />
    );

    const toggle = screen.getByRole('button', {
      name: '出来事ラベルを横書きに切替',
    });
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);
    expect(onLabelOrientationChange).not.toHaveBeenCalled();
  });

  it('should hide the event-label toggle when no data is loaded', () => {
    renderHeader(<Header {...mockProps} hasData={false} />);
    expect(
      screen.queryByRole('button', { name: /出来事ラベルを.+書きに切替/ })
    ).not.toBeInTheDocument();
  });

  it('should make the header inert while label layout is pending', () => {
    renderHeader(<Header {...mockProps} labelOrientationPending />);
    expect(screen.getByRole('banner')).toHaveAttribute('inert');
    expect(screen.getByRole('banner')).toHaveAttribute('aria-busy', 'true');
  });

  it('should render help button', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByRole('link', { name: '使い方ガイド' })).toBeInTheDocument();
  });

  it('should render language toggle', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByLabelText('Switch to English')).toBeInTheDocument();
  });

  it('should render expand/collapse button', () => {
    renderHeader(<Header {...mockProps} />);
    expect(screen.getByTestId('ExpandLessIcon')).toBeInTheDocument();
  });

  it('should show expand icon when no data is available', () => {
    renderHeader(<Header {...mockProps} hasData={false} />);
    expect(screen.getByTestId('ExpandMoreIcon')).toBeInTheDocument();
  });

  it('should handle file size validation through onFileDrop', () => {
    const mockOnFileDrop = vi
      .fn()
      .mockReturnValue('ファイルサイズが大きすぎます（10MB以下にしてください）');
    renderHeader(<Header {...mockProps} onFileDrop={mockOnFileDrop} />);
    const fileInput = screen.getByRole('button', { name: /Excelファイルをアップロード/i });
    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    fireEvent.change(fileInput.querySelector('input')!, { target: { files: [file] } });
    expect(mockOnFileDrop).toHaveBeenCalledWith(file);
  });

  it('should handle successful file drop through onFileDrop', () => {
    const mockOnFileDrop = vi.fn().mockReturnValue(null);
    renderHeader(<Header {...mockProps} onFileDrop={mockOnFileDrop} />);
    const fileInput = screen.getByRole('button', { name: /Excelファイルをアップロード/i });
    const file = new File(['test content'], 'test.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    fireEvent.change(fileInput.querySelector('input')!, { target: { files: [file] } });
    expect(mockOnFileDrop).toHaveBeenCalledWith(file);
  });
});
