import { freezePdfImages } from '../lib/pdfImages';

describe('PDF image snapshot', () => {
  let loads: string[];
  const originalDecode = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'decode');
  class TestImage {
    naturalWidth = 1000; naturalHeight = 500;
    crossOrigin = ''; referrerPolicy = ''; decoding = '';
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    set src(value: string) {
      if (!value) return;
      loads.push(value);
      if (!value.includes('pending')) queueMicrotask(() => value.includes('bad') ? this.onerror?.() : this.onload?.());
    }
  }
  beforeEach(() => {
    loads = [];
    vi.stubGlobal('Image', TestImage);
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockReturnValue('data:image/png;base64,frozen');
    Object.defineProperty(HTMLImageElement.prototype, 'decode', { configurable: true, value: vi.fn().mockResolvedValue(undefined) });
  });
  afterEach(() => {
    if (originalDecode) Object.defineProperty(HTMLImageElement.prototype, 'decode', originalDecode);
    else Reflect.deleteProperty(HTMLImageElement.prototype, 'decode');
    vi.restoreAllMocks(); vi.unstubAllGlobals(); vi.useRealTimers();
  });
  it('fetches each URL once and freezes all copies as PNG', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<img src="https://example.com/good.png"><img src="https://example.com/good.png">';
    expect(await freezePdfImages(root, '画像なし')).toBe(0);
    expect(loads).toEqual(['https://example.com/good.png']);
    expect(Array.from(root.querySelectorAll('img'), (image) => image.src)).toEqual(['data:image/png;base64,frozen', 'data:image/png;base64,frozen']);
  });
  it('counts already failed thumbnails and replaces unavailable images', async () => {
    const root = document.createElement('div');
    root.innerHTML = '<div data-image-status="failed">画像なし</div><img src="https://example.com/bad.png">';
    expect(await freezePdfImages(root, '画像なし')).toBe(2);
    expect(root.querySelector('img')).toBeNull(); expect(root.textContent).toBe('画像なし画像なし');
  });
  it('times out stalled images without blocking PDF generation', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div'); root.innerHTML = '<img src="https://example.com/pending.png">';
    const pending = freezePdfImages(root, '画像なし');
    await vi.advanceTimersByTimeAsync(5_000);
    expect(await pending).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
  });
  it('aborts image loading and releases all timers', async () => {
    vi.useFakeTimers();
    const root = document.createElement('div'); root.innerHTML = '<img src="https://example.com/pending.png">';
    const controller = new AbortController();
    const rejected = expect(freezePdfImages(root, '画像なし', controller.signal)).rejects.toMatchObject({ name: 'AbortError' });
    controller.abort(); await rejected;
    expect(vi.getTimerCount()).toBe(0);
  });
});
