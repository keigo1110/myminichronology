import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import Home from '../app/page';
import { ThemeProvider } from '../app/providers';
import { parseExcel } from '../lib/parseExcel';
import { AppMessageError } from '../i18n/errors';

vi.mock('../lib/parseExcel', async (original) => ({ ...await original<object>(), parseExcel: vi.fn() }));

describe('Home file loading and retained settings', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    document.documentElement.setAttribute('data-locale', 'ja');
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: vi.fn() });
  });
  afterEach(() => vi.restoreAllMocks());
  function upload(container: HTMLElement, name: string) {
    fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [new File(['x'], name)] } });
  }
  const result = { lanes: [
    { name: 'A', events: [{ start: 2000, label: 'Target' }, { start: 2010, label: 'Other' }] },
    { name: 'B', events: [{ start: 2005, label: 'Hidden' }] },
  ], warnings: [], truncatedSheets: 0 };

  it('runs the real page, retains filters on layout changes, and keeps data on parse failure', async () => {
    vi.mocked(parseExcel).mockResolvedValueOnce(result).mockRejectedValueOnce(new AppMessageError('parse.noValidData'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const { container } = render(<ThemeProvider><Home /></ThemeProvider>);
    upload(container, 'valid.xlsx');
    await screen.findByRole('button', { name: /Target/ });
    fireEvent.click(screen.getByRole('button', { name: 'B' }));
    fireEvent.click(screen.getByRole('button', { name: 'Bを前へ移動' }));
    const search = screen.getByRole('textbox', { name: '表示中の出来事を検索' });
    fireEvent.change(search, { target: { value: 'Target' } });
    fireEvent.change(screen.getByRole('slider'), { target: { value: '40' } });
    fireEvent.click(screen.getByRole('button', { name: '縦横入れ替え' }));
    expect(search).toHaveValue('Target');
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Bを前へ移動' })).toBeDisabled();
    upload(container, 'broken.xlsx');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('有効なデータ'));
    expect(screen.getByRole('button', { name: /Target/ })).toBeInTheDocument();
    expect(search).toHaveValue('Target');
    expect(screen.getByRole('button', { name: 'B' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: /Target/ }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Target');
  });
  it('accepts early years and ignores internal drag data at the page boundary', async () => {
    vi.mocked(parseExcel).mockResolvedValue({ lanes: [{ name: 'Early', events: [{ start: 1, label: 'Early event' }, { start: 9, label: 'Later event' }] }], warnings: [], truncatedSheets: 0 });
    const { container } = render(<ThemeProvider><Home /></ThemeProvider>);
    upload(container, 'early.xlsx');
    await screen.findByRole('button', { name: /Early event/ });
    expect(screen.getByRole('spinbutton', { name: '開始年' })).toHaveValue(0);
    fireEvent.drop(screen.getByRole('main'), { dataTransfer: { types: ['application/x-timeline-lane'], files: [] } });
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
  it('validates file size in the real page before invoking the parser', async () => {
    const { container } = render(<ThemeProvider><Home /></ThemeProvider>);
    const file = new File(['x'], 'large.xlsx'); Object.defineProperty(file, 'size', { value: 11 * 1024 * 1024 });
    fireEvent.change(container.querySelector('input[type=file]')!, { target: { files: [file] } });
    expect(await screen.findByRole('alert')).toHaveTextContent('10MB');
    expect(parseExcel).not.toHaveBeenCalled();
  });
});
